"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Product {
  id: string;
  title: string;
  price: number;
  img: string;
  flash_sale_price: number;
  flash_sale_start?: string;
  flash_sale_end?: string;
}

export default function AdminFlashSaleManager() {
  const [flashItems, setFlashItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho Modal thêm sản phẩm
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // State nhập liệu
  const [salePriceInput, setSalePriceInput] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // --- 1. LẤY DANH SÁCH ĐANG FLASH SALE ---
  const fetchFlashItems = async () => {
    const { data } = await supabase
      .from("products_tw")
      .select("*")
      .eq("is_flash_sale", true)
      .order("created_at", { ascending: false });

    if (data) setFlashItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFlashItems();
  }, []);

  // --- 2. XỬ LÝ GỠ BỎ FLASH SALE ---
  const handleRemove = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn gỡ sản phẩm này khỏi Flash Sale?")) return;

    const { error } = await supabase
      .from("products_tw")
      .update({
        is_flash_sale: false,
        flash_sale_price: 0,
        flash_sale_start: null,
        flash_sale_end: null,
      })
      .eq("id", id);

    if (!error) {
      setFlashItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      alert("Lỗi: " + error.message);
    }
  };

  // --- 3. TÌM KIẾM SẢN PHẨM ĐỂ THÊM ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const { data } = await supabase
      .from("products_tw")
      .select("*")
      .ilike("title", `%${searchTerm}%`)
      .limit(5);

    if (data) setSearchResults(data);
  };

  // --- 4. LƯU SẢN PHẨM VÀO FLASH SALE ---
  const handleAddFlashSale = async () => {
    if (!selectedProduct || !salePriceInput) return;

    // Validate Giá
    const price = parseInt(salePriceInput);
    if (price <= 0) {
      alert("Giá Flash Sale phải lớn hơn 0");
      return;
    }
    if (price >= selectedProduct.price) {
      alert("Giá Flash Sale phải nhỏ hơn giá gốc!");
      return;
    }

    // Validate Thời gian
    if (!startTime || !endTime) {
      alert("Vui lòng chọn thời gian bắt đầu và kết thúc!");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      alert("Thời gian kết thúc phải sau thời gian bắt đầu!");
      return;
    }

    // --- [LOGIC MỚI] KIỂM TRA KHUNG GIỜ ---
    const startHour = start.getHours();
    const endHour = end.getHours();

    // Kiểm tra giờ bắt đầu có nằm trong khoảng cấm (1h - 8h sáng) không
    if (startHour >= 1 && startHour < 8) {
      alert(
        "Không thể bắt đầu Flash Sale trong khung giờ nghỉ (01:00 - 08:00)!",
      );
      return;
    }

    // Kiểm tra giờ kết thúc có nằm trong khoảng cấm (1h - 8h sáng) không
    // Lưu ý: Trường hợp kết thúc đúng lúc 1h sáng là hợp lệ
    if (endHour > 1 && endHour < 8) {
      alert(
        "Không thể kết thúc Flash Sale trong khung giờ nghỉ (01:00 - 08:00)!",
      );
      return;
    }

    // Kiểm tra nếu kéo dài qua khung giờ cấm
    // Ví dụ: Bắt đầu 23h hôm nay, kết thúc 9h sáng mai -> vi phạm vì đi qua vùng 1h-8h
    // Logic đơn giản: Nếu start < 1h sáng và end > 8h sáng cùng ngày -> vi phạm
    // Hoặc nếu qua ngày khác thì cần check kỹ hơn.
    // Ở đây ta cảnh báo đơn giản nếu thời gian sale quá dài bao trùm giờ nghỉ.
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diffHours > 18) {
      // 24h - 6h nghỉ = 18h tối đa
      if (
        !confirm(
          "Thời gian sale khá dài, có thể bao gồm khung giờ nghỉ (1h-8h). Bạn có chắc chắn muốn tiếp tục không?",
        )
      ) {
        return;
      }
    }

    // Update vào Supabase
    const { error } = await supabase
      .from("products_tw")
      .update({
        is_flash_sale: true,
        flash_sale_price: price,
        flash_sale_start: start.toISOString(),
        flash_sale_end: end.toISOString(),
      })
      .eq("id", selectedProduct.id);

    if (!error) {
      alert("✅ Đã thêm vào Flash Sale!");
      fetchFlashItems();
      closeModal();
    } else {
      alert("Lỗi: " + error.message);
    }
  };

  // Reset modal khi đóng
  const closeModal = () => {
    setIsModalOpen(false);
    setSearchTerm("");
    setSearchResults([]);
    setSelectedProduct(null);
    setSalePriceInput("");
    setStartTime("");
    setEndTime("");
  };

  return (
    <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-xl p-6 shadow-lg text-white mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold uppercase flex items-center gap-2">
            ⚡ Quản lý Flash Sale
          </h2>
          <p className="text-sm opacity-90">
            Cài đặt giảm giá theo 3 khung giờ: 08:00-22:00 | 22:00-24:00 |
            00:00-01:00
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition shadow-md flex items-center gap-1"
        >
          <span>+</span> Thêm sản phẩm
        </button>
      </div>

      {/* --- DANH SÁCH SẢN PHẨM ĐANG CHẠY --- */}
      {loading ? (
        <p>Đang tải...</p>
      ) : flashItems.length === 0 ? (
        <div className="text-center py-8 bg-white/10 rounded-lg border border-white/20">
          <p className="opacity-80">Chưa có sản phẩm nào trong Flash Sale.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {flashItems.map((item) => {
            let displayImage = item.img;
            try {
              if (item.img.startsWith("["))
                displayImage = JSON.parse(item.img)[0];
            } catch (e) {}

            return (
              <div
                key={item.id}
                className="bg-white text-gray-800 rounded-lg p-3 relative group shadow-sm"
              >
                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-md hover:scale-110 transition z-10"
                  title="Gỡ khỏi Flash Sale"
                >
                  ✕
                </button>

                <div className="aspect-square mb-2 overflow-hidden rounded bg-gray-50 flex items-center justify-center">
                  <img
                    src={displayImage}
                    alt={item.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-xs font-bold line-clamp-2 h-8 mb-1">
                  {item.title}
                </h3>

                {item.flash_sale_end && (
                  <div className="text-[10px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded mb-1 text-center truncate">
                    KT:{" "}
                    {new Date(item.flash_sale_end).toLocaleDateString("vi-VN")}{" "}
                    {new Date(item.flash_sale_end).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}

                <div className="flex justify-between items-end border-t pt-1">
                  <div>
                    <p className="text-xs text-gray-400 line-through">
                      {item.price.toLocaleString("vi-VN")}đ
                    </p>
                    <p className="text-red-600 font-bold text-sm">
                      {item.flash_sale_price?.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL THÊM SẢN PHẨM (POPUP) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white text-gray-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="bg-red-600 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">Thêm vào Flash Sale ⚡</h3>
              <button
                onClick={closeModal}
                className="text-white/80 hover:text-white font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {!selectedProduct ? (
                <div>
                  <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                    <input
                      type="text"
                      className="flex-1 border p-2 rounded-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      placeholder="Gõ tên sản phẩm cần tìm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700"
                    >
                      Tìm
                    </button>
                  </form>

                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {searchResults.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-center gap-3 p-2 border rounded-lg hover:bg-red-50 cursor-pointer transition"
                        onClick={() => setSelectedProduct(prod)}
                      >
                        <img
                          src={
                            prod.img && prod.img.startsWith("[")
                              ? JSON.parse(prod.img)[0]
                              : prod.img
                          }
                          className="w-12 h-12 object-contain rounded bg-gray-100"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-bold line-clamp-1">
                            {prod.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            Giá gốc: {prod.price.toLocaleString()}đ
                          </p>
                        </div>
                        <button className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded font-bold">
                          Chọn
                        </button>
                      </div>
                    ))}
                    {searchResults.length === 0 && searchTerm && (
                      <p className="text-center text-gray-500 text-sm">
                        Không tìm thấy sản phẩm nào.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-xs mb-1">
                      Đang chọn sản phẩm:
                    </p>
                    <p className="font-bold text-gray-800 line-clamp-1">
                      {selectedProduct.title}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Giá gốc:{" "}
                      <span className="line-through">
                        {selectedProduct.price.toLocaleString()}đ
                      </span>
                    </p>
                  </div>

                  <div className="space-y-4 text-left">
                    <div>
                      <label className="block text-sm font-bold text-red-600 mb-1">
                        GIÁ FLASH SALE (VNĐ)
                      </label>
                      <input
                        type="number"
                        autoFocus
                        className="w-full p-3 text-lg font-bold border border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 text-red-600"
                        placeholder="Ví dụ: 99000"
                        value={salePriceInput}
                        onChange={(e) => setSalePriceInput(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Bắt đầu
                        </label>
                        <input
                          type="datetime-local"
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Kết thúc
                        </label>
                        <input
                          type="datetime-local"
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 italic bg-blue-50 p-2 rounded border border-blue-100">
                      💡 Lưu ý các khung giờ hợp lệ:
                      <br />
                      - Khung 1: 08:00 - 22:00
                      <br />
                      - Khung 2: 22:00 - 24:00 (00:00 hôm sau)
                      <br />
                      - Khung 3: 00:00 - 01:00
                      <br />
                      🚫 Khung giờ nghỉ (không sale): 01:00 - 08:00
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="flex-1 py-3 bg-gray-100 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition"
                    >
                      ← Chọn lại
                    </button>
                    <button
                      onClick={handleAddFlashSale}
                      className="flex-1 py-3 bg-red-600 rounded-lg font-bold text-white hover:bg-red-700 shadow-lg transition transform hover:-translate-y-0.5"
                    >
                      LƯU NGAY
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
