import React from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import ProductCard from "@/components/ProductCard"; // [SỬA] Dùng component ProductCard chung

// --- PHẦN CHÍNH (ĐÃ SỬA LỖI) ---
export default async function SearchPage({
  searchParams,
}: {
  // Khai báo kiểu dữ liệu là Promise (Quan trọng cho Next.js mới)
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 1. Dùng await để lấy dữ liệu từ URL
  const resolvedSearchParams = await searchParams;
  const query = String(resolvedSearchParams.q || ""); // Lấy từ khóa 'q'

  // 2. Tìm trong Supabase
  let products = [];
  if (query) {
    const { data, error } = await supabase
      .from("products_tw") // [SỬA LỖI] Gọi đúng bảng products_tw
      .select("*")
      .ilike("title", `%${query}%`); // Tìm kiếm gần đúng

    if (!error && data) {
      products = data;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Tiêu đề kết quả */}
        <div className="mb-6 border-b pb-4">
          <p className="text-gray-500 text-sm mb-1">Kết quả tìm kiếm cho:</p>
          <h1 className="text-3xl font-bold text-blue-800 uppercase">
            &quot;{query}&quot;
          </h1>
        </div>

        {/* Danh sách sản phẩm tìm thấy */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* Trường hợp không tìm thấy */
          <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Không tìm thấy sản phẩm nào
            </h2>
            <p className="text-gray-500 mb-6">
              Rất tiếc, chúng tôi không tìm thấy sản phẩm phù hợp với từ khóa
              &quot;{query}&quot;.
            </p>
            <Link
              href="/"
              className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
            >
              Về trang chủ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
