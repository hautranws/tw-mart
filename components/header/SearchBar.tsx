"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Search, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Tự động đóng dropdown khi click chuột ra ngoài vùng search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // THÔNG MINH 1: Debounce (Trì hoãn) việc gọi API
  // Tránh việc gõ 10 chữ gọi API 10 lần làm sập máy chủ. Chờ 300ms gõ xong mới gọi.
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        performSearch(searchTerm.trim());
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    setShowDropdown(true);

    // Truy vấn dữ liệu từ bảng products_tw
    const { data, error } = await supabase
      .from("products_tw")
      .select("id, title, img, price, brand, description")
      // [NÂNG CẤP] Tìm kiếm thông minh ở cả tên, thương hiệu và mô tả
      .or(
        `title.ilike.%${query}%,brand.ilike.%${query}%,description.ilike.%${query}%`,
      )
      .limit(5); // Chỉ hiển thị 5 kết quả đầu tiên cho mượt

    if (!error && data) {
      setResults(data);
    } else {
      setResults([]);
    }
    setIsSearching(false);
  };

  // Helper để lấy ảnh đầu tiên an toàn
  const getThumbnail = (imgData: string) => {
    if (!imgData) return "https://via.placeholder.com/50";
    try {
      const parsed = JSON.parse(imgData);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : imgData;
    } catch {
      return imgData;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowDropdown(false);
      // Chuyển hướng sang trang hiển thị tất cả kết quả
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full z-50">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          placeholder="Nhập tên sản phẩm, thương hiệu cần tìm..."
          className="w-full bg-gray-100 border border-gray-200 rounded-full py-2.5 pl-5 pr-20 text-sm text-gray-800 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-inner"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || isSearching) setShowDropdown(true);
          }}
        />

        {/* THÔNG MINH 2: Nút xóa text (hiện khi có chữ) */}
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setResults([]);
              setShowDropdown(false);
            }}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition"
          >
            <X size={18} />
          </button>
        )}

        {/* Nút Kính lúp / Cập nhật trạng thái xoay Loading */}
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-blue-700 text-white rounded-full hover:bg-blue-800 hover:shadow-md transition"
        >
          {isSearching ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
        </button>
      </form>

      {/* THÔNG MINH 3: DROPDOWN HIỂN THỊ KẾT QUẢ TÌM KIẾM TRỰC TIẾP */}
      {showDropdown && searchTerm.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
          {isSearching ? (
            <div className="p-6 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              Đang tìm kiếm...
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col max-h-[70vh] overflow-y-auto">
              <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                Sản phẩm gợi ý
              </div>
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 p-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition group"
                >
                  <div className="w-12 h-12 bg-white border border-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                    <img
                      src={getThumbnail(product.img)}
                      alt={product.title}
                      className="max-w-full max-h-full object-contain group-hover:scale-110 transition duration-300"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-700 transition">
                      {product.title}
                    </p>
                    <p className="text-sm font-bold text-red-600 mt-0.5">
                      {Number(product.price).toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                </Link>
              ))}
              <Link
                href={`/search?q=${encodeURIComponent(searchTerm)}`}
                onClick={() => setShowDropdown(false)}
                className="p-3 text-center text-sm text-blue-700 font-bold hover:bg-blue-100 transition border-t border-gray-100 bg-blue-50"
              >
                Xem tất cả kết quả cho "{searchTerm}" &rarr;
              </Link>
            </div>
          ) : (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3">
                <Search size={24} />
              </div>
              <p className="text-gray-800 font-bold mb-1">
                Không tìm thấy sản phẩm nào
              </p>
              <p className="text-xs text-gray-500">
                Vui lòng thử lại với từ khóa khác hoặc kiểm tra lỗi chính tả.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
