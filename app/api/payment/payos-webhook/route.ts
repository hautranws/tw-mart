import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // PayOS sẽ gửi data về với cấu trúc có chứa 'success' và 'data'
    const { data, success } = body;

    // KHI KHÁCH CHUYỂN KHOẢN THÀNH CÔNG
    if (success === true && data) {
      const orderId = data.orderCode; // Mã đơn hàng mà PayOS trả về

      // Cập nhật trạng thái đơn hàng trong Database
      const { error } = await supabaseAdmin
        .from("orders")
        .update({ 
            payment_status: "paid", // Đổi thành Đã thanh toán
            // Bạn có thể thêm trường updated_at: new Date() nếu DB có yêu cầu
        }) 
        .eq("id", orderId);

      if (error) {
        console.error("Lỗi cập nhật đơn hàng:", error);
        return NextResponse.json({ success: false, message: "Lỗi Server" }, { status: 500 });
      }

      console.log(`✅ [PAYOS WEBHOOK] Đã xác nhận thanh toán thành công đơn #${orderId}`);
    }

    // BẮT BUỘC: Phải trả về Status 200 để PayOS biết web đã nhận được thông báo, 
    // nếu không PayOS sẽ gửi lại liên tục.
    return NextResponse.json({ success: true, message: "Webhook received" });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}