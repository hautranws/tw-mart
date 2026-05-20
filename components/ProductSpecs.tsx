import React from "react";

interface ProductSpecsProps {
  product: any; // Dữ liệu sản phẩm từ DB
}

export default function ProductSpecs({ product }: ProductSpecsProps) {
  // Tạo số liệu giả (Fake) để giống Long Châu
  const viewCount = Math.floor(Math.random() * 50) + 10; // 10 - 60 người xem
  const cartCount = Math.floor(Math.random() * 10) + 1; // 1 - 10 người thêm giỏ

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden font-sans">
      {/* 1. THANH TRẠNG THÁI (MÀU VÀNG NHẠT) */}
      <div className="bg-orange-50 px-4 py-3 flex items-center gap-2 text-sm text-gray-700 border-b border-orange-100">
        <span className="text-orange-500 text-lg">⚡</span>
        <span>
          <span className="font-bold text-orange-600">
            Sản phẩm đang được chú ý,{" "}
          </span>
          có <span className="font-bold">{cartCount}</span> người thêm vào giỏ
          hàng & <span className="font-bold">{viewCount}</span> người đang xem
        </span>
      </div>

      {/* 2. BẢNG THÔNG TIN CHI TIẾT */}
      <div className="p-6">
        <table className="w-full text-sm text-left">
          <tbody className="divide-y divide-gray-100">
            {/* Danh mục */}
            <tr>
              <td className="py-3 pr-4 text-gray-500 font-medium w-40 align-top">
                Danh mục
              </td>
              <td className="py-3 text-blue-600 font-medium cursor-pointer hover:underline">
                {product.category}{" "}
                {product.sub_category ? `> ${product.sub_category}` : ""}
              </td>
            </tr>

            {/* Số đăng ký */}
            {product.registration_no && (
              <tr>
                <td className="py-3 pr-4 text-gray-500 font-medium align-top">
                  Số đăng ký
                </td>
                <td className="py-3 text-gray-800">
                  {product.registration_no}
                </td>
              </tr>
            )}

            {/* Link Giấy công bố */}
            <tr>
              <td className="py-3 pr-4 align-top"></td>
              <td className="py-3">
                <a
                  href="#"
                  className="text-blue-600 font-medium hover:underline flex items-center gap-1"
                >
                  Xem bill mua hàng / Giấy tờ hải quan
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.651 3 3 0 00-4.59 4.59 3 3 0 00-3.651 3.75 3 3 0 005.304 0 1.963 1.963 0 013.75 3.75 3 3 0 005.304 0 1.963 1.963 0 01-2.367-3.135z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </td>
            </tr>

            {/* Dạng bào chế */}
            {product.dosage_form && (
              <tr>
                <td className="py-3 pr-4 text-gray-500 font-medium align-top">
                  Phân loại / Dạng
                </td>
                <td className="py-3 text-gray-800">{product.dosage_form}</td>
              </tr>
            )}

            {/* Quy cách */}
            <tr>
              <td className="py-3 pr-4 text-gray-500 font-medium align-top">
                Quy cách
              </td>
              <td className="py-3 text-gray-800">
                {product.specification || product.unit || "Đang cập nhật"}
              </td>
            </tr>

            {/* Nhà sản xuất */}
            {product.manufacturer && (
              <tr>
                <td className="py-3 pr-4 text-gray-500 font-medium align-top">
                  Nhà sản xuất
                </td>
                <td className="py-3 text-gray-800 uppercase">
                  {product.manufacturer}
                </td>
              </tr>
            )}

            {/* Nước sản xuất */}
            {product.origin && (
              <tr>
                <td className="py-3 pr-4 text-gray-500 font-medium align-top">
                  Nước sản xuất
                </td>
                <td className="py-3 text-gray-800">{product.origin}</td>
              </tr>
            )}

            {/* Thành phần (Tô màu xanh cho các chất chính nếu muốn) */}
            {product.ingredients && (
              <tr>
                <td className="py-3 pr-4 text-gray-500 font-medium align-top">
                  Thành phần
                </td>
                <td className="py-3 text-gray-800 leading-relaxed">
                  {product.ingredients}
                </td>
              </tr>
            )}

            {/* Hạn sử dụng */}
            {product.expiry && (
              <tr>
                <td className="py-3 pr-4 text-gray-500 font-medium align-top">
                  Hạn sử dụng
                </td>
                <td className="py-3 text-gray-800">{product.expiry}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
