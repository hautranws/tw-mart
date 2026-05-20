"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// 👇 ĐÃ THÊM: Danh sách từ khóa xách tay Đài Loan của shop bạn
const HOT_KEYWORDS = [
  "Dầu Metholanum",
  "Green Oil",
  "Cao dán Kim Môn",
  "Dầu xoa bóp Chinpai",
  "Vaseline 600ml",
  "Mặt nạ"
];

export default function SearchBar() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addToHistory = (term: string) => {
    let newHistory = [term, ...searchHistory.filter((item) => item !== term)];
    newHistory = newHistory.slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  const removeFromHistory = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter((item) => item !== term);
    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 1) {
        const { data } = await supabase
          .from("products")
          .select("id, title, price, img, old_price")
          .ilike("title", `%${searchTerm}%`)
          .limit(5);

        if (data) setSuggestions(data);
      } else {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      addToHistory(searchTerm.trim());
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleHistoryClick = (term: string) => {
    setSearchTerm(term);
    addToHistory(term);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const getProductImage = (imgData: any) => {
    if (!imgData) return null; 
    try {
      if (imgData.startsWith("[")) {
        const parsed = JSON.parse(imgData);
        return parsed[0];
      }
      return imgData;
    } catch {
      return imgData;
    }
  };

  return (
    <div
      ref={searchContainerRef}
      className="hidden md:block flex-1 max-w-3xl mx-4 relative"
    >
      <div className="relative w-full">
        <input
          type="text"
          // 👇 ĐÃ SỬA: Đổi chữ mờ (Placeholder) cho chuẩn hàng tiêu dùng
          placeholder="Tìm tên sản phẩm, thương hiệu, công dụng..."
          className="w-full py-3 px-6 rounded-full text-black outline-none shadow-lg bg-white text-base border border-black"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
        />
        <button
          onClick={handleSearch}
          className="absolute right-1 top-1 bottom-1 bg-blue-800 px-6 rounded-full hover:bg-blue-900 transition flex items-center justify-center"
        >
          🔍
        </button>
      </div>

      {showSuggestions && (
        <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-fade-in text-gray-800">
          {searchTerm.length < 2 && searchHistory.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="flex justify-between items-center bg-gray-50 px-4 py-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Lịch sử tìm kiếm
                </span>
                <span
                  onClick={clearHistory}
                  className="text-xs text-blue-600 cursor-pointer hover:underline"
                >
                  Xóa tất cả
                </span>
              </div>
              <div>
                {searchHistory.map((term, index) => (
                  <div
                    key={index}
                    onClick={() => handleHistoryClick(term)}
                    className="flex items-center justify-between px-4 py-2 hover:bg-blue-50 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 text-gray-700">
                      <span className="text-gray-400 text-lg">🕒</span>
                      <span>{term}</span>
                    </div>
                    <button
                      onClick={(e) => removeFromHistory(e, term)}
                      className="text-gray-300 hover:text-red-500 px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchTerm.length < 2 && (
            <div className="p-4 bg-white">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Tra cứu hàng đầu
              </div>
              <div className="flex flex-wrap gap-2">
                {/* 👇 ĐÃ SỬA: Map theo list HOT_KEYWORDS mới */}
                {HOT_KEYWORDS.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(tag)}
                    className="px-3 py-1 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 text-sm rounded-full transition border border-gray-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchTerm.length > 1 && suggestions.length > 0 && (
            <div>
              <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide border-b">
                Sản phẩm gợi ý
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {suggestions.map((product) => {
                   const displayImg = getProductImage(product.img);
                   return (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        onClick={() => {
                          addToHistory(product.title);
                          setShowSuggestions(false);
                        }}
                        className="flex items-center gap-4 p-3 hover:bg-blue-50 transition border-b border-gray-50 last:border-0 group"
                      >
                        <div className="w-12 h-12 border rounded bg-white flex items-center justify-center shrink-0">
                          {displayImg ? (
                            <img
                              src={displayImg}
                              alt={product.title}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-xl">📦</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-800 group-hover:text-blue-700 truncate">
                            {product.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-blue-600 font-bold text-sm">
                              {product.price?.toLocaleString("vi-VN")}đ
                            </span>
                            {product.old_price && (
                              <span className="text-gray-400 text-xs line-through">
                                {product.old_price.toLocaleString("vi-VN")}đ
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                   );
                })}
              </div>
              <div
                onClick={handleSearch}
                className="block text-center py-2 text-sm text-blue-600 hover:bg-blue-50 hover:underline border-t cursor-pointer font-medium"
              >
                Xem tất cả kết quả cho "{searchTerm}"
              </div>
            </div>
          )}

          {searchTerm.length > 1 && suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500 italic">
              Không tìm thấy sản phẩm nào khớp với "{searchTerm}"
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mt-3 overflow-x-auto whitespace-nowrap text-sm text-black font-medium hide-scrollbar">
        {/* 👇 ĐÃ SỬA: Map theo list HOT_KEYWORDS mới ở dưới thanh tìm kiếm */}
        {HOT_KEYWORDS.map((tag, index) => (
          <button
            key={index}
            onClick={() => handleHistoryClick(tag)}
            className="hover:underline hover:text-blue-700 transition-colors opacity-90 hover:opacity-100"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}