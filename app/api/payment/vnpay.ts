import crypto from "crypto";
import querystring from "qs";
import { format } from "date-fns";

// CẤU HÌNH TỪ VNPAY GỬI MAIL CHO BẠN
const tmnCode = "D123456"; // Mã Website (Terminal ID)
const secretKey = "YOUR_SECRET_KEY"; // Chuỗi bí mật (Hash Secret)
const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"; // Link Sandbox (Test) hoặc Thật
const returnUrl = "http://localhost:3000/checkout/result"; // Link web bạn khi thanh toán xong

export function createVNPayUrl({ orderId, amount, orderInfo }: any) {
  const date = new Date();
  const createDate = format(date, "yyyyMMddHHmmss");
  const orderIdString = orderId.toString();

  // Các tham số bắt buộc theo tài liệu VNPay
  let vnp_Params: any = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = "vn";
  vnp_Params["vnp_CurrCode"] = "VND";
  vnp_Params["vnp_TxnRef"] = orderIdString;
  vnp_Params["vnp_OrderInfo"] = orderInfo;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = amount * 100; // VNPay tính đơn vị là hào (x100)
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = "127.0.0.1"; // IP khách hàng (Ở production phải lấy IP thật)
  vnp_Params["vnp_CreateDate"] = createDate;

  // Sắp xếp tham số theo alphabet (Bắt buộc để tạo chữ ký đúng)
  vnp_Params = sortObject(vnp_Params);

  // Tạo chữ ký bảo mật (Secure Hash)
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

  vnp_Params["vnp_SecureHash"] = signed;

  const finalUrl =
    vnpUrl + "?" + querystring.stringify(vnp_Params, { encode: false });
  return finalUrl;
}

// Hàm sắp xếp JSON (Yêu cầu của VNPay)
function sortObject(obj: any) {
  let sorted: any = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
