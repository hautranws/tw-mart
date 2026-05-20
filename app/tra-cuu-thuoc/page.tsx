"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase

// Danh sách các ký tự bộ lọc
const ALPHABET = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

export default function TraCuuThuocPage() {
  const searchParams = useSearchParams();
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [selectedChar, setSelectedChar] = useState("A"); // Mặc định chọn chữ A
  const [searchTerm, setSearchTerm] = useState("");
  const [medicines, setMedicines] = useState<any[]>([]); // Chứa dữ liệu thật từ Supabase
  const [loading, setLoading] = useState(false); // Trạng thái đang tải

  // --- 1. LẤY DỮ LIỆU TỪ URL (Nếu người dùng bấm từ Header vào) ---
  useEffect(() => {
    const alpha = searchParams.get("alpha");
    if (alpha) {
      setSelectedChar(alpha);
    }
  }, [searchParams]);

  // --- 2. HÀM GỌI DỮ LIỆU TỪ SUPABASE ---
  useEffect(() => {
    const fetchMedicines = async () => {
      setLoading(true);
      setMedicines([]); // Reset danh sách trước khi tìm mới

      try {
        let query = supabase
          .from("products")
          .select("id, title, price, img, unit, sub_category"); // Lấy các cột cần thiết

        // LOGIC LỌC:
        if (searchTerm.trim() !== "") {
          // A. Nếu đang tìm kiếm -> Tìm theo tên (bất kể chữ cái đầu)
          query = query.ilike("title", `%${searchTerm}%`);
        } else {
          // B. Nếu không tìm kiếm -> Lọc theo chữ cái đang chọn
          if (selectedChar === "#") {
            // Lấy các thuốc bắt đầu bằng số (0-9)
            // Cú pháp .or để gộp nhiều điều kiện: title bắt đầu bằng 0 HOẶC 1 HOẶC...
            const numberQuery = "0,1,2,3,4,5,6,7,8,9"
              .split(",")
              .map((n) => `title.ilike.${n}%`)
              .join(",");
            query = query.or(numberQuery);
          } else {
            // Lấy thuốc bắt đầu bằng chữ cái đã chọn (Ví dụ: 'A%')
            query = query.ilike("title", `${selectedChar}%`);
          }
        }

        // Sắp xếp theo tên A-Z và giới hạn 50 kết quả để load cho nhanh
        const { data, error } = await query
          .order("title", { ascending: true })
          .limit(50);

        if (error) {
          console.error("Lỗi lấy sản phẩm:", error);
        } else {
          setMedicines(data || []);
        }
      } catch (err) {
        console.error("Có lỗi xảy ra:", err);
      } finally {
        setLoading(false);
      }
    };

    // Gọi hàm (Debounce nhẹ 300ms để tránh gọi liên tục khi gõ phím)
    const timeoutId = setTimeout(() => {
      fetchMedicines();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedChar, searchTerm]); // Chạy lại khi selectedChar hoặc searchTerm thay đổi

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      {/* --- BREADCRUMB --- */}
      <div className="container mx-auto px-4 py-3 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">Tra cứu sản phẩm</span>
      </div>

      <div className="container mx-auto px-4">
        {/* --- THANH TÌM KIẾM --- */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden border border-gray-100">
          {/* Background trang trí */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-blue-50 skew-x-12 translate-x-10 md:block hidden"></div>
          <div className="absolute right-10 bottom-0 md:block hidden opacity-20 text-9xl select-none">
            👩‍⚕️
          </div>

          <div className="w-full md:w-2/3 z-10">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Tra cứu hàng nội địa Đài Loan
            </h1>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập tên sản phẩm cần tìm..."
                className="w-full pl-5 pr-12 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
            {searchTerm && (
              <p className="text-sm text-blue-600 mt-2 font-medium">
                Đang tìm kiếm: "{searchTerm}"...
              </p>
            )}
          </div>
        </div>

        {/* --- BỘ LỌC A-Z --- */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-blue-600 pl-3 flex justify-between items-center">
            <span>
              Sản phẩm thông dụng theo vần:{" "}
              <span className="text-blue-600 text-2xl ml-1">
                {selectedChar}
              </span>
            </span>
          </h2>

          <div className="flex flex-wrap gap-2 mb-6 justify-center md:justify-start">
            {ALPHABET.map((char) => {
              const isActive = selectedChar === char && !searchTerm; // Nếu đang tìm kiếm thì bỏ active chữ cái
              return (
                <button
                  key={char}
                  onClick={() => {
                    setSelectedChar(char);
                    setSearchTerm(""); // Reset tìm kiếm khi bấm chọn chữ cái
                  }}
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-full text-sm md:text-base font-semibold transition-all border
                    ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600 shadow-md scale-110"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                >
                  {char === "#" ? "0-9" : char}
                </button>
              );
            })}
          </div>

          {/* --- DANH SÁCH KẾT QUẢ TỪ SUPABASE --- */}
          <div className="min-h-[200px]">
            {loading ? (
              // HIỆU ỨNG LOADING (SKELETON)
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse p-4 rounded-lg border border-gray-100 flex gap-4"
                  >
                    <div className="w-16 h-16 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : medicines.length > 0 ? (
              // HIỂN THỊ DỮ LIỆU
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {medicines.map((drug) => {
                  // Xử lý hiển thị ảnh (nếu ảnh lưu dạng mảng JSON)
                  let displayImg = drug.img;
                  if (drug.img && drug.img.startsWith("[")) {
                    try {
                      displayImg = JSON.parse(drug.img)[0];
                    } catch (e) {}
                  }

                  return (
                    <Link
                      key={drug.id}
                      // Ưu tiên dùng slug nếu có, không thì dùng id
                      href={`/san-pham/${drug.id}`}
                      className="group flex gap-4 p-4 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer bg-white"
                    >
                      {/* Ảnh nhỏ */}
                      <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 border rounded-md overflow-hidden bg-white flex items-center justify-center">
                        {displayImg ? (
                          <img
                            src={displayImg}
                            alt={drug.title}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-2xl">📦</span>
                        )}
                      </div>

                      {/* Thông tin */}
                      <div>
                        <h3 className="text-blue-700 font-bold text-base md:text-lg mb-1 group-hover:underline line-clamp-2">
                          {drug.title}
                        </h3>
                        <p className="text-red-600 font-bold text-sm">
                          {drug.price
                            ? Number(drug.price).toLocaleString("vi-VN") + "đ"
                            : "Liên hệ"}
                          <span className="text-gray-400 font-normal ml-1">
                            / {drug.unit || "Hộp"}
                          </span>
                        </p>
                        <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                          {drug.sub_category || "Hàng xách tay"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              // KHÔNG CÓ KẾT QUẢ
              <div className="text-center py-10 text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p>
                  {searchTerm
                    ? `Không tìm thấy sản phẩm nào có tên "${searchTerm}"`
                    : `Chưa có sản phẩm nào bắt đầu bằng vần "${
                        selectedChar === "#" ? "Số" : selectedChar
                      }"`}
                </p>
                <p className="text-sm mt-1">
                  Bạn vui lòng thử từ khóa hoặc chữ cái khác nhé!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* --- GỢI Ý (Giữ nguyên cho đẹp) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-600 text-white p-6 rounded-xl flex items-center justify-between cursor-pointer hover:bg-blue-700 transition shadow-md">
            <div>
              <p className="font-bold text-lg">Tìm cửa hàng</p>
              <p className="text-sm opacity-90">Hệ thống TW MART toàn quốc</p>
            </div>
            <span className="text-3xl">🏪</span>
          </div>
          <div className="bg-green-600 text-white p-6 rounded-xl flex items-center justify-between cursor-pointer hover:bg-green-700 transition shadow-md">
            <div>
              <p className="font-bold text-lg">Nhân viên hỗ trợ</p>
              <p className="text-sm opacity-90">Chat ngay để được hỗ trợ</p>
            </div>
            <span className="text-3xl">👩‍💻</span>
          </div>
          <div className="bg-orange-500 text-white p-6 rounded-xl flex items-center justify-between cursor-pointer hover:bg-orange-600 transition shadow-md">
            <div>
              <p className="font-bold text-lg">Hotline đặt hàng</p>
              <p className="text-sm opacity-90 font-bold">0988 991 837</p>
            </div>
            <span className="text-3xl">📞</span>
          </div>
        </div>
      </div>
    </div>
  );
}
