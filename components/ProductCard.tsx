"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

interface ProductProps {
  product: {
    id: number;
    title: string;
    price: number;
    img: string;
    unit?: string;
    variants?: string; // Thêm variants dạng JSON string
    specification?: string;
  };
}

const ProductCard: React.FC<ProductProps> = ({ product }) => {
  const { addToCart } = useCart();

  // [MỚI] Kiểm tra xem sản phẩm có phân loại không
  let hasVariants = false;
  let variantsList: any[] = [];
  try {
    const variants = product.variants ? JSON.parse(product.variants) : [];
    if (Array.isArray(variants) && variants.length > 0) {
      hasVariants = true;
      variantsList = variants;
    }
  } catch {}

  const [selectedVariant, setSelectedVariant] = useState<any>(
    hasVariants ? variantsList[0] : null,
  );

  const getThumbnail = (imgData: string) => {
    if (!imgData) return "https://via.placeholder.com/150";
    try {
      const parsed = JSON.parse(imgData);
      return Array.isArray(parsed) ? parsed[0] : imgData;
    } catch {
      return imgData;
    }
  };

  // Hiển thị giá theo phân loại được chọn (nếu có)
  const currentPrice = selectedVariant
    ? Number(selectedVariant.price)
    : Number(product.price);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasVariants && !selectedVariant) {
      alert("Vui lòng chọn phân loại trước khi thêm vào giỏ!");
      return;
    }
    addToCart(product, selectedVariant);
  };

  // MÔ PHỎNG GIÁ SAU MÃ GIẢM GIÁ (Tạo sức hút như Shopee)
  const hash = String(product.id)
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const discountPercent = 5 + (hash % 11); // Giảm ngẫu nhiên 5% - 15%
  const randomSold = (hash % 120) + 40; // Ngẫu nhiên từ 40 - 159 sản phẩm (cố định theo id)
  const rating = 4 + (hash % 10) / 10; // Ngẫu nhiên sao từ 4.0 - 4.9
  const voucherPrice =
    Math.round((currentPrice * (1 - discountPercent / 100)) / 1000) * 1000;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 p-4 flex flex-col h-full relative group">
      {/* Link đã chốt chuẩn là /product/ */}
      <Link href={`/product/${product.id}`} className="block mb-3">
        <div className="w-full aspect-square flex items-center justify-center overflow-hidden rounded-lg cursor-pointer">
          <img
            src={getThumbnail(product.img)}
            alt={product.title}
            className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      <Link href={`/product/${product.id}`} className="block mb-2">
        <h3
          className="text-gray-900 font-semibold text-sm leading-tight line-clamp-2 min-h-[40px] hover:text-blue-600 transition-colors cursor-pointer"
          title={product.title}
        >
          {product.title}
        </h3>
      </Link>

      {/* HIỂN THỊ GIÁ NHƯ SHOPEE: GIÁ GỐC BỊ GẠCH ĐI & GIÁ SAU MÃ NỔI BẬT */}
      <div className="flex flex-col mb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-gray-400 text-xs line-through decoration-gray-400">
            ₫{currentPrice.toLocaleString("vi-VN")}
          </span>
        </div>
        <div className="flex flex-wrap items-end gap-1.5">
          <span className="text-[#ee4d2d] font-bold text-xl leading-none tracking-tight">
            <span className="text-sm">₫</span>
            {voucherPrice.toLocaleString("vi-VN")}
          </span>
          <span className="bg-[#ee4d2d] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm whitespace-nowrap mb-0.5 border border-[#ee4d2d]">
            DÙNG VOUCHER
          </span>
          {product.unit && !hasVariants && (
            <span className="text-gray-500 text-[10px] ml-auto pb-0.5 truncate max-w-[50px]">
              / {product.unit}
            </span>
          )}
        </div>
      </div>

      {/* [MỚI] HIỂN THỊ LƯỢT BÁN & ĐÁNH GIÁ (FAKE) */}
      <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-3">
        <div className="flex text-yellow-400">
          <span className="font-bold mr-1 text-gray-700">{rating}</span>★
        </div>
        <span className="px-2 border-l border-gray-300 ml-1">
          Đã bán {randomSold}
        </span>
      </div>

      <div className="mb-4 flex-1">
        {hasVariants ? (
          <select
            className="w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 bg-gray-50"
            value={selectedVariant?.name || ""}
            onChange={(e) => {
              const variant = variantsList.find(
                (v) => v.name === e.target.value,
              );
              setSelectedVariant(variant);
            }}
          >
            {variantsList.map((v, index) => (
              <option key={index} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        ) : product.specification ? (
          <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded inline-block">
            {product.specification}
          </div>
        ) : (
          <div className="h-[24px]"></div>
        )}
      </div>

      <button
        className="mt-auto w-full bg-blue-600 text-white font-bold py-2.5 rounded-full hover:bg-blue-700 transition-colors text-sm"
        onClick={handleAddToCart}
      >
        Chọn mua
      </button>
    </div>
  );
};

export default ProductCard;
