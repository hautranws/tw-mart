"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 👇 1. Import đầy đủ dữ liệu để vẽ cây danh mục
import {
  TPCN_DATA,
  DMP_DATA,
  CSCN_DATA,
  TBYT_DATA,
  THUOC_DATA,
} from "@/components/data";

// 👇 2. Tạo cấu trúc dữ liệu mapping
const CATEGORY_OPTIONS: any = {
  "Thuốc": THUOC_DATA,
  "Thực phẩm chức năng": TPCN_DATA,
  "Dược mỹ phẩm": DMP_DATA,
  "Chăm sóc cá nhân": CSCN_DATA,
  "Thiết bị y tế": TBYT_DATA,
};

export default function AddCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("fixed");
  const [discountValue, setDiscountValue] = useState(0);
  
  // --- [MỚI] STATE GIẢM TỐI ĐA ---
  const [maxDiscount, setMaxDiscount] = useState(0); 

  const [minOrder, setMinOrder] = useState(0);
  const [limitPerUser, setLimitPerUser] = useState(1);
  const [usageLimit, setUsageLimit] = useState(100);
  const [expiryDate, setExpiryDate] = useState("");

  // --- QUẢN LÝ PHẠM VI ÁP DỤNG ---
  const [scope, setScope] = useState("all"); 
  const [selectedItems, setSelectedItems] = useState<any[]>([]); 
  const [searchTerm, setSearchTerm] = useState(""); 
  const [searchResults, setSearchResults] = useState<any[]>([]); 

  // --- Effect tìm kiếm sản phẩm ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if ((scope === "include_product" || scope === "exclude_product") && searchTerm.length > 1) {
        const { data } = await supabase
          .from("products")
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

  // --- HÀM HỖ TRỢ LẤY DANH MỤC CON ---
  const getSubCategories = (mainCat: string) => {
      const groupData = CATEGORY_OPTIONS[mainCat];
      if (!groupData) return [];
      let items: any[] = [];
      Object.values(groupData).forEach((group: any) => {
        if (group.items) {
          group.items.forEach((item: any) => {
            if (item.children && item.children.length > 0) {
              items = [...items, ...item.children];
            } else {
              items.push(item);
            }
          });
        }
      });
      return Array.from(new Set(items.map((i) => i.title)));
  };

  // Hàm thêm/xóa item
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
      alert("Vui lòng nhập mã Code!");
      setLoading(false);
      return;
    }

    if (scope !== "all" && selectedItems.length === 0) {
        alert("Vui lòng chọn ít nhất 1 đối tượng áp dụng!");
        setLoading(false);
        return;
    }

    const appliedList = selectedItems.map(i => (typeof i === 'string' ? i : i.id));

    const newCoupon = {
      code: code.toUpperCase().trim(),
      discount_type: discountType,
      discount_value: discountValue,
      // 👇 Lưu thêm max_discount (nếu là percent thì lấy giá trị nhập, nếu fixed thì null hoặc 0)
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

    const { error } = await supabase.from("coupons").insert([newCoupon]);

    if (error) {
      if (error.code === "23505") alert("❌ Mã này đã tồn tại!");
      else alert("Lỗi: " + error.message);
    } else {
      alert("✅ Tạo mã thành công!");
      router.push("/admin/coupons");
    }
    setLoading(false);
  };

  // --- RENDER GIAO DIỆN CHỌN DANH MỤC ---
  const renderCategorySelector = () => (
    <div className="grid grid-cols-1 gap-4 max-h-80 overflow-y-auto border p-4 rounded bg-white">
        {Object.keys(CATEGORY_OPTIONS).map((mainCat) => {
            const subCats = getSubCategories(mainCat);
            const isMainChecked = selectedItems.includes(mainCat);
            
            return (
                <div key={mainCat} className="border-b last:border-0 pb-2">
                    <label className="flex items-center space-x-2 font-bold text-blue-800 cursor-pointer hover:bg-blue-50 p-1 rounded">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5"
                            checked={isMainChecked}
                            onChange={() => handleToggleItem(mainCat, "category")}
                        />
                        <span>{mainCat} (Tất cả)</span>
                    </label>
                    <div className="ml-8 mt-1 grid grid-cols-2 gap-2">
                        {subCats.map((sub: any) => (
                            <label key={sub} className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4"
                                    checked={selectedItems.includes(sub) || isMainChecked}
                                    disabled={isMainChecked}
                                    onChange={() => handleToggleItem(sub, "category")}
                                />
                                <span>{sub}</span>
                            </label>
                        ))}
                    </div>
                </div>
            );
        })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/coupons" className="text-gray-500 hover:text-blue-600 mb-6 inline-block">
          ← Quay lại danh sách
        </Link>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 p-6">
            <h1 className="text-2xl font-bold text-white">🎁 Tạo Khuyến Mãi Mới</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* 1. Mã Code & Loại giảm */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                    <label className="block text-gray-700 font-bold mb-1">Mã Code (*)</label>
                    <input
                        type="text" required
                        className="w-full p-3 border rounded-lg font-bold uppercase text-blue-800"
                        placeholder="VD: SALE50"
                        value={code} onChange={(e) => setCode(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-1">Loại giảm</label>
                    <select
                        className="w-full p-3 border rounded-lg"
                        value={discountType} onChange={(e) => setDiscountType(e.target.value)}
                    >
                        <option value="fixed">Tiền mặt (VNĐ)</option>
                        <option value="percent">Phần trăm (%)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-1">Giá trị</label>
                    <input
                        type="number" required min="0"
                        className="w-full p-3 border rounded-lg font-bold"
                        value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))}
                    />
                </div>
                
                {/* --- [MỚI] Ô NHẬP GIẢM TỐI ĐA (CHỈ HIỆN KHI CHỌN %) --- */}
                {discountType === "percent" && (
                    <div className="animate-fade-in">
                        <label className="block text-red-600 font-bold mb-1">Giảm tối đa (VNĐ)</label>
                        <input
                            type="number" min="0"
                            placeholder="VD: 50000"
                            className="w-full p-3 border border-red-200 bg-red-50 rounded-lg font-bold text-red-800"
                            value={maxDiscount} onChange={(e) => setMaxDiscount(Number(e.target.value))}
                        />
                        <p className="text-[10px] text-red-500 mt-1">0 = Không giới hạn</p>
                    </div>
                )}
            </div>

            {/* PHẠM VI ÁP DỤNG */}
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                <h3 className="text-lg font-bold text-blue-800 mb-3">🎯 Phạm vi áp dụng</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                    {[
                        { id: "all", label: "Toàn bộ shop" },
                        { id: "include_category", label: "✅ Theo Danh mục" },
                        { id: "exclude_category", label: "🚫 Trừ Danh mục" },
                        { id: "include_product", label: "✅ Theo Sản phẩm" },
                        { id: "exclude_product", label: "🚫 Trừ Sản phẩm" },
                    ].map((tab) => (
                        <button
                            key={tab.id} type="button"
                            onClick={() => { setScope(tab.id); setSelectedItems([]); }}
                            className={`px-3 py-2 text-sm font-bold rounded-lg border transition ${
                                scope === tab.id 
                                ? (tab.id.includes("exclude") ? "bg-red-600 text-white border-red-600" : "bg-blue-600 text-white border-blue-600")
                                : "bg-white text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {(scope === "include_category" || scope === "exclude_category") && (
                    <div>
                        <p className="text-sm text-gray-600 mb-2 italic">
                            {scope.includes("exclude") ? "Chọn các danh mục KHÔNG được giảm giá:" : "Chọn các danh mục ĐƯỢC giảm giá:"}
                        </p>
                        {renderCategorySelector()}
                    </div>
                )}

                {(scope === "include_product" || scope === "exclude_product") && (
                    <div className="relative">
                        <input 
                            type="text"
                            placeholder="Gõ tên sản phẩm để tìm..."
                            className="w-full p-3 border rounded-lg mb-2"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border shadow-xl rounded-lg max-h-60 overflow-y-auto">
                                {searchResults.map((prod) => (
                                    <div 
                                        key={prod.id}
                                        onClick={() => handleToggleItem(prod, "product")}
                                        className="flex items-center gap-3 p-2 hover:bg-blue-50 cursor-pointer border-b"
                                    >
                                        <img src={prod.img && prod.img.startsWith('[') ? JSON.parse(prod.img)[0] : prod.img} className="w-10 h-10 object-cover rounded"/>
                                        <div>
                                            <div className="text-sm font-bold">{prod.title}</div>
                                            <div className="text-xs text-blue-600">{Number(prod.price).toLocaleString()}đ</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {scope !== "all" && selectedItems.length > 0 && (
                    <div className="mt-3">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Đã chọn ({selectedItems.length}):</p>
                        <div className="flex flex-wrap gap-2">
                            {selectedItems.map((item, idx) => (
                                <span key={idx} className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 ${scope.includes("exclude") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                    {typeof item === 'string' ? item : item.title}
                                    <button type="button" onClick={() => handleToggleItem(item, typeof item === 'string' ? "category" : "product")} className="hover:text-black">✕</button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Các cài đặt phụ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-gray-700 font-bold mb-1">Đơn tối thiểu</label>
                    <input
                        type="number" className="w-full p-3 border rounded-lg"
                        value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value))}
                    />
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-1">Hạn sử dụng</label>
                    <input
                        type="datetime-local" className="w-full p-3 border rounded-lg"
                        value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-1">Tổng lượt dùng</label>
                    <input
                        type="number" className="w-full p-3 border rounded-lg"
                        value={usageLimit} onChange={(e) => setUsageLimit(Number(e.target.value))}
                    />
                </div>
                <div>
                    <label className="block text-blue-800 font-bold mb-1">Giới hạn/Khách</label>
                    <input
                        type="number" min="1" className="w-full p-3 border border-blue-200 bg-blue-50 rounded-lg"
                        value={limitPerUser} onChange={(e) => setLimitPerUser(Number(e.target.value))}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href="/admin/coupons" className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg">Hủy</Link>
              <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg">
                {loading ? "Đang xử lý..." : "✅ Tạo Mã Ngay"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}