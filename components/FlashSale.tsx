"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

interface Product {
  id: string | number;
  title: string;
  name?: string;
  price: number;
  flash_sale_price: number;
  img: string;
  flash_sale_start: string; // Thêm cột này trong DB
  flash_sale_end: string; // Thêm cột này trong DB
}

export default function FlashSale() {
  const [products, setProducts] = useState<Product[]>([]);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [loading, setLoading] = useState(true);
  const [endTime, setEndTime] = useState<number | null>(null);

  // --- 1. LẤY DỮ LIỆU TỪ SUPABASE & LỌC THEO GIỜ ---
  useEffect(() => {
    const fetchFlashSaleProducts = async () => {
      const now = new Date().toISOString(); // Lấy giờ hiện tại chuẩn ISO

      // Lấy các sản phẩm đang bật cờ Flash Sale
      // Logic lọc ngày giờ sẽ xử lý kỹ hơn ở phía dưới để đảm bảo timezone VN
      const { data, error } = await supabase
        .from("products_tw")
        .select("*")
        .eq("is_flash_sale", true)
        .limit(20);

      if (!error && data) {
        const currentTime = new Date().getTime();

        // Lọc sản phẩm: Phải nằm trong khung giờ Start và End
        const activeProducts = data.filter((p: Product) => {
          if (!p.flash_sale_start || !p.flash_sale_end) return false;
          const start = new Date(p.flash_sale_start).getTime();
          const end = new Date(p.flash_sale_end).getTime();
          return currentTime >= start && currentTime <= end;
        });

        setProducts(activeProducts.slice(0, 4)); // Chỉ lấy 4 sp hiển thị trang chủ

        // Nếu có sản phẩm, lấy thời gian kết thúc của sản phẩm đầu tiên làm mốc đếm ngược chung
        if (activeProducts.length > 0) {
          const firstProductEnd = new Date(
            activeProducts[0].flash_sale_end,
          ).getTime();
          setEndTime(firstProductEnd);
        }
      }
      setLoading(false);
    };

    fetchFlashSaleProducts();
  }, []);

  // --- 2. ĐỒNG HỒ ĐẾM NGƯỢC ---
  useEffect(() => {
    if (!endTime) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        // Tùy chọn: Reload lại trang hoặc ẩn component khi hết giờ
        setProducts([]);
      } else {
        const hours =
          Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) +
          Math.floor(distance / (1000 * 60 * 60 * 24)) * 24; // Tính tổng giờ bao gồm cả ngày
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const formatTime = (num: number) => num.toString().padStart(2, "0");

  // Nếu không có sản phẩm nào đang chạy Flash Sale thì ẩn luôn khung
  if (!loading && products.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 md:p-6 mb-8 text-white shadow-xl font-sans relative overflow-hidden">
      {/* Hiệu ứng tia sét trang trí */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-yellow-400 opacity-20 blur-2xl rounded-full"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter flex items-center gap-2">
            <span className="text-4xl animate-bounce">⚡</span>F
            <span className="text-yellow-300">lash</span> Sale
          </h2>

          {/* Đồng hồ đếm ngược */}
          <div className="flex items-center gap-1 text-red-600 font-bold text-xs md:text-base bg-white/20 p-1 rounded-lg backdrop-blur-sm">
            <span className="text-white text-xs mr-1 uppercase font-semibold hidden md:block">
              Kết thúc trong:
            </span>
            <span className="bg-white px-2 py-1 rounded shadow-sm min-w-[30px] text-center">
              {formatTime(timeLeft.hours)}
            </span>
            <span className="text-white font-bold">:</span>
            <span className="bg-white px-2 py-1 rounded shadow-sm min-w-[30px] text-center">
              {formatTime(timeLeft.minutes)}
            </span>
            <span className="text-white font-bold">:</span>
            <span className="bg-white px-2 py-1 rounded shadow-sm min-w-[30px] text-center">
              {formatTime(timeLeft.seconds)}
            </span>
          </div>
        </div>
        <Link
          href="/flash-sale"
          className="text-white text-sm hover:underline font-bold hidden md:block bg-white/20 px-3 py-1 rounded-full transition hover:bg-white/30"
        >
          Xem tất cả &gt;
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 relative z-10">
        {products.map((item) => {
          const discountPercent =
            item.price > 0
              ? Math.round(
                  ((item.price - item.flash_sale_price) / item.price) * 100,
                )
              : 0;

          let displayImage = item.img;
          try {
            if (item.img && item.img.startsWith("[")) {
              const parsed = JSON.parse(item.img);
              displayImage = parsed[0];
            }
          } catch (e) {}

          const idString = String(item.id);
          const hash = idString
            .split("")
            .reduce((a, c) => a + c.charCodeAt(0), 0);
          const randomSold = (hash % 150) + 120;
          const randomRating = 4 + (hash % 10) / 10;

          return (
            <Link
              href={`/san-pham/${item.id}`} // Link này dẫn đến trang chi tiết
              key={item.id}
              className="bg-white rounded-xl p-3 text-gray-800 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer relative group block transform hover:-translate-y-1"
            >
              {discountPercent > 0 && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-red-700 text-[10px] md:text-xs font-black px-2 py-1 rounded-bl-lg rounded-tr-lg z-10 shadow-sm">
                  GIẢM {discountPercent}%
                </div>
              )}

              <div className="h-32 md:h-40 flex items-center justify-center mb-3 overflow-hidden rounded-lg bg-gray-50">
                <img
                  src={displayImage}
                  alt={item.title || item.name}
                  className="h-full object-contain group-hover:scale-110 transition duration-500 mix-blend-multiply"
                />
              </div>

              <h3 className="text-xs md:text-sm font-semibold line-clamp-2 h-8 md:h-10 mb-2 group-hover:text-red-600 transition-colors">
                {item.title || item.name}
              </h3>

              {/* PHẦN ĐÁNH GIÁ (FAKE) */}
              <div className="flex items-center gap-1 mb-2 text-[10px] md:text-xs">
                <div className="flex text-yellow-400">
                  <span className="font-bold mr-1 text-gray-700">
                    {randomRating}
                  </span>
                  ★
                </div>
              </div>

              <div className="flex flex-col mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-400 text-xs line-through decoration-gray-400">
                    ₫{Number(item.price).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="flex flex-wrap items-end gap-1.5">
                  <span className="text-[#ee4d2d] font-bold text-xl leading-none tracking-tight">
                    <span className="text-sm">₫</span>
                    {Number(item.flash_sale_price).toLocaleString("vi-VN")}
                  </span>
                  <span className="bg-[#ee4d2d] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm whitespace-nowrap mb-0.5 border border-[#ee4d2d]">
                    FLASH SALE
                  </span>
                </div>
              </div>

              {/* Thanh trạng thái đã bán */}
              <div className="relative w-full h-4 bg-red-100 rounded-full overflow-hidden border border-red-200">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-red-600"
                  style={{ width: `${randomSold}%` }}
                ></div>
                <span className="absolute top-0 left-0 w-full flex items-center justify-center text-[9px] text-white font-bold uppercase h-full z-10 drop-shadow-sm">
                  <span className="mr-1">🔥</span> Đã bán {randomSold}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
