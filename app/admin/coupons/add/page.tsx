"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Danh mục chuẩn của Shop Đài Loan
const TWMED_CATEGORIES = [
  "Dầu Gió & Cao Dán",
  "Mỹ Phẩm & Skincare",
  "Đặc Sản & Trà Sữa",
  "Thực Phẩm Chức Năng"
];

export default function AddCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("fixed");
  const [discountValue, setDiscountValue] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState(0); 

  const [minOrder, setMinOrder] = useState(0);
  const [limitPerUser, setLimitPerUser] = useState(1);
  const [usageLimit, setUsageLimit] = useState(100);
  const [expiryDate, setExpiryDate] = useState("");

  // QUẢN LÝ PHẠM VI ÁP DỤNG
  const [scope, setScope] = useState("all"); 
  const [selectedItems, setSelectedItems] = useState<any[]>([]); 
  const [searchTerm, setSearchTerm] = useState(""); 
  const [searchResults, setSearchResults] = useState<any[]>([]); 

  // --- Effect tìm kiếm sản phẩm trong kho products_tw ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if ((scope === "include_product" || scope === "exclude_product") && searchTerm.length > 1) {
        // 👈 TÌM KIẾM TRONG BẢNG ĐÀI LOAN
        const { data } = await supabase
          .from("products_tw")
          .select("id, title, img, price")
          .ilike("title", `%${searchTerm}%`)
          .limit(5);
        if (data) setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, scope]);

  const handleToggleItem = (item: any, type: "product" | "category") => {
    const idOrName = type === "product" ? item.id : item;
    const isExist = selectedItems.find((i) =>
        type === "product" ? i.id === idOrName : i === idOrName
    );

    if (isExist) {
        setSelectedItems(prev => prev.filter(i => (type === "product" ? i.id !== idOrName : i !== idOrName)));
    } else {
        if (type === "product") {
            setSelectedItems([...selectedItems, item]);
            setSearchTerm(""); 
            setSearchResults([]); 
        } else {
            setSelectedItems([...selectedItems, idOrName]);
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!code) {
      alert("⚠️ Vui lòng nhập mã Code!");
      setLoading(false);
      return;
    }

    if (scope !== "all" && selectedItems.length === 0) {
        alert("⚠️ Vui lòng chọn ít nhất 1 đối tượng áp dụng!");
        setLoading(false);
        return;
    }

    const appliedList = selectedItems.map(i => (typeof i === 'string' ? i : i.id));

    const newCoupon = {
      code: code.toUpperCase().trim(),
      discount_type: discountType,
      discount_value: discountValue,
      max_discount_amount: discountType === "percent" ? maxDiscount : null,
      min_order_value: minOrder,
      usage_limit: usageLimit,
      limit_per_user: limitPerUser,
      expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
      is_active: true,
      used_count: 0,
      scope: scope, 
      applied_items: appliedList 
    };

    // 👈 LƯU VÀO BẢNG coupons_tw
    const { error } = await supabase.from("coupons_tw").insert([newCoupon]);

    if (error) {
      if (error.code === "23505") alert("❌ Mã này đã tồn tại trong hệ thống TWMED!");
      else alert("Lỗi: " + error.message);
    } else {
      alert("✅ Tạo mã khuyến mãi thành công!");
      router.push("/admin/coupons");
    }
    setLoading(false);
  };

  // --- RENDER GIAO DIỆN CHỌN DANH MỤC ĐÀI LOAN ---
  const renderCategorySelector = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto border border-red-100 p-4 rounded-xl bg-white shadow-sm">
        {TWMED_CATEGORIES.map((cat) => {
            const isChecked = selectedItems.includes(cat);
            return (
                <label key={cat} className={`flex items-center space-x-3 font-bold cursor-pointer p-3 rounded-lg border transition ${isChecked ? 'bg-red-50 border-red-400 text-red-800' : 'hover:bg-gray-50 border-gray-100 text-gray-700'}`}>
                    <input 
                        type="checkbox" 
                        className="w-5 h-5 text-red-600 focus:ring-red-500 rounded"
                        checked={isChecked}
                        onChange={() => handleToggleItem(cat, "category")}
                    />
                    <span>{cat}</span>
                </label>
            );
        })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/coupons" className="text-gray-500 hover:text-red-600 font-bold mb-6 inline-block transition">
          ← Quay lại danh sách mã
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
          <div className="bg-red-600 p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">🎁 Tạo Mã Khuyến Mãi Mới</h1>
            <p className="text-red-100 font-medium mt-2">Phát hành Voucher thu hút khách hàng cho shop TWMED</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
            {/* 1. Mã Code & Loại giảm */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                    <label className="block text-gray-700 font-bold mb-2">Mã Code (*)</label>
                    <input
                        type="text" required
                        className="w-full p-4 border-2 border-red-100 rounded-xl font-black uppercase text-red-700 text-xl focus:border-red-500 outline-none transition"
                        placeholder="VD: SALE50"
                        value={code} onChange={(e) => setCode(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-2">Loại giảm</label>
                    <select
                        className="w-full p-4 border-2 border-gray-100 rounded-xl bg-white focus:border-red-500 outline-none"
                        value={discountType} onChange={(e) => setDiscountType(e.target.value)}
                    >
                        <option value="fixed">Tiền mặt (VNĐ)</option>
                        <option value="percent">Phần trăm (%)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-2">Giá trị giảm</label>
                    <input
                        type="number" required min="0"
                        className="w-full p-4 border-2 border-gray-100 rounded-xl font-bold text-lg focus:border-red-500 outline-none"
                        value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))}
                    />
                </div>
                
                {/* Ô NHẬP GIẢM TỐI ĐA (CHỈ HIỆN KHI CHỌN %) */}
                {discountType === "percent" && (
                    <div className="animate-fade-in">
                        <label className="block text-red-600 font-bold mb-2">Giảm tối đa (VNĐ)</label>
                        <input
                            type="number" min="0"
                            placeholder="VD: 50000"
                            className="w-full p-4 border-2 border-red-200 bg-red-50 rounded-xl font-bold text-red-800 outline-none focus:border-red-500"
                            value={maxDiscount} onChange={(e) => setMaxDiscount(Number(e.target.value))}
                        />
                        <p className="text-[11px] text-red-500 mt-2 font-medium">Lưu ý: 0 = Không giới hạn</p>
                    </div>
                )}
            </div>

            {/* PHẠM VI ÁP DỤNG */}
            <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100">
                <h3 className="text-lg font-bold text-red-900 mb-4">🎯 Phạm vi áp dụng</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                    {[
                        { id: "all", label: "Toàn bộ shop" },
                        { id: "include_category", label: "✅ Chọn Danh mục" },
                        { id: "exclude_category", label: "🚫 Trừ Danh mục" },
                        { id: "include_product", label: "✅ Chọn Sản phẩm" },
                        { id: "exclude_product", label: "🚫 Trừ Sản phẩm" },
                    ].map((tab) => (
                        <button
                            key={tab.id} type="button"
                            onClick={() => { setScope(tab.id); setSelectedItems([]); }}
                            className={`px-4 py-2 text-sm font-bold rounded-lg border transition ${
                                scope === tab.id 
                                ? (tab.id.includes("exclude") ? "bg-red-600 text-white border-red-600 shadow-md" : "bg-blue-600 text-white border-blue-600 shadow-md")
                                : "bg-white text-gray-600 hover:bg-gray-100 border-gray-200"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {(scope === "include_category" || scope === "exclude_category") && (
                    <div className="animate-fade-in">
                        <p className="text-sm font-medium text-gray-600 mb-3">
                            {scope.includes("exclude") ? "❌ Chọn các danh mục KHÔNG được áp dụng mã:" : "✅ Chọn các danh mục ĐƯỢC áp dụng mã:"}
                        </p>
                        {renderCategorySelector()}
                    </div>
                )}

                {(scope === "include_product" || scope === "exclude_product") && (
                    <div className="relative animate-fade-in">
                        <input 
                            type="text"
                            placeholder="🔍 Gõ tên sản phẩm Đài Loan để tìm..."
                            className="w-full p-4 border-2 border-gray-200 rounded-xl mb-2 outline-none focus:border-red-400 font-medium"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border-2 border-gray-100 shadow-2xl rounded-xl max-h-60 overflow-y-auto mt-1">
                                {searchResults.map((prod) => (
                                    <div 
                                        key={prod.id}
                                        onClick={() => handleToggleItem(prod, "product")}
                                        className="flex items-center gap-4 p-3 hover:bg-red-50 cursor-pointer border-b border-gray-50 transition"
                                    >
                                        <img src={prod.img && prod.img.startsWith('[') ? JSON.parse(prod.img)[0] : prod.img} className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm"/>
                                        <div>
                                            <div className="text-sm font-bold text-gray-800">{prod.title}</div>
                                            <div className="text-xs font-black text-red-600 mt-1">{Number(prod.price).toLocaleString()}đ</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {scope !== "all" && selectedItems.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-red-100">
                        <p className="text-xs font-black text-gray-500 uppercase mb-3">Đã chọn ({selectedItems.length}):</p>
                        <div className="flex flex-wrap gap-2">
                            {selectedItems.map((item, idx) => (
                                <span key={idx} className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-3 shadow-sm ${scope.includes("exclude") ? "bg-red-100 text-red-800 border border-red-200" : "bg-blue-100 text-blue-800 border border-blue-200"}`}>
                                    {typeof item === 'string' ? item : item.title}
                                    <button type="button" onClick={() => handleToggleItem(item, typeof item === 'string' ? "category" : "product")} className="hover:text-black opacity-50 hover:opacity-100 transition text-lg leading-none mb-0.5">×</button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Các cài đặt phụ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-gray-700 font-bold mb-2">Đơn tối thiểu (VNĐ)</label>
                    <input
                        type="number" className="w-full p-4 border-2 border-gray-100 rounded-xl outline-none focus:border-red-400"
                        value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value))}
                    />
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-2">Hạn sử dụng</label>
                    <input
                        type="datetime-local" className="w-full p-4 border-2 border-gray-100 rounded-xl outline-none focus:border-red-400 text-gray-600 font-medium"
                        value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-2">Tổng số lượng mã phát hành</label>
                    <input
                        type="number" className="w-full p-4 border-2 border-gray-100 rounded-xl outline-none focus:border-red-400"
                        value={usageLimit} onChange={(e) => setUsageLimit(Number(e.target.value))}
                    />
                </div>
                <div>
                    <label className="block text-red-800 font-bold mb-2">Giới hạn số lần dùng / 1 Khách</label>
                    <input
                        type="number" min="1" className="w-full p-4 border-2 border-red-200 bg-red-50 rounded-xl outline-none focus:border-red-500 font-bold"
                        value={limitPerUser} onChange={(e) => setLimitPerUser(Number(e.target.value))}
                    />
                </div>
            </div>

            <div className="flex flex-col-reverse md:flex-row justify-end gap-4 pt-6 border-t border-gray-100">
              <Link href="/admin/coupons" className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-center transition">Hủy Bỏ</Link>
              <button type="submit" disabled={loading} className={`px-10 py-4 font-black rounded-xl text-white shadow-xl transition transform active:scale-95 text-lg ${loading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"}`}>
                {loading ? "⏳ Đang tạo mã..." : "✅ LƯU MÃ KHUYẾN MÃI"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}