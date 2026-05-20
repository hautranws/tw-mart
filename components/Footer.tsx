import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t-4 border-red-600 mt-12 pt-10 pb-6 text-gray-700 font-sans">
      <div className="container mx-auto px-4">
        {/* Lưới 4 cột thông tin */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Cột 1: Về TW MART */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-blue-900 uppercase flex items-center gap-2">
              🇹🇼 Về TW MART
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="leading-relaxed">
                TW MART là kênh mua sắm các mặt hàng nội địa Đài Loan uy tín.
                Chúng tôi trực tiếp xách tay các sản phẩm sức khỏe, làm đẹp và
                đặc sản Đài Loan về Việt Nam qua đường hàng không.
              </li>
              <li className="flex items-center gap-2 font-medium text-red-600">
                <span>✈️</span> Bay Air 100%
              </li>
              <li className="flex items-center gap-2 font-medium text-green-600">
                <span>🧾</span> Có bill mua hàng rõ ràng
              </li>
            </ul>
          </div>

          {/* Cột 2: Danh mục */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-blue-900 uppercase">
              Danh mục chính
            </h3>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <Link
                  href="/category/Dầu Gió & Cao Dán"
                  className="hover:text-red-600 transition-colors flex items-center gap-2"
                >
                  <span>•</span> Dầu Gió & Cao Dán
                </Link>
              </li>
              <li>
                <Link
                  href="/category/Mỹ Phẩm & Skincare"
                  className="hover:text-red-600 transition-colors flex items-center gap-2"
                >
                  <span>•</span> Mỹ Phẩm Nội Địa
                </Link>
              </li>
              <li>
                <Link
                  href="/category/Đặc Sản & Trà Sữa"
                  className="hover:text-red-600 transition-colors flex items-center gap-2"
                >
                  <span>•</span> Đặc Sản & Trà Sữa
                </Link>
              </li>
              <li>
                <Link
                  href="/category/Thực Phẩm Chức Năng"
                  className="hover:text-red-600 transition-colors flex items-center gap-2"
                >
                  <span>•</span> Thực Phẩm Chức Năng
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ khách hàng */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-blue-900 uppercase">
              Tư vấn & Đặt hàng
            </h3>
            <div className="space-y-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="font-semibold text-gray-600 mb-1">
                  Hotline / Zalo Việt Nam:
                </p>
                <a
                  href="tel:0988991837"
                  className="text-xl font-black text-red-600 hover:text-blue-900 transition flex items-center gap-2"
                >
                  <span>🇻🇳</span> 0988 991 837
                </a>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-600 mb-1">
                  Liên hệ Đài Loan:
                </p>
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span>🇹🇼</span> Đang cập nhật...
                </p>
                <p className="text-xs text-gray-500 italic mt-1">
                  (Dành cho sỉ hoặc order riêng)
                </p>
              </div>
            </div>
          </div>

          {/* Cột 4: Kết nối */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-blue-900 uppercase">
              Theo dõi chúng tôi
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Cập nhật các chuyến bay và đợt sale mới nhất tại:
            </p>
            <div className="flex gap-3 mb-6">
              {/* Facebook Icon */}
              <a
                href="#"
                className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:scale-110 hover:shadow-lg transition-transform"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              {/* TikTok Icon (Thay cho Youtube cũ) */}
              <a
                href="#"
                className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 hover:shadow-lg transition-transform"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </a>
            </div>

            <div className="bg-gray-100 p-3 rounded-lg text-center border border-dashed border-gray-300">
              <p className="text-xs font-bold text-gray-500 uppercase">
                Giao hàng toàn quốc
              </p>
              <div className="flex justify-center gap-2 mt-2 text-2xl">
                🚚 📦 📬
              </div>
            </div>
          </div>
        </div>

        {/* Dòng bản quyền cuối cùng */}
        <div className="border-t pt-6 text-center text-xs text-gray-500">
          <p className="mb-2 font-black text-blue-900 text-base uppercase tracking-widest">
            TW MART - CHUYÊN HÀNG ĐÀI LOAN
          </p>
          <p className="mb-1">
            <span className="font-semibold">Trụ sở tại Việt Nam:</span> TP. Thủ
            Đức, TP. Hồ Chí Minh
          </p>
          <p className="mb-1">
            Website thuộc sở hữu của TW MART - Nhận order hàng xách tay Đài Loan
            theo yêu cầu.
          </p>
        </div>
      </div>
    </footer>
  );
}
