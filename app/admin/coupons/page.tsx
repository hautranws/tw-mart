"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    // 👈 ĐÃ ĐỔI SANG BẢNG coupons_tw
    const { data, error } = await supabase
      .from("coupons_tw")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setCoupons(data);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa mã khuyến mãi Đài Loan này không?")) return;

    // 👈 ĐÃ ĐỔI SANG BẢNG coupons_tw
    const { error } = await supabase.from("coupons_tw").delete().eq("id", id);
    if (error) {
      alert("Lỗi xóa: " + error.message);
    } else {
      fetchCoupons(); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
          <Link href="/admin" className="text-gray-500 hover:text-red-600 hover:underline flex items-center gap-2 font-bold">
            <span>🔙</span> Về Dashboard
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-black text-red-700 uppercase tracking-wide flex items-center gap-2">
                🇹🇼 Quản Lý Mã Khuyến Mãi TWMED
            </h1>
            <p className="text-xs text-gray-400 italic">Dữ liệu từ bảng coupons_tw</p>
          </div>
          <div className="flex gap-4">
             <Link 
                href="/admin/coupons/add" 
                className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-red-700 shadow-md flex items-center gap-2 transition transform active:scale-95 uppercase text-sm"
             >
                + Tạo Mã Mới
             </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-red-100">
            <div className="p-5 border-b border-red-50 bg-red-50/30 flex justify-between items-center">
                <h2 className="text-lg font-bold text-red-900 flex items-center gap-2"><span>🎫</span> Danh Sách Mã Hiện Có</h2>
                <span className="bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-sm shadow-sm">Tổng cộng: {coupons.length} mã</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
              <thead className="bg-red-600 text-white uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="p-4 border-b border-red-700">Mã Code</th>
                  <th className="p-4 border-b border-red-700">Loại giảm</th>
                  <th className="p-4 border-b border-red-700 text-center">Giá trị</th>
                  <th className="p-4 border-b border-red-700">Điều kiện</th>
                  <th className="p-4 border-b border-red-700 text-center">Đã dùng</th>
                  <th className="p-4 border-b border-red-700">Hạn sử dụng</th>
                  <th className="p-4 border-b border-red-700 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr><td colSpan={7} className="p-10 text-center text-gray-500 italic">⏳ Đang tải dữ liệu từ coupons_tw...</td></tr>
                ) : coupons.length === 0 ? (
                  <tr><td colSpan={7} className="p-10 text-center text-gray-500">Chưa có mã giảm giá nào. Hãy bấm "Tạo Mã Mới".</td></tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-red-50 transition duration-150">
                      <td className="p-4 font-black text-red-700 text-base">{c.code}</td>
                      <td className="p-4">
                          {c.discount_type === 'percent' ? 
                              <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded text-xs font-bold border border-yellow-200">Theo %</span> : 
                              <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded text-xs font-bold border border-green-200">Trừ tiền</span>
                          }
                      </td>
                      <td className="p-4 text-center font-black text-gray-800 text-lg">
                          {c.discount_type === 'percent' ? `${c.discount_value}%` : `${Number(c.discount_value).toLocaleString()}đ`}
                      </td>
                      <td className="p-4 text-gray-600 font-medium">
                          Đơn tối thiểu:<br/> <span className="text-red-600 font-bold">{Number(c.min_order_value).toLocaleString()}đ</span>
                      </td>
                      <td className="p-4 text-center">
                          <span className="font-black text-blue-600 text-lg">{c.used_count}</span>
                          <span className="text-gray-400 font-medium"> / {c.usage_limit === 0 ? "∞" : c.usage_limit}</span>
                          {c.usage_limit > 0 && c.used_count >= c.usage_limit && (
                              <span className="block text-[10px] bg-red-100 text-red-600 font-bold mt-1 px-1 py-0.5 rounded uppercase tracking-tighter">Hết lượt</span>
                          )}
                      </td>
                      <td className="p-4">
                          {c.expiry_date ? (
                              new Date(c.expiry_date) < new Date() ? 
                              <span className="text-gray-400 font-bold line-through">Đã hết hạn</span> :
                              <span className="text-gray-800 font-bold">{new Date(c.expiry_date).toLocaleDateString('vi-VN')}</span>
                          ) : <span className="text-blue-600 font-bold italic">Không giới hạn</span>}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="text-red-500 hover:text-white font-bold hover:bg-red-600 border border-red-500 px-3 py-1.5 rounded transition shadow-sm"
                        >
                          Xóa mã
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
        </div>
      </div>
    </div>
  );
}