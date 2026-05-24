import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import nodemailer from "nodemailer";

// Giữ nguyên các hàm import thanh toán của bạn

// ==================================================================
// ⚙️ CẤU HÌNH GỬI THÔNG BÁO (TWMED - SIÊU THỊ HÀNG ĐÀI LOAN)
// ==================================================================

const EMAIL_CONFIG = {
  user: "thienduoc.thienhau@gmail.com",
  pass: "raewvtrglkdaocwd", // Đã xóa khoảng trắng ở mật khẩu ứng dụng để tránh lỗi
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
    // [AN TOÀN HƠN] Lấy ID sản phẩm và ID biến thể từ giỏ hàng của khách
    const productIds = items.map((item: any) => item.id);

    // Truy vấn DB để lấy giá gốc và giá biến thể chính xác
    const { data: productsData, error: productsError } = await supabaseAdmin
      .from("products_tw")
      .select("id, price, variants, category_id")
      .in("id", productIds);

    if (productsError) throw productsError;

    // Tạo một bản đồ giá để tra cứu nhanh và an toàn
    const priceMap = new Map<string, number>();
    productsData.forEach((p) => {
      // Giá gốc
      priceMap.set(`product-${p.id}`, p.price);
      // Giá các biến thể
      if (p.variants) {
        try {
          const variants = JSON.parse(p.variants);
          if (Array.isArray(variants)) {
            variants.forEach((v) => {
              // Giả sử mỗi biến thể có id và price duy nhất
              if (v.name && v.price) {
                priceMap.set(`variant-${p.id}-${v.name}`, v.price);
              }
            });
          }
        } catch {}
      }
    });

    // [AN TOÀN] Tính lại tổng tiền trên server dựa vào giá từ DB
    const serverSubTotal = items.reduce((sum: number, item: any) => {
      let price = 0;
      if (item.selectedVariant && item.selectedVariant.name) {
        price =
          priceMap.get(`variant-${item.id}-${item.selectedVariant.name}`) ||
          priceMap.get(`product-${item.id}`) ||
          0;
      } else {
        price = priceMap.get(`product-${item.id}`) || 0;
      }
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

        // Báo lỗi cụ thể nếu mã không dùng được
        if (!coupon.is_active) {
          return NextResponse.json(
            { error: "Mã khuyến mãi đã bị khóa!" },
            { status: 400 },
          );
        }
        if (isExpired) {
          return NextResponse.json(
            { error: "Mã khuyến mãi đã hết hạn!" },
            { status: 400 },
          );
        }
        if (isLimitReached) {
          return NextResponse.json(
            { error: "Mã khuyến mãi đã hết lượt sử dụng!" },
            { status: 400 },
          );
        }
        if (!isMinOrderMet) {
          return NextResponse.json(
            {
              error: `Đơn hàng chưa đạt tối thiểu ${coupon.min_order_value.toLocaleString()}đ để dùng mã này!`,
            },
            { status: 400 },
          );
        }

        // TÍNH TOÁN TIỀN CHỈ TỪ CÁC SẢN PHẨM HỢP LỆ (Dựa theo Scope)
        let applicableSubTotal = 0;
        items.forEach((item: any) => {
          let price = priceMap.get(`product-${item.id}`) || 0;
          if (item.selectedVariant && item.selectedVariant.name) {
            price =
              priceMap.get(`variant-${item.id}-${item.selectedVariant.name}`) ||
              price;
          }

          const productInfo = productsData.find((p: any) => p.id === item.id);
          const categoryId = productInfo?.category_id || "";

          let isApplicable = true;
          if (coupon.scope === "include_category") {
            isApplicable = coupon.applied_items.includes(categoryId);
          } else if (coupon.scope === "exclude_category") {
            isApplicable = !coupon.applied_items.includes(categoryId);
          } else if (coupon.scope === "include_product") {
            isApplicable = coupon.applied_items.some(
              (id: any) => String(id) === String(item.id),
            );
          } else if (coupon.scope === "exclude_product") {
            isApplicable = !coupon.applied_items.some(
              (id: any) => String(id) === String(item.id),
            );
          }

          if (isApplicable) applicableSubTotal += price * item.quantity;
        });

        if (applicableSubTotal <= 0 && coupon.scope !== "all") {
          return NextResponse.json(
            {
              error:
                "Mã khuyến mãi không áp dụng cho các sản phẩm có trong giỏ hàng!",
            },
            { status: 400 },
          );
        }

        if (coupon.discount_type === "percent") {
          discountAmount = (applicableSubTotal * coupon.discount_value) / 100;
          if (
            coupon.max_discount_amount > 0 &&
            discountAmount > coupon.max_discount_amount
          ) {
            discountAmount = coupon.max_discount_amount;
          }
        } else {
          discountAmount = coupon.discount_value;
          if (discountAmount > applicableSubTotal)
            discountAmount = applicableSubTotal;
        }

        finalAmount = serverSubTotal - discountAmount;
        appliedCouponCode = coupon.code;

        await supabaseAdmin
          .from("coupons_tw")
          .update({ used_count: coupon.used_count + 1 })
          .eq("id", coupon.id);
      } else {
        return NextResponse.json(
          { error: "Mã khuyến mãi không tồn tại!" },
          { status: 400 },
        );
      }
    }

    // --- BƯỚC 1: XỬ LÝ USER ---
    let userId = clientUserId;
    let isNewUser = false;

    // [SỬA LỖI] Logic xử lý khách vãng lai (không đăng nhập)
    if (!userId) {
      let formattedPhone = phone.trim();
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "84" + formattedPhone.substring(1);
      }
      formattedPhone = formattedPhone.replace(/\D/g, ""); // Xóa các ký tự không phải số

      // 1. Tìm kiếm xem SĐT đã tồn tại trong hệ thống chưa
      const {
        data: { users },
        error: listError,
      } = await supabaseAdmin.auth.admin.listUsers();
      if (listError)
        throw new Error(`Lỗi tìm kiếm người dùng: ${listError.message}`);

      const existingUser = users.find((u) => u.phone === formattedPhone);

      if (existingUser) {
        // Nếu SĐT đã tồn tại, dùng luôn ID của user đó cho đơn hàng
        userId = existingUser.id;
      } else {
        // Nếu SĐT chưa có, tạo tài khoản mới
        const randomPassword = Math.random().toString(36).slice(-8) + "Aa1@";
        const { data: newUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            phone: formattedPhone,
            password: randomPassword,
            phone_confirm: true,
            user_metadata: { full_name: name, address: address, phone: phone },
          });

        if (createError)
          throw new Error(`Lỗi tạo tài khoản: ${createError.message}`);
        userId = newUser!.user.id;
        isNewUser = true;
      }
    }

    // --- BƯỚC 2: TẠO ĐƠN HÀNG VÀO BẢNG orders_tw ---
    // Chèn mã giảm giá vào Note vì bảng đơn hàng hiện tại có thể không có cột coupon_code
    const finalNote =
      note +
      (appliedCouponCode
        ? `\n\n[Hệ thống]: Đã áp mã ${appliedCouponCode}, giảm ${discountAmount.toLocaleString()}đ.`
        : "");

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
          note: finalNote,
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderId = orderData.id; // Khai báo orderId một lần duy nhất ở đây

    // ==================================================================
    // 🔥 GỬI THÔNG BÁO CHO CHỦ SHOP (TWMED)
    // ==================================================================
    try {
      const totalStr = finalAmount.toLocaleString("vi-VN");
      if (EMAIL_CONFIG.user && EMAIL_CONFIG.pass) {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
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
      console.error("Thông báo lỗi gửi mail:", err);
    }

    // --- BƯỚC 3: TRẢ VỀ KẾT QUẢ ĐƠN HÀNG (COD) ---
    return NextResponse.json({
      success: true,
      orderId,
      isNewUser,
      url: "", // Đã xóa các hình thức thanh toán online nên url rỗng
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
