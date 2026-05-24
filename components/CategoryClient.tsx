"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function CategoryClient({
  initialProducts = [],
  categoryName = "Danh mục",
}: {
  initialProducts: any[];
  categoryName: string;
}) {
  const safeProducts = Array.isArray(initialProducts) ? initialProducts : [];
  const [products, setProducts] = useState(safeProducts);
  const [priceFilter, setPriceFilter] = useState("all");

  useEffect(() => {
    let result = [...safeProducts];

    // Logic lọc giá
    if (priceFilter === "under100") {
      result = result.filter((p) => p.price < 100000);
    } else if (priceFilter === "100-300") {
      result = result.filter((p) => p.price >= 100000 && p.price <= 300000);
    } else if (priceFilter === "above500") {
      result = result.filter((p) => p.price > 500000);
    }

    setProducts(result);
  }, [priceFilter, safeProducts]);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* --- CỘT TRÁI: BỘ LỌC NÂNG CAO --- */}
      <div className="w-full md:w-1/4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-24">
          <h3 className="font-bold text-lg mb-4 text-blue-800 flex items-center gap-2">
            <span>🔍</span> Bộ lọc nâng cao
          </h3>

          {/* Lọc Giá (Hiển thị số đầy đủ) */}
          <div className="mb-6">
            <h4 className="font-semibold text-sm mb-2">Khoảng giá</h4>
            <div className="space-y-3 text-sm text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition">
                <input
                  type="radio"
                  name="price"
                  checked={priceFilter === "all"}
                  onChange={() => setPriceFilter("all")}
                  className="accent-blue-600"
                />
                Tất cả mức giá
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition">
                <input
                  type="radio"
                  name="price"
                  checked={priceFilter === "under100"}
                  onChange={() => setPriceFilter("under100")}
                  className="accent-blue-600"
                />
                Dưới 100.000đ
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition">
                <input
                  type="radio"
                  name="price"
                  checked={priceFilter === "100-300"}
                  onChange={() => setPriceFilter("100-300")}
                  className="accent-blue-600"
                />
                100.000đ - 300.000đ
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition">
                <input
                  type="radio"
                  name="price"
                  checked={priceFilter === "above500"}
                  onChange={() => setPriceFilter("above500")}
                  className="accent-blue-600"
                />
                Trên 500.000đ
              </label>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded text-xs text-blue-700 leading-relaxed">
            💡 <strong>Mẹo:</strong> Chọn khoảng giá phù hợp để tìm sản phẩm
            nhanh hơn.
          </div>
        </div>
      </div>

      {/* --- CỘT PHẢI: DANH SÁCH SẢN PHẨM --- */}
      <div className="w-full md:w-3/4">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h1 className="text-2xl font-bold text-gray-800">
            {decodeURIComponent(categoryName)}
            <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {products.length} sản phẩm
            </span>
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.length > 0 ? (
            products.map((product) => {
              const hash = String(product.id)
                .split("")
                .reduce((a, c) => a + c.charCodeAt(0), 0);
              const discountPercent = 5 + (hash % 11);
              const currentPrice = product.price || 0;
              const voucherPrice =
                Math.round(
                  (currentPrice * (1 - discountPercent / 100)) / 1000,
                ) * 1000;

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="block group"
                >
                  <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-xl transition border border-gray-100 flex flex-col h-full relative group-hover:border-blue-200">
                    {product.discount && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-1 rounded font-bold z-10 shadow-sm">
                        {product.discount}
                      </span>
                    )}
                    <div
                      className={`h-40 ${product.image_url} rounded-lg mb-3 flex items-center justify-center text-gray-400 bg-opacity-10 group-hover:scale-105 transition duration-300`}
                    >
                      {/* CODE CŨ CỦA BẠN DÙNG image_url, NẾU DB LÀ img THÌ SẼ LỖI ẢNH, NHƯNG TÔI KHÔNG SỬA THEO YÊU CẦU */}
                      {product.img ? (
                        <img
                          src={product.img}
                          alt={product.title || product.name}
                          className="h-full object-contain"
                        />
                      ) : (
                        "[Ảnh]"
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-sm line-clamp-2 mb-2 group-hover:text-blue-700 min-h-[40px] transition">
                        {/* Thêm fallback product.title nếu product.name không có */}
                        {product.name || product.title}
                      </h3>

                      {/* PHẦN ĐÁNH GIÁ & LƯỢT BÁN (FAKE) */}
                      <div className="flex items-center gap-2 mb-1 text-xs">
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
                      <div className="flex flex-col mt-1 mb-2">
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
                    <div className="mt-4">
                      <button className="w-full bg-white text-blue-600 border border-blue-600 font-bold py-2 rounded hover:bg-blue-600 hover:text-white transition text-xs uppercase">
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-4 py-20 text-center bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 text-lg mb-4">
                📭 Không tìm thấy sản phẩm nào trong khoảng giá này.
              </p>
              <button
                onClick={() => setPriceFilter("all")}
                className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition"
              >
                Xóa bộ lọc & Xem tất cả
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
