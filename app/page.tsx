import React from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Banner from "@/components/Banner";
import FlashSale from "@/components/FlashSale";
import CategoryGrid from "@/components/CategoryGrid";
import ProductCard from "@/components/ProductCard";
import BestSellerSection from "@/components/BestSellerSection";

// 👇 LUÔN LẤY DỮ LIỆU MỚI NHẤT TỪ SUPABASE
export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. Lấy sản phẩm từ bảng Đài Loan (products_tw)
  const { data: products, error } = await supabase
    .from("products_tw") // 👈 ĐÃ ĐỔI SANG BẢNG MỚI
    .select(
      "id, title, price, old_price, img, unit, is_best_seller, is_flash_sale, flash_sale_price",
    )
    .order("id", { ascending: false })
    .limit(20);

  // 2. Lấy sản phẩm bán chạy từ bảng Đài Loan (products_tw)
  const { data: bestSellers } = await supabase
    .from("products_tw") // 👈 ĐÃ ĐỔI SANG BẢNG MỚI
    .select("*")
    .eq("is_best_seller", true)
    .limit(10);

  if (error) console.error("Lỗi lấy hàng từ products_tw:", error);

  return (
    <div className="min-h-screen bg-white font-sans">
      <main className="container mx-auto p-4 pt-6">
        <div className="mb-8">
          <Banner />
        </div>

        <div className="mb-8">
          <FlashSale />
        </div>

        {/* --- GIAO DIỆN BÁN CHẠY --- */}
        <section className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-red-600 to-blue-900 text-white">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <h2 className="text-xl font-bold uppercase">
                  Sản phẩm Đài Loan bán chạy
                </h2>
              </div>
              <Link
                href="/"
                className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition"
              >
                Xem tất cả →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-0 divide-x divide-y divide-gray-100">
              {bestSellers && bestSellers.length > 0 ? (
                bestSellers.map((product) => (
                  <Link
                    href={`/product/${product.id}`}
                    key={product.id}
                    className="group block p-4 hover:shadow-lg transition relative bg-white"
                  >
                    <div className="aspect-square relative mb-3 overflow-hidden rounded-lg bg-gray-50">
                      <img
                        src={
                          product.img && product.img.startsWith("[")
                            ? JSON.parse(product.img)[0]
                            : product.img
                        }
                        alt={product.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[40px] group-hover:text-blue-600">
                      {product.title}
                    </h3>
                    <div className="mt-2">
                      <div className="flex items-end gap-2">
                        <span className="text-red-600 font-bold text-lg">
                          {Number(product.price).toLocaleString("vi-VN")}đ
                        </span>
                        {product.old_price && (
                          <span className="text-gray-400 text-xs line-through mb-1">
                            {Number(product.old_price).toLocaleString("vi-VN")}đ
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-blue-600 text-white text-center py-2 rounded-full font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      Xem chi tiết
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 col-span-full italic">
                  Chưa có sản phẩm Đài Loan nào trong danh sách bán chạy.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Ẩn danh mục nổi bật cũ */}
        <div className="hidden">
           <CategoryGrid />
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 border-l-4 border-red-600 pl-4">
          Tất cả sản phẩm xách tay Đài Loan
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {products && products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed">
              <p className="text-lg">📦 Đang cập nhật hàng mới từ Đài Loan...</p>
              <p className="text-sm italic">Vui lòng quay lại sau ít phút hoặc nhắn Zalo để đặt hàng sớm.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}