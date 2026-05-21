"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Banner() {
  // Ảnh mặc định (dùng khi chưa load được data hoặc DB trống)
  // Bắt đầu với mảng rỗng, chỉ hiển thị banner từ Supabase
  const [slides, setSlides] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // --- 1. LẤY DỮ LIỆU TỪ SUPABASE ---
  useEffect(() => {
    const fetchBanners = async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("active", true) // Chỉ lấy banner đang bật
        .order("created_at", { ascending: false }); // Lấy mới nhất trước

      if (!error && data) {
        setSlides(data);
      }
    };

    fetchBanners();
  }, []);

  // --- 2. TỰ ĐỘNG CHUYỂN SLIDE ---
  useEffect(() => {
    if (slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === slides.length - 1 ? 0 : prevIndex + 1,
      );
    }, 4000); // 4 giây chuyển 1 lần

    return () => clearInterval(timer);
  }, [slides.length]); // Chạy lại khi danh sách slide thay đổi

  if (slides.length === 0) return null;

  return (
    <div className="w-full h-48 md:h-[400px] relative overflow-hidden rounded-xl shadow-lg group">
      {/* Hiển thị ảnh */}
      <div
        className="w-full h-full bg-center bg-cover duration-700 transition-all ease-in-out"
        style={{ backgroundImage: `url(${slides[currentIndex].image_url})` }}
      ></div>

      {/* Nút lùi (Mũi tên trái) */}
      <div className="hidden group-hover:block absolute top-[50%] -translate-y-1/2 left-5 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer hover:bg-black/50 transition">
        <button
          onClick={() =>
            setCurrentIndex(
              currentIndex === 0 ? slides.length - 1 : currentIndex - 1,
            )
          }
        >
          ❮
        </button>
      </div>

      {/* Nút tiến (Mũi tên phải) */}
      <div className="hidden group-hover:block absolute top-[50%] -translate-y-1/2 right-5 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer hover:bg-black/50 transition">
        <button
          onClick={() =>
            setCurrentIndex(
              currentIndex === slides.length - 1 ? 0 : currentIndex + 1,
            )
          }
        >
          ❯
        </button>
      </div>

      {/* Chấm tròn nhỏ bên dưới */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id || index}
            onClick={() => setCurrentIndex(index)}
            className={`transition-all w-2 h-2 md:w-3 md:h-3 rounded-full cursor-pointer shadow-sm ${
              currentIndex === index
                ? "bg-white scale-125"
                : "bg-white/50 hover:bg-white/80"
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
}
