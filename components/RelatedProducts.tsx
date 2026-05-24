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
        {products.map((product) => {
          const hash = String(product.id)
            .split("")
            .reduce((a, c) => a + c.charCodeAt(0), 0);
          const discountPercent = 5 + (hash % 11);
          const currentPrice = product.price || 0;
          const voucherPrice =
            Math.round((currentPrice * (1 - discountPercent / 100)) / 1000) *
            1000;

          return (
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

                {/* PHẦN ĐÁNH GIÁ & LƯỢT BÁN (FAKE) */}
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <div className="flex text-yellow-400">
                    <span className="font-bold mr-1 text-gray-700">
                      {4 +
                        (String(product.id)
                          .split("")
                          .reduce((a, c) => a + c.charCodeAt(0), 0) %
                          10) /
                          10}
                    </span>
                    ★
                  </div>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">
                    Đã bán{" "}
                    {(String(product.id)
                      .split("")
                      .reduce((a, c) => a + c.charCodeAt(0), 0) %
                      150) +
                      120}
                  </span>
                </div>

                {/* HIỂN THỊ GIÁ SAU VOUCHER (GIỐNG SHOPEE) */}
                <div className="mt-auto flex flex-col mb-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-400 text-xs line-through decoration-gray-400">
                      ₫{currentPrice.toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-end gap-1.5">
                    <span className="text-[#ee4d2d] font-bold text-lg leading-none tracking-tight">
                      <span className="text-xs">₫</span>
                      {voucherPrice.toLocaleString("vi-VN")}
                    </span>
                    <span className="bg-[#ee4d2d] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm whitespace-nowrap border border-[#ee4d2d]">
                      DÙNG VOUCHER
                    </span>
                    {product.unit && (
                      <span className="text-gray-500 text-[10px] ml-auto pb-[1px] truncate max-w-[50px]">
                        / {product.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
