"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function StoresManagementPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    const { data, error } = await supabase.from("stores").select("*").order("id", { ascending: true });
    if (data) setStores(data);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa nhà thuốc này?")) return;
    const { error } = await supabase.from("stores").delete().eq("id", id);
    if (!error) {
      alert("Đã xóa thành công!");
      fetchStores();
    } else {
      alert("Lỗi xóa: " + error.message);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-800">🏥 QUẢN LÝ HỆ THỐNG NHÀ THUỐC</h1>
        <Link href="/admin/stores/add" className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 shadow">
          + Thêm Nhà Thuốc Mới
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-bold">
            <tr>
              <th className="p-4 border-b">ID</th>
              <th className="p-4 border-b">Hình ảnh</th>
              <th className="p-4 border-b">Tên & Địa chỉ</th>
              <th className="p-4 border-b">Khu vực (City Code)</th>
              <th className="p-4 border-b">Google Map</th>
              <th className="p-4 border-b text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center">Đang tải...</td></tr>
            ) : stores.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">Chưa có nhà thuốc nào.</td></tr>
            ) : (
              stores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50 border-b last:border-0">
                  <td className="p-4 font-bold text-gray-500">#{store.id}</td>
                  <td className="p-4">
                    <img src={store.image_url || "https://via.placeholder.com/100"} className="w-16 h-16 object-cover rounded border" alt="" />
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-blue-900">{store.name}</div>
                    <div className="text-sm text-gray-600">{store.address}</div>
                    <div className="text-xs text-gray-500">SĐT: {store.phone}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{store.city_code}</span>
                  </td>
                  <td className="p-4 text-xs max-w-xs truncate text-blue-500">
                    <a href={store.map_url} target="_blank" rel="noreferrer" className="underline">Xem Map</a>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(store.id)} className="text-red-600 hover:text-red-800 font-bold text-sm">Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}