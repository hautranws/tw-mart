"use client"; // Bắt buộc: Để nút này bấm được

import React from "react";
import { useCart } from "../context/CartContext"; // Kết nối với kho giỏ hàng

export default function AddToCartButton({
  product,
  selectedVariant,
}: {
  product: any;
  selectedVariant: any;
}) {
  const { addToCart } = useCart(); // Lấy hàm thêm hàng

  // Hàm xử lý khi bấm nút
  const handleAddToCart = () => {
    // [QUAN TRỌNG]
    // Trang chi tiết sản phẩm (app/product/[id]/page.tsx) cần quản lý state `selectedVariant`.
    // Khi người dùng chọn một phân loại (VD: 100ml), state đó sẽ được cập nhật.
    // Nút "Thêm vào giỏ" này sẽ nhận `selectedVariant` đó làm prop.

    // [MỚI] Kiểm tra một cách an toàn xem sản phẩm có thực sự có phân loại không
    let hasVariants = false;
    try {
      const variantsList = product.variants ? JSON.parse(product.variants) : [];
      if (Array.isArray(variantsList) && variantsList.length > 0) {
        hasVariants = true;
      }
    } catch {}

    // Nếu sản phẩm có phân loại nhưng người dùng chưa chọn, thì báo lỗi.
    if (hasVariants && !selectedVariant) {
      alert("Vui lòng chọn một phân loại hàng (VD: dung tích, màu sắc).");
      return;
    }

    // Gọi hàm addToCart với thông tin phân loại đã chọn.
    // BẠN CẦN CẬP NHẬT LẠI `useCart` context để xử lý logic này.
    // Ví dụ: addToCart(product, selectedVariant)
    // Trong context, cart item sẽ có dạng: { ...product, quantity: 1, selectedVariant: selectedVariant }
    // Giá của cart item sẽ là selectedVariant.price
    addToCart(product, selectedVariant);
  };

  return (
    <div className="mt-8 flex gap-4">
      {/* Nút Thêm vào giỏ */}
      <button
        onClick={handleAddToCart}
        className="flex-1 bg-white border-2 border-blue-600 text-blue-600 font-bold py-3 rounded-full hover:bg-blue-50 transition transform active:scale-95"
      >
        Thêm vào giỏ
      </button>

      {/* Nút Mua ngay (Bấm phát thêm luôn rồi chuyển trang sau này) */}
      <button
        onClick={handleAddToCart}
        className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-200 transition transform active:scale-95"
      >
        Mua ngay
      </button>
    </div>
  );
}
