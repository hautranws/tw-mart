"use client";
import React, { useState } from "react";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProductDetailClient({ product }: { product: any }) {
  let variantsList: any[] = [];
  try {
    const parsed = product.variants ? JSON.parse(product.variants) : [];
    if (Array.isArray(parsed) && parsed.length > 0) {
      variantsList = parsed;
    }
  } catch {}

  const [selectedVariant, setSelectedVariant] = useState<any>(
    variantsList.length > 0 ? variantsList[0] : null,
  );

  const currentPrice = selectedVariant
    ? Number(selectedVariant.price)
    : Number(product?.price || 0);

  const oldPrice = product?.old_price ? Number(product.old_price) : 0;

  let images: string[] = [];
  try {
    images = product.img ? JSON.parse(product.img) : [];
    if (!Array.isArray(images)) images = [product.img];
  } catch {
    images = [product.img];
  }
  const mainImage = images[0] || "https://via.placeholder.com/400";
  const gallery = images.slice(1);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-8 mt-4 grid grid-cols-1 md:grid-cols-2 gap-8 border border-gray-100">
      <ProductGallery mainImage={mainImage} gallery={gallery} />

      <div className="flex flex-col">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 leading-tight">
          {product.title || product.name}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
          <span>
            Mã SP:{" "}
            <span className="text-blue-600 font-semibold">{product.id}</span>
          </span>
          <span>•</span>
          <span>
            Tình trạng:{" "}
            <span
              className={`font-semibold ${product.stock_quantity > 0 ? "text-green-600" : "text-red-600"}`}
            >
              {product.stock_quantity > 0 ? "Còn hàng" : "Hết hàng"}
            </span>
          </span>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-100">
          <div className="flex items-end gap-3">
            <span className="text-3xl text-red-600 font-bold">
              {currentPrice.toLocaleString("vi-VN")}đ
            </span>
            {oldPrice > 0 && oldPrice > currentPrice && (
              <span className="text-gray-400 line-through text-lg mb-1">
                {oldPrice.toLocaleString("vi-VN")}đ
              </span>
            )}
          </div>
        </div>

        {variantsList.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3">
              Chọn phân loại:
            </h3>
            <div className="flex flex-wrap gap-3">
              {variantsList.map((variant, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedVariant(variant)}
                  className={`px-5 py-2.5 rounded-lg border-2 font-bold transition-all transform active:scale-95 ${
                    selectedVariant?.name === variant.name
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600"
                      : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto">
          <AddToCartButton
            product={product}
            selectedVariant={selectedVariant}
          />
        </div>
      </div>
    </div>
  );
}
