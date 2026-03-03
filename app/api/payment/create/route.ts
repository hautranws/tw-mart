import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import nodemailer from "nodemailer";

// Giữ nguyên các hàm import thanh toán của bạn
import { createVNPayUrl } from "../../../../lib/payment/vnpay";
import { createMoMoUrl } from "../../../../lib/payment/momo";
import { createPayOSLink } from "../../../../lib/payment/payos";

// ==================================================================
// ⚙️ CẤU HÌNH GỬI THÔNG BÁO (BẠN ĐIỀN THÔNG TIN VÀO ĐÂY NHÉ)
// ==================================================================

const EMAIL_CONFIG = {
  // 1. Email dùng để gửi thông báo (VD: nhathuocthienhau@gmail.com)
  user: "thienduoc.thienhau@gmail.com", 
  
  // 2. Mật khẩu ứng dụng 16 chữ cái (KHÔNG phải mật khẩu đăng nhập Gmail)
  pass: "raew vtrg lkda ocwd", 
  
  // 3. Email nhận thông báo khi có đơn mới (có thể giống email trên)
  staffEmail: "hautranws@gmail.com,phamanhthu1804@gmail.com",
};

const ZALO_CONFIG = {
  // 👇 1. App ID (Lấy từ ảnh bạn gửi lúc nãy)
  appId: "3298941731019507413", 
  
  // 👇 2. Secret Key (Vào trang Zalo Developer -> Cài đặt -> Copy Khóa bí mật)
  secretKey: "29SHEYUvS88YNm6peVST", 

  // 👇 3. Refresh Token (Lấy từ API Explorer, nhớ copy dòng Refresh Token chứ không phải Access Token)
  refreshToken: "QqLTAgms3Y9ZIbSlhJ049cDCMYkkANn37rLQDeLHIJuPBtGrYI8lHWS72nIQVbXQ9rbN8gzcQtiaL3CpldGjLp5HDHk-RH1I4M8pEPnPQsPNIrPtxMfmB5XtILwBJ4rN4pLICgbC2beDCJ44mKzi3mjlN6EVTdyd0r9PBCzANsDwDMqjyGWrF7Wx6pNG729x7W4n8Ay8Q4rW1qr2r05A3c80LG7N7mn4QmSYCi053bHcA1CEyb4jPsfV4p_1TXzBJMiO5C9u86bGQmq2-nHN26WsJM2l26WmQN9AVDrhVoHtOdjf-qDb55fiIdw9NM4jBr99Uu9SQoOp8KDqf3n81Gu-OLI9G3jT6saPBu0RH4bB66KPtpvUOaCFVZ7fSKjiVdmL9B5O2dTuAYv-uGus9aV-IseyeI0490",

  // 👇 4. ID Mẫu tin ZNS (Lấy sau khi Zalo duyệt mẫu)
  templateId: "ID_MAU_TIN_ZNS_CUA_BAN", 
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

    // --- BƯỚC 0: TÍNH TOÁN LẠI GIÁ & MÃ GIẢM GIÁ (GIỮ NGUYÊN) ---
    const serverSubTotal = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0,
    );

    let discountAmount = 0;
    let finalAmount = serverSubTotal;
    let appliedCouponCode = null;

    if (couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
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
          } else {
            discountAmount = coupon.discount_value;
          }

          if (discountAmount > serverSubTotal) discountAmount = serverSubTotal;
          finalAmount = serverSubTotal - discountAmount;
          appliedCouponCode = coupon.code;

          await supabaseAdmin
            .from("coupons")
            .update({ used_count: coupon.used_count + 1 })
            .eq("id", coupon.id);
        }
      }
    }

    // --- BƯỚC 1: XỬ LÝ USER (GIỮ NGUYÊN) ---

    let userId = clientUserId;
    let isNewUser = false;

    if (!userId) {
      let formattedPhone = phone.trim();
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "84" + formattedPhone.substring(1);
      }
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
      } else {
        console.log("User creation failed or exists:", createError?.message);
      }
    }

    // --- BƯỚC 2: TẠO ĐƠN HÀNG VÀO DB (GIỮ NGUYÊN) ---
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert([
        {
          user_id: userId,
          customer_name: name,
          phone: phone,
          address: address,
          total_price: serverSubTotal,
          final_price: finalAmount,
          discount_amount: discountAmount,
          coupon_code: appliedCouponCode,
          payment_method: paymentMethod,
          payment_status: "pending",
          note: note,
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // Lưu chi tiết sản phẩm
    const orderItemsData = items.map((item: any) => ({
      order_id: orderData.id,
      product_name: item.title || item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItemsData);

    if (itemsError) throw itemsError;

    // ==================================================================
    // 🔥 GỬI THÔNG BÁO (ĐÃ BẬT LOGIC GỬI EMAIL)
    // ==================================================================
    (async () => {
      try {
        const orderId = orderData.id;
        const totalStr = finalAmount.toLocaleString("vi-VN");

        // 1. GỬI EMAIL (Sẽ hoạt động khi bạn điền đúng EMAIL_CONFIG ở trên)
        if (EMAIL_CONFIG.user && EMAIL_CONFIG.pass && !EMAIL_CONFIG.user.includes("[THAY-DONG-NAY")) {
          console.log("🚀 Đang gửi Email báo đơn hàng...");
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
            couponHtml = `<p style="color: green;"><b>🎁 Đã dùng mã:</b> ${appliedCouponCode} (Giảm ${discountAmount.toLocaleString()}đ)</p>`;
          }

          const mailOptions = {
            from: `"Nhà thuốc Thiên Hậu" <${EMAIL_CONFIG.user}>`,
            to: EMAIL_CONFIG.staffEmail,
            subject: `🔔 ĐƠN MỚI #${orderId} - Khách: ${name} - Giá trị: ${totalStr}đ`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">📦 CÓ ĐƠN HÀNG MỚI!</h2>
                
                <p><b>Mã đơn hàng:</b> #${orderId}</p>
                <p><b>Khách hàng:</b> ${name}</p>
                <p><b>Điện thoại:</b> <a href="tel:${phone}" style="color: #d97706; font-weight: bold; text-decoration: none;">${phone}</a></p>
                <p><b>Địa chỉ nhận hàng:</b> ${address}</p>
                <p><b>Phương thức thanh toán:</b> ${paymentMethod}</p>
                <p><b>Ghi chú của khách:</b> <i>${note || "Không có"}</i></p>
                
                <h3 style="background-color: #f3f4f6; padding: 10px; margin-top: 20px;">🛒 Chi tiết sản phẩm:</h3>
                <ul style="line-height: 1.6;">${itemsHtml}</ul>
                
                <p>Giá gốc: ${serverSubTotal.toLocaleString()}đ</p>
                ${couponHtml}
                
                <h3 style="color: #dc2626; font-size: 20px; border-top: 1px dashed #ccc; padding-top: 15px;">
                  TỔNG THU: ${totalStr} VNĐ
                </h3>
                
                <p style="color: #4b5563; font-style: italic; margin-top: 20px;">Vui lòng kiểm tra và liên hệ khách hàng để xác nhận đơn!</p>
              </div>
                `,
          };

          await transporter.sendMail(mailOptions);
          console.log("✅ Gửi Email thành công!");
        } else {
           console.log("⚠️ Bỏ qua gửi Email vì chưa điền Cấu hình.");
        }

        // 2. GỬI TIN NHẮN ZALO ZNS (GIỮ NGUYÊN)
        if (ZALO_CONFIG.refreshToken && phone) {
            if (ZALO_CONFIG.templateId === "ID_MAU_TIN_ZNS_CUA_BAN") {
                 console.log("⚠️ CHƯA GỬI ZALO: Bạn chưa điền Template ID.");
            } else {
                 console.log("🚀 Đang xử lý Zalo ZNS...");
                 let newAccessToken = "";
                 try {
                     const tokenRes = await fetch("https://oauth.zaloapp.com/v4/oa/access_token", {
                         method: "POST",
                         headers: {
                             "Content-Type": "application/x-www-form-urlencoded",
                             "secret_key": ZALO_CONFIG.secretKey
                         },
                         body: new URLSearchParams({
                             refresh_token: ZALO_CONFIG.refreshToken,
                             app_id: ZALO_CONFIG.appId,
                             grant_type: "refresh_token"
                         })
                     });
                     const tokenData = await tokenRes.json();
                     if (tokenData.access_token) {
                         newAccessToken = tokenData.access_token;
                         console.log("✅ Đã làm mới Access Token Zalo thành công!");
                     }
                 } catch (tokenErr) {
                     console.error("❌ Lỗi kết nối Zalo Auth:", tokenErr);
                 }

                 if (newAccessToken) {
                     let zaloPhone = phone.trim();
                     if (zaloPhone.startsWith("0")) zaloPhone = "84" + zaloPhone.substring(1);
                     zaloPhone = zaloPhone.replace(/\D/g, '');

                     const znsRes = await fetch("https://business.openapi.zalo.me/message/template", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "access_token": newAccessToken 
                        },
                        body: JSON.stringify({
                            phone: zaloPhone,
                            template_id: ZALO_CONFIG.templateId,
                            template_data: {
                                customer_name: name,
                                order_code: String(orderId),
                                total_amount: totalStr + " đ",
                                status: "Đang xử lý"
                            },
                            tracking_id: String(orderId)
                        })
                     });

                     const znsData = await znsRes.json();
                     if (znsData.error !== 0) console.error("❌ Lỗi gửi ZNS:", znsData);
                 }
            }
        }

      } catch (notifyError) {
        console.error("❌ Lỗi gửi thông báo:", notifyError);
      }
    })();

    // --- BƯỚC 3: TRẢ LINK THANH TOÁN (ĐÃ THÊM PAYOS) ---
    let paymentUrl = "";
    const orderId = orderData.id;
    const orderInfo = `Thanh toan don #${orderId}`;
    const amountToPay = finalAmount;

    switch (paymentMethod) {
      case "COD":
        break;
      case "VNPAY":
      case "ATM":
      case "VISA":
        paymentUrl = createVNPayUrl({ orderId, amount: amountToPay, orderInfo });
        break;
      case "MOMO":
        paymentUrl = await createMoMoUrl({ orderId, amount: amountToPay, orderInfo });
        break;
      case "BANK":
      case "PAYOS":
        const payOSData = await createPayOSLink({ orderId: Number(orderId), amount: amountToPay, description: orderInfo });
        paymentUrl = payOSData.checkoutUrl;
        break;
      default:
        break;
    }

    // --- BƯỚC 4: TRẢ KẾT QUẢ ---
    return NextResponse.json({
      success: true,
      orderId: orderId,
      isNewUser: isNewUser,
      url: paymentUrl,
    });
  } catch (error: any) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}