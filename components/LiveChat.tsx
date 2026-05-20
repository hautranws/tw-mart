"use client";
import React, { useState, useEffect } from "react";

export default function LiveChat() {
  const [currentBubbleMsg, setCurrentBubbleMsg] = useState(0);
  const [isBubbleVisible, setIsBubbleVisible] = useState(true);

  // 👇 THAY ĐỔI: Danh sách tin nhắn phù hợp với hàng Đài Loan
  const bubbleMessages = [
    "🇹🇼 Bạn cần tìm hàng Đài Loan theo yêu cầu?",
    "💊 Tư vấn Cao dán & Dầu gió nội địa",
    "🧋 Order trà sữa, bánh kẹo chuẩn Đài",
    "💬 Nhắn Messenger cho mình ngay nhé!",
  ];

  // ĐƯỜNG LINK MESSENGER
  const MESSENGER_LINK = "https://m.me/taiwanmartvietnam";

  // Hiệu ứng chạy chữ bong bóng
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBubbleVisible(false);
      setTimeout(() => {
        setCurrentBubbleMsg((prev) => (prev + 1) % bubbleMessages.length);
        setIsBubbleVisible(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 font-sans">
      {/* --- PHẦN BONG BÓNG CHAT --- */}
      <a
        href={MESSENGER_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex flex-col items-end gap-2 group"
      >
        {/* Bong bóng chạy chữ */}
        <div
          className={`bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg border border-blue-100 max-w-[250px] text-sm font-medium transition-all duration-500 transform origin-bottom-right relative mb-1 mr-1
          ${isBubbleVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-2"}
          `}
        >
          {bubbleMessages[currentBubbleMsg]}

          {/* Mũi tên trỏ xuống */}
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white transform rotate-45 border-r border-b border-blue-100"></div>
        </div>

        {/* Nút tròn Messenger */}
        <div className="flex items-center justify-center w-16 h-16 bg-[#0084FF] rounded-full shadow-lg hover:scale-110 transition-all duration-300 hover:bg-[#0066CC] relative z-50 ring-4 ring-white">
          {/* Tooltip khi hover */}
          <div className="absolute right-full mr-4 bg-white text-gray-800 px-4 py-2 rounded-xl shadow-lg border border-gray-100 whitespace-nowrap hidden group-hover:block transition-all">
            <p className="text-sm font-bold text-[#0084FF]">Chat Messenger</p>
            <div className="absolute top-1/2 -right-2 w-4 h-4 bg-white transform -translate-y-1/2 rotate-45 border-r border-t border-gray-100"></div>
          </div>

          {/* Icon Messenger SVG thay cho ảnh */}
          <svg
            className="w-9 h-9 text-white fill-current relative z-10"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.925 1.488 5.485 3.82 7.155v3.42l3.473-1.921c.866.241 1.776.368 2.707.368 5.523 0 10-4.144 10-9.258C22 6.145 17.523 2 12 2zm1.096 12.396l-2.822-3.023-5.498 3.023 6.046-6.425 2.87 3.022 5.446-3.022-6.042 6.425z" />
          </svg>
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
        </div>
      </a>
    </div>
  );
}
