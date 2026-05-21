import React from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

// Helper function để lấy ảnh thumbnail từ chuỗi JSON
const getThumbnail = (imgData: string | null) => {
  if (!imgData) return "https://via.placeholder.com/150"; // Ảnh mặc định
  try {
    const parsed = JSON.parse(imgData);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : imgData;
  } catch {
    return imgData;
  }
};

// Component này nhận vào Danh mục hiện tại và ID sản phẩm đang xem (để trừ nó ra)
export default async function RelatedProducts({
  category,
  currentId,
}: {
  category: string;
  currentId: number;
}) {
  // GỌI KHO: Lấy 4 sản phẩm cùng danh mục, nhưng KHÔNG LẤY sản phẩm đang xem (neq)
  const { data: products } = await supabase
    .from("products_tw")
    .select("*")
    .eq("category", category) // Cùng loại
    .neq("id", currentId) // Khác bài đang xem
    .limit(4); // Chỉ lấy 4 bài

  // Nếu không có sản phẩm nào liên quan thì không hiện gì cả
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-blue-600 pl-3">
        Sản phẩm cùng loại
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="block group"
          >
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-xl transition h-full flex flex-col group-hover:border-blue-200">
              {/* Ảnh */}
              <div className="w-full aspect-square flex items-center justify-center overflow-hidden rounded-lg cursor-pointer mb-3 bg-gray-50">
                <img
                  src={getThumbnail(product.img)}
                  alt={product.title}
                  className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Tên */}
              <h3 className="font-bold text-gray-800 text-sm line-clamp-2 mb-2 group-hover:text-blue-700 min-h-[40px] transition">
                {product.title}
              </h3>

              {/* Giá */}
              <div className="mt-auto">
                <p className="text-blue-700 font-bold text-lg">
                  {product.price?.toLocaleString("vi-VN")}đ
                  <span className="text-gray-400 text-xs font-normal ml-1">
                    / {product.unit}
                  </span>
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
