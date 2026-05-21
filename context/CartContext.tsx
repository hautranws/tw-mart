"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

// Định nghĩa kiểu dữ liệu
type CartItem = {
  id: number;
  title: string;
  price: number;
  quantity: number;
  img: string;
  name?: string;
  image_url?: string;
  selectedVariant?: any;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: any, selectedVariant?: any) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, newQuantity: number) => void; // <--- MỚI: Hàm chỉnh số lượng
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // 1. Hồi phục giỏ hàng
  useEffect(() => {
    const savedCart = localStorage.getItem("pharmaCart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Lỗi đọc giỏ hàng cũ", e);
      }
    }
  }, []);

  // 2. Lưu giỏ hàng
  useEffect(() => {
    localStorage.setItem("pharmaCart", JSON.stringify(cart));
  }, [cart]);

  // Helper: Lấy link ảnh sạch
  const getCleanImage = (imgData: string) => {
    try {
      const parsed = JSON.parse(imgData);
      return Array.isArray(parsed) ? parsed[0] : imgData;
    } catch {
      return imgData;
    }
  };

  // Hàm thêm vào giỏ
  const addToCart = (product: any, selectedVariant?: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                selectedVariant: selectedVariant || item.selectedVariant,
              }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          title: product.title || product.name || "Sản phẩm", // Lấy đúng tên
          price: Number(product.price),
          img: getCleanImage(product.img || product.image_url),
          quantity: 1,
          selectedVariant: selectedVariant || null,
        },
      ];
    });
    alert("✅ Đã thêm vào giỏ hàng!");
  };

  // --- MỚI: Hàm cập nhật số lượng ---
  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return; // Không cho giảm dưới 1
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) =>
      sum +
      (item.selectedVariant ? Number(item.selectedVariant.price) : item.price) *
        item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
