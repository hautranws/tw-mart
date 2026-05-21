import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import nodemailer from "nodemailer";

// Giữ nguyên các hàm import thanh toán của bạn
import { createVNPayUrl } from "../../../../lib/payment/vnpay";
import { createMoMoUrl } from "../../../../lib/payment/momo";
import { createPayOSLink } from "../../../../lib/payment/payos";

// ==================================================================
// ⚙️ CẤU HÌNH GỬI THÔNG BÁO (TWMED - SIÊU THỊ HÀNG ĐÀI LOAN)
// ==================================================================

const EMAIL_CONFIG = {
  user: "thienduoc.thienhau@gmail.com",
  pass: "raew vtrg lkda ocwd",
  staffEmail: "hautranws@gmail.com,phamanhthu1804@gmail.com",
};

// ==================================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      items,
      customer,
      paymentMethod,
      couponCode,
      userId: clientUserId,
    } = body;
    const { name, phone, address, note } = customer;

    // --- BƯỚC 0: TÍNH TOÁN LẠI GIÁ & MÃ GIẢM GIÁ ---
    // [MỚI] Tính lại subtotal, ưu tiên giá của variant
    const serverSubTotal = items.reduce((sum: number, item: any) => {
      // Quan trọng: Lấy giá từ phân loại đã chọn nếu có, nếu không thì lấy giá gốc.
      // Cần có bước xác thực giá này với DB ở môi trường production để đảm bảo an toàn
      const price = item.selectedVariant
        ? item.selectedVariant.price
        : item.price;
      return sum + price * item.quantity;
    }, 0);

    let discountAmount = 0;
    let finalAmount = serverSubTotal;
    let appliedCouponCode = null;

    if (couponCode) {
      // 👈 TRUY VẤN MÃ GIẢM GIÁ TỪ BẢNG coupons_tw
      const { data: coupon } = await supabaseAdmin
        .from("coupons_tw")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .single();

      if (coupon) {
        const now = new Date();
        const expiry = coupon.expiry_date ? new Date(coupon.expiry_date) : null;
        const isExpired = expiry && now > expiry;
        const isLimitReached =
          coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit;
        const isMinOrderMet = serverSubTotal >= (coupon.min_order_value || 0);

        if (
          coupon.is_active &&
          !isExpired &&
          !isLimitReached &&
          isMinOrderMet
        ) {
          if (coupon.discount_type === "percent") {
            discountAmount = (serverSubTotal * coupon.discount_value) / 100;
            // Kiểm tra giới hạn giảm tối đa
            if (
              coupon.max_discount_amount > 0 &&
              discountAmount > coupon.max_discount_amount
            ) {
              discountAmount = coupon.max_discount_amount;
            }
          } else {
            discountAmount = coupon.discount_value;
          }
          if (discountAmount > serverSubTotal) discountAmount = serverSubTotal;
          finalAmount = serverSubTotal - discountAmount;
          appliedCouponCode = coupon.code;

          // 👈 CẬP NHẬT SỐ LƯỢNG MÃ ĐÃ DÙNG VÀO BẢNG coupons_tw
          await supabaseAdmin
            .from("coupons_tw")
            .update({ used_count: coupon.used_count + 1 })
            .eq("id", coupon.id);
        }
      }
    }

    // --- BƯỚC 1: XỬ LÝ USER ---
    let userId = clientUserId;
    let isNewUser = false;

    if (!userId) {
      let formattedPhone = phone.trim();
      if (formattedPhone.startsWith("0"))
        formattedPhone = "84" + formattedPhone.substring(1);
      formattedPhone = formattedPhone.replace("+", "");
      const randomPassword = Math.random().toString(36).slice(-8) + "Aa1@";

      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          phone: formattedPhone,
          password: randomPassword,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: { full_name: name, address: address, phone: phone },
        });

      if (!createError && newUser) {
        userId = newUser.user.id;
        isNewUser = true;
      }
    }

    // --- BƯỚC 2: TẠO ĐƠN HÀNG VÀO BẢNG orders_tw ---
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders_tw")
      .insert([
        {
          user_id: userId,
          customer_name: name,
          phone_number: phone,
          address: address,
          total_amount: finalAmount,
          items: items,
          status: "đang xử lý",
          note: note,
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // ==================================================================
    // 🔥 GỬI THÔNG BÁO CHO CHỦ SHOP (TWMED)
    // ==================================================================
    (async () => {
      try {
        const orderId = orderData.id;
        const totalStr = finalAmount.toLocaleString("vi-VN");

        if (EMAIL_CONFIG.user && EMAIL_CONFIG.pass) {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: EMAIL_CONFIG.user, pass: EMAIL_CONFIG.pass },
          });

          const itemsHtml = items
            .map(
              (item: any) =>
                `<li>${item.title || item.name} - SL: <b>${item.quantity}</b></li>`,
            )
            .join("");

          let couponHtml = "";
          if (discountAmount > 0) {
            couponHtml = `<p style="color: green; font-size: 14px;"><b>🎁 Đã dùng mã:</b> ${appliedCouponCode} (Giảm ${discountAmount.toLocaleString()}đ)</p>`;
          }

          const mailOptions = {
            from: `"TWMED - Đơn Hàng Mới" <${EMAIL_CONFIG.user}>`,
            to: EMAIL_CONFIG.staffEmail,
            subject: `🇹🇼 ĐƠN ĐÀI LOAN MỚI - Khách: ${name} - ${totalStr}đ`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #ed1c24; border-radius: 8px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #00205b; border-bottom: 2px solid #ed1c24; padding-bottom: 10px;">📦 ĐƠN HÀNG TỪ TWMED!</h2>
                <p><b>Khách hàng:</b> ${name}</p>
                <p><b>Điện thoại:</b> ${phone}</p>
                <p><b>Địa chỉ:</b> ${address}</p>
                <p><b>Ghi chú:</b> <i>${note || "Không có"}</i></p>
                <h3 style="background-color: #f3f4f6; padding: 10px;">🛒 Sản phẩm order:</h3>
                {/* [MỚI] Hiển thị cả phân loại trong email */}
                <ul>${items.map((item: any) => `<li>${item.title || item.name} ${item.selectedVariant ? `(<b>${item.selectedVariant.name}</b>)` : ""} - SL: <b>${item.quantity}</b></li>`).join("")}</ul>
                <p style="margin-top: 15px;">Giá gốc: ${serverSubTotal.toLocaleString()}đ</p>
                ${couponHtml}
                <h3 style="color: #dc2626; font-size: 20px; border-top: 1px dashed #ccc; padding-top: 15px;">
                  TỔNG THANH TOÁN: ${totalStr} VNĐ
                </h3>
              </div>`,
          };
          await transporter.sendMail(mailOptions);
        }
      } catch (err) {
        console.error("Thông báo lỗi:", err);
      }
    })();

    // --- BƯỚC 3: TRẢ LINK THANH TOÁN ---
    let paymentUrl = "";
    const orderId = orderData.id;
    const orderInfo = `Thanh toan don TWMED #${orderId}`;

    switch (paymentMethod) {
      case "VNPAY":
      case "ATM":
      case "VISA":
        paymentUrl = createVNPayUrl({
          orderId,
          amount: finalAmount,
          orderInfo,
        });
        break;
      case "MOMO":
        paymentUrl = await createMoMoUrl({
          orderId,
          amount: finalAmount,
          orderInfo,
        });
        break;
      case "BANK":
      case "PAYOS":
        const payOSData = await createPayOSLink({
          orderId: Math.floor(Date.now() / 1000),
          amount: finalAmount,
          description: orderInfo,
        });
        paymentUrl = payOSData.checkoutUrl;
        break;
    }

    return NextResponse.json({
      success: true,
      orderId,
      isNewUser,
      url: paymentUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
