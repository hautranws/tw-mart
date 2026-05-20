"use client";

import React, { useState, useEffect } from "react";

// 👇 BẠN CÓ THỂ THAY ĐỔI LINK ẢNH NHÂN VIÊN/ĐẠI DIỆN TW MART Ở ĐÂY
// Bạn có thể dùng ảnh link web (http) hoặc ảnh trong thư mục public (VD: "/logo-tw-mart.png")
const avatarUrl = "/logo-tw-mart.png";

export default function ZaloChat() {
  // Danh sách câu thoại
  const messages = [
    "📦 Bạn chưa tìm thấy sản phẩm?",
    "👩‍💻 Nhân viên tư vấn đang online",
    "💬 Bấm vào đây để được tư vấn ngay!",
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(true);
  const [isHovered, setIsHovered] = useState(false); // Thêm trạng thái hover

  // Hiệu ứng đổi câu thoại
  useEffect(() => {
    // Nếu đang di chuột vào thì không đổi câu
    if (isHovered || !showBubble) return;

    const interval = setInterval(() => {
      // Ẩn đi một chút trước khi đổi câu
      const hideTimer = setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
      }, 300); // Đợi hiệu ứng mờ dần

      // Hiện lại sau khi đã đổi text
      const showTimer = setTimeout(() => {
        // Chỉ là trigger để React render lại, hiệu ứng CSS sẽ lo phần chuyển đổi
      }, 300 + 100);

      return () => {
        clearTimeout(hideTimer);
        clearTimeout(showTimer);
      };
    }, 4000); // 4 giây đổi câu 1 lần

    return () => clearInterval(interval);
  }, [isHovered, showBubble]);

  return (
    // Container chính, đặt cố định ở góc phải dưới
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* --- PHẦN TỔ HỢP: AVATAR DƯỢC SĨ + BONG BÓNG CHAT --- */}
      {/* Chỉ hiện khi showBubble = true */}
      <div
        className={`flex items-end gap-2 transition-all duration-500 ease-in-out transform origin-bottom-right ${
          showBubble
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
        style={{ maxWidth: "280px" }}
      >
        {/* 1. Ảnh Avatar Dược sĩ (Bên trái) */}
        <div className="flex-shrink-0 relative z-10">
          <div className="w-12 h-12 rounded-full border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] overflow-hidden bg-blue-50">
            {/* Dùng thẻ img thường cho đơn giản, có thể thay bằng next/image */}
            <img
              src={avatarUrl}
              alt="Nhân viên tư vấn"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Chấm xanh online */}
          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-green-500"></span>
        </div>

        {/* 2. Bong bóng chứa chữ (Bên phải) */}
        <div className="bg-white text-blue-800 p-3 rounded-2xl rounded-bl-none shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-blue-50 relative flex-grow">
          {/* Nội dung chữ (có hiệu ứng chuyển đổi nhẹ) */}
          <p
            key={currentMessageIndex} // Key thay đổi để trigger animation
            className="text-[13px] font-medium leading-tight animate-[fadeIn_0.5s_ease-in-out]"
          >
            {messages[currentMessageIndex]}
          </p>

          {/* Nút tắt X nhỏ */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Chặn click lan xuống nút Zalo
              setShowBubble(false); // Ẩn bong bóng
            }}
            className="absolute -top-2 -right-2 bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors shadow-sm"
            title="Đóng gợi ý"
          >
            ✕
          </button>
        </div>
      </div>

      {/* --- NÚT MESSENGER TRÒN Ở DƯỚI CÙNG --- */}
      <a
        href="https://m.me/taiwanmartvietnam"
        target="_blank"
        rel="noreferrer"
        // Khi click vào nút Zalo thì ẩn luôn bong bóng cho gọn
        onClick={() => setShowBubble(false)}
        className="relative flex items-center justify-center w-14 h-14 bg-[#0084FF] rounded-full shadow-[0_4px_12px_rgba(0,132,255,0.4)] hover:scale-110 transition-transform duration-300 hover:bg-[#0066CC] ring-2 ring-white"
      >
        {/* Hiệu ứng sóng lan tỏa nhẹ */}
        <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-30 animate-ping"></span>

        {/* Icon Messenger SVG chuẩn màu trắng */}
        <svg
          className="w-7 h-7 text-white relative z-10 fill-current"
          viewBox="0 0 48 48"
        >
          <path d="M24 4C12.954 4 4 12.29 4 22.516c0 5.85 2.976 10.97 7.64 14.31v6.84l6.946-3.842c1.732.482 3.552.736 5.414.736 11.046 0 20-8.288 20-18.516S35.046 4 24 4zm2.192 24.792l-5.644-6.046-10.996 6.046 12.092-12.85 5.74 6.044 10.892-6.044-12.084 12.85z" />
        </svg>
      </a>
    </div>
  );
}
