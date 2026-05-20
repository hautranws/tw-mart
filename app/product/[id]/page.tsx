import React from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import ProductGallery from "@/components/ProductGallery";
import ProductSpecs from "@/components/ProductSpecs";
import AddToCartButton from "@/components/AddToCartButton";

export default async function ProductDetail(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const id = params.id;

  // 1. Lấy dữ liệu sản phẩm từ bảng Đài Loan mới
  const { data: product, error } = await supabase
    .from("products_tw") // 👈 ĐÃ ĐỔI SANG BẢNG MỚI
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Sản phẩm không tồn tại trong kho Đài Loan!
        </h1>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          ← Quay về trang chủ
        </Link>
      </div>
    );
  }

  // --- LOGIC KIỂM TRA FLASH SALE ---
  const now = new Date().getTime();
  const start = product.flash_sale_start ? new Date(product.flash_sale_start).getTime() : 0;
  const end = product.flash_sale_end ? new Date(product.flash_sale_end).getTime() : 0;
  const isFlashSaleActive = product.is_flash_sale && now >= start && now <= end;

  // --- XỬ LÝ LOGIC ALBUM ẢNH ---
  let productImages: string[] = [];
  if (product.img) {
    try {
      if (product.img.trim().startsWith("[")) {
        const parsed = JSON.parse(product.img);
        productImages = Array.isArray(parsed) && parsed.length > 0 ? parsed : [product.img];
      } else {
        productImages = [product.img];
      }
    } catch (e) {
      productImages = [product.img];
    }
  } else {
    productImages = ["https://via.placeholder.com/500?text=No+Image"];
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10 pt-6">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
          {" / "}
          <span className="text-gray-600">{product.category || "Hàng xách tay"}</span>
          {" / "}
          <span className="text-gray-800 font-medium truncate">{product.title}</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row mt-4 p-6 gap-8">
          {/* CỘT TRÁI: ẢNH */}
          <div className="md:w-5/12">
            <ProductGallery
              mainImage={productImages[0]}
              gallery={productImages.slice(1)}
            />
          </div>

          {/* CỘT PHẢI: THÔNG TIN */}
          <div className="md:w-7/12 flex flex-col">
            <div className="border-b pb-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter">
                  Nội địa Đài Loan 🇹🇼
                </span>
                <span className="text-gray-500 text-xs">Mã SP: {product.id}</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="flex items-center text-yellow-400">
                  ★★★★★ <span className="text-gray-500 ml-1">(5.0)</span>
                </div>
                <div className="text-gray-400">|</div>
                <div className="text-gray-600">Hàng sẵn kho</div>
              </div>
            </div>

            {/* GIÁ CẢ */}
            {isFlashSaleActive ? (
              <div className="mb-6 bg-gradient-to-r from-red-600 to-orange-500 rounded-lg p-4 text-white shadow-md relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-black text-yellow-300 uppercase tracking-wider text-sm animate-pulse">⚡ Flash Sale</span>
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-3xl md:text-5xl font-extrabold text-white">
                    {Number(product.flash_sale_price).toLocaleString("vi-VN")}đ
                  </span>
                  <span className="text-white/80 text-lg line-through mb-1.5">
                    {Number(product.price).toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex items-end gap-3">
                  <span className="text-3xl md:text-4xl font-bold text-blue-700">
                    {Number(product.price).toLocaleString("vi-VN")}đ
                  </span>
                  {product.old_price && (
                    <span className="text-gray-400 text-lg line-through mb-1">
                      {Number(product.old_price).toLocaleString("vi-VN")}đ
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">Đơn vị tính: {product.unit || "Sản phẩm"}</p>
              </div>
            )}

            {/* THÔNG TIN TÓM TẮT */}
            <div className="mb-6 space-y-3 text-sm">
              <div className="flex">
                <span className="w-32 text-gray-500 font-medium flex-shrink-0">Xuất xứ:</span>
                <span className="text-gray-800 font-bold text-red-600">Đài Loan (Xách tay chính hãng)</span>
              </div>
              {product.brand && (
                <div className="flex">
                  <span className="w-32 text-gray-500 font-medium flex-shrink-0">Thương hiệu:</span>
                  <span className="text-gray-800">{product.brand}</span>
                </div>
              )}
            </div>

            <div className="mt-auto">
              <AddToCartButton
                product={{
                  ...product,
                  price: isFlashSaleActive ? product.flash_sale_price : product.price,
                }}
              />
            </div>

            {/* CAM KẾT SHOP TWMED */}
            <div className="grid grid-cols-3 gap-2 mt-6 border-t pt-4 text-[10px] md:text-xs text-gray-500 text-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl">🇹🇼</span> Bay trực tiếp
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl">✈️</span> Bill mua hàng
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl">🤝</span> Đổi trả 7 ngày
              </div>
            </div>
          </div>
        </div>

        {/* MÔ TẢ CHI TIẾT */}
        {product.description && (
          <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-red-600 pl-3">
              Chi tiết về sản phẩm
            </h2>
            <div
              className="text-gray-700 leading-relaxed prose max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}
      </div>
    </div>
  );
}