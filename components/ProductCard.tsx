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
    hasVariants ? variantsList[0] : null
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

      <div className="flex items-end gap-1 mb-2">
        <span className="text-blue-600 font-bold text-lg">
          {currentPrice.toLocaleString("vi-VN")}đ
        </span>
        {product.unit && !hasVariants && (
          <span className="text-gray-500 text-sm mb-[2px]">
            / {product.unit}
          </span>
        )}
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
