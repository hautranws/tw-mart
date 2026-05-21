"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image"; // [QUAN TRỌNG] Thư viện ảnh tối ưu
import Banner from "@/components/Banner";
import FlashSale from "@/components/FlashSale";
import AdminFlashSaleManager from "@/components/admin/AdminFlashSaleManager";
import AdminBannerManager from "@/components/admin/AdminBannerManager";

// CẤU HÌNH ADMIN
// Việc kiểm tra quyền Admin đã được chuyển sang file `app/admin/layout.tsx` để quản lý tập trung.

// Helper function để lấy URL ảnh từ chuỗi JSON (an toàn cho thẻ Image của Next.js)
const getThumbnail = (imgData: string | null) => {
  if (!imgData) return "https://via.placeholder.com/150";
  try {
    const parsed = JSON.parse(imgData);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : imgData;
  } catch {
    return imgData; // Đề phòng trường hợp nó đã là 1 URL bình thường
  }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickAddress, setQuickAddress] = useState("");

  useEffect(() => {
    // Trang layout sẽ đảm bảo chỉ admin mới vào được đây.
    // Trang này chỉ cần fetch dữ liệu cần thiết cho dashboard.
    const fetchDashboardData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products_tw") // Sửa thành bảng Đài Loan
        .select("*")
        .order("id", { ascending: false })
        .limit(8); // CHỈ TẢI 8 SẢN PHẨM MỚI NHẤT TRÁNH QUÁ TẢI DB
      if (!error && data) setProducts(data);
      setLoading(false);
    };
    fetchDashboardData(); // Gọi hàm fetchDashboardData
  }, []); // Thêm mảng phụ thuộc rỗng để useEffect chỉ chạy một lần khi component mount

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleQuickAddStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddress.trim()) {
      alert("Vui lòng nhập địa chỉ trước khi thêm!");
      return;
    }
    router.push(
      `/admin/stores/add?address=${encodeURIComponent(quickAddress)}`,
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <main className="container mx-auto p-4 pt-6">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-red-700 mb-6 border-l-8 border-red-700 pl-4 uppercase flex justify-between items-center">
            <span>Trang Quản Trị (Admin)</span>
            <button
              onClick={handleLogout}
              className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 font-normal normal-case"
            >
              Đăng xuất
            </button>
          </h1>

          {/* --- DANH SÁCH CHỨC NĂNG (GRID 5 CỘT) --- */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {/* 1. Thêm SP Mới */}
            <Link
              href="/admin/add"
              className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-blue-500 hover:shadow-xl transition cursor-pointer group"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition">
                ➕
              </div>
              <h3 className="text-xl font-bold text-blue-900 text-center">
                Thêm SP Mới
              </h3>
              <p className="text-gray-500 text-xs mt-1 text-center">
                Thêm hàng vào kho
              </p>
            </Link>

            {/* 2. Quản lý kho */}
            <Link
              href="/admin/products"
              className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-orange-500 hover:shadow-xl transition cursor-pointer group"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition">
                📦
              </div>
              <h3 className="text-xl font-bold text-orange-700 text-center">
                Quản lý kho
              </h3>
              <p className="text-gray-500 text-xs mt-1 text-center">
                Sửa giá & Tồn kho
              </p>
            </Link>

            {/* 3. Đơn hàng */}
            <Link
              href="/admin/orders"
              className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-green-500 hover:shadow-xl transition cursor-pointer group"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition">
                🛒
              </div>
              <h3 className="text-xl font-bold text-green-700 text-center">
                Đơn hàng
              </h3>
              <p className="text-gray-500 text-xs mt-1 text-center">
                Xem & Xử lý đơn
              </p>
            </Link>

            {/* 4. Mã giảm giá */}
            <Link
              href="/admin/coupons"
              className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-purple-500 hover:shadow-xl transition cursor-pointer group"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition">
                🎫
              </div>
              <h3 className="text-xl font-bold text-purple-700 text-center">
                Mã giảm giá
              </h3>
              <p className="text-gray-500 text-xs mt-1 text-center">
                Tạo Coupon KM
              </p>
            </Link>

            {/* 5. Nhật ký hoạt động */}
            <Link
              href="/admin/activity"
              className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-teal-500 hover:shadow-xl transition cursor-pointer group"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition">
                📅
              </div>
              <h3 className="text-xl font-bold text-teal-700 text-center">
                Nhật ký đăng bài
              </h3>
              <p className="text-gray-500 text-xs mt-1 text-center">
                Xem lịch sử
              </p>
            </Link>

            {/* 6. Chat Khách Hàng */}
            <Link
              href="/admin/chat"
              className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-indigo-600 hover:shadow-xl transition cursor-pointer group"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition">
                💬
              </div>
              <h3 className="text-xl font-bold text-indigo-700 text-center">
                Chat Khách
              </h3>
              <p className="text-gray-500 text-xs mt-1 text-center">
                Hỗ trợ trực tuyến
              </p>
            </Link>

            {/* 7. [MỚI] Hệ thống nhà thuốc (Giữ nguyên từ code cũ của bạn) */}
            <Link
              href="/admin/stores"
              className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-rose-600 hover:shadow-xl transition cursor-pointer group"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition">
                🏥
              </div>
              <h3 className="text-xl font-bold text-rose-700 text-center">
                Hệ Thống Thuốc
              </h3>
              <p className="text-gray-500 text-xs mt-1 text-center">
                Địa chỉ & Bản đồ
              </p>
            </Link>
          </div>

          {/* --- [CODE MỚI] SECTION NHẬP ĐỊA CHỈ & THÊM STORE --- */}
          <div className="mt-8 bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              📍 Thêm Cửa Hàng / Chi Nhánh Mới
            </h3>
            <form
              onSubmit={handleQuickAddStore}
              className="flex flex-col md:flex-row gap-4"
            >
              <input
                type="text"
                placeholder="Nhập địa chỉ cửa hàng cần thêm..."
                className="flex-1 p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                value={quickAddress}
                onChange={(e) => setQuickAddress(e.target.value)}
              />
              <button
                type="submit"
                className="bg-red-700 text-white font-bold px-6 py-3 rounded hover:bg-red-800 transition whitespace-nowrap shadow-md flex items-center justify-center gap-2"
              >
                <span>🚀</span> Chuyển qua trang Add Stores
              </button>
            </form>
          </div>
        </div>

        <hr className="border-t-4 border-gray-200 my-10" />

        <div className="mb-10">
          <AdminBannerManager />
        </div>
        <div className="mb-10">
          <AdminFlashSaleManager />
        </div>

        <div className="opacity-90">
          <h2 className="text-xl font-bold text-gray-500 mb-4">
            ⬇️ Xem trước giao diện trang chủ & Kho hàng hiện tại:
          </h2>
          <div className="mb-8 pointer-events-none grayscale-[20%] scale-95 origin-top-left border border-gray-200 rounded-xl p-2">
            <p className="text-xs text-gray-400 mb-1">Demo Banner:</p>
            <Banner />
          </div>
          <div className="mb-8">
            <FlashSale />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-blue-600 pl-4 flex justify-between items-center">
            <span>📦 Danh sách trong kho ({products.length})</span>
            <Link
              href="/admin/add"
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-normal"
            >
              + Thêm mới
            </Link>
          </h2>

          {loading ? (
            <div className="text-center py-10">Đang tải dữ liệu...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="block group"
                >
                  <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer relative border border-gray-100 flex flex-col justify-between h-full">
                    {/* [CODE MỚI] Thay thẻ img bằng Image của Next.js */}
                    <div className="relative h-40 w-full mb-4 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                      <Image
                        src={getThumbnail(product.img)}
                        alt={product.title || product.name || "Sản phẩm"}
                        fill // Tự động co giãn full khung
                        className="object-contain mix-blend-multiply"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Chỉ tải ảnh nhỏ phù hợp màn hình
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm line-clamp-2 mb-2">
                        {product.title || product.name}
                      </h3>
                      <p className="text-blue-600 font-bold text-lg">
                        {Number(product.price).toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
