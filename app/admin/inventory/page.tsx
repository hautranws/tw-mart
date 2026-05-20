"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

const ITEMS_PER_PAGE = 50; // Giảm xuống 50 để quản lý hàng xách tay kỹ hơn

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const fetchProducts = async () => {
    setLoading(true);

    // 1. Lấy tổng số lượng từ bảng products_tw
    const { count } = await supabase
      .from("products_tw") // 👈 ĐÃ ĐỔI SANG BẢNG ĐÀI LOAN
      .select("*", { count: "exact", head: true });
    
    setTotalProducts(count || 0);

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    // 2. Lấy dữ liệu từ products_tw
    const { data, error } = await supabase
      .from("products_tw") // 👈 ĐÃ ĐỔI SANG BẢNG ĐÀI LOAN
      .select("*")
      .order("id", { ascending: false })
      .range(from, to);

    if (data) {
      setProducts(data);
    } else if (error) {
      console.error("Lỗi tải kho Đài Loan:", error);
    }
    setLoading(false);
  };

  const handleUpdate = async (id: number, field: string, value: any) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );

    const { error } = await supabase
      .from("products_tw") // 👈 ĐÃ ĐỔI SANG BẢNG ĐÀI LOAN
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      alert("❌ Lỗi cập nhật bảng TW: " + error.message);
      fetchProducts();
    }
  };

  const getProductImage = (imgData: any) => {
    if (!imgData) return "https://via.placeholder.com/150";
    try {
      if (typeof imgData === "string" && imgData.startsWith("[")) {
        const parsed = JSON.parse(imgData);
        return Array.isArray(parsed) ? parsed[0] : imgData;
      }
      return imgData;
    } catch (e) {
      return imgData;
    }
  };

  const filteredProducts = products.filter((p) =>
    (p.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/admin" className="text-blue-600 hover:underline flex items-center gap-2">
            <span>🔙</span> Admin Dashboard
          </Link>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-gray-800">🇹🇼 Kho Hàng Đài Loan</h1>
            <p className="text-xs text-gray-500 italic">Dữ liệu từ bảng products_tw</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm trong danh sách hàng Đài Loan..."
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Link href="/admin/add" className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition flex items-center gap-2">
             <span>➕</span> Thêm hàng mới
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border border-red-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-red-50 text-red-700 uppercase text-xs font-bold">
                <tr>
                  <th className="p-4 border-b w-16">ID</th>
                  <th className="p-4 border-b w-24">Ảnh</th>
                  <th className="p-4 border-b">Tên sản phẩm</th>
                  <th className="p-4 border-b text-center w-32">Giá bán (đ)</th>
                  <th className="p-4 border-b text-center w-24">Tồn kho</th>
                  <th className="p-4 border-b text-right w-24">Sửa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="p-10 text-center text-gray-500 italic">⏳ Đang truy xuất bảng products_tw...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-500">
                      📭 Kho hàng Đài Loan đang trống. Hãy bấm "Thêm hàng mới".
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-red-50/30 transition">
                      <td className="p-4 text-gray-400 font-mono text-xs">#{product.id}</td>
                      <td className="p-4">
                        <div className="w-12 h-12 border rounded bg-white overflow-hidden relative">
                          <img src={getProductImage(product.img)} className="w-full h-full object-contain" alt="img" />
                        </div>
                      </td>
                      <td className="p-4 font-medium text-gray-800">
                        <div className="truncate max-w-xs" title={product.title}>{product.title}</div>
                        <div className="text-[10px] text-blue-600 font-bold uppercase">{product.category}</div>
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          className="w-full p-2 border rounded text-right font-semibold text-red-600"
                          value={product.price}
                          onChange={(e) => handleUpdate(product.id, "price", Number(e.target.value))}
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          className={`w-full p-2 border rounded text-center font-bold ${(product.stock_quantity || 0) < 5 ? "text-red-600 bg-red-50" : "text-gray-700"}`}
                          value={product.stock_quantity || 0}
                          onChange={(e) => handleUpdate(product.id, "stock_quantity", Number(e.target.value))}
                        />
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/admin/edit/${product.id}`} className="text-blue-600 font-bold text-xs hover:underline">SỬA CHI TIẾT</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {!loading && totalProducts > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between">
               <p className="text-sm text-gray-600">Tổng cộng: <b>{totalProducts}</b> mặt hàng Đài Loan</p>
               <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(p-1, 1))} className="px-3 py-1 border rounded bg-white text-xs disabled:opacity-50">Trước</button>
                  <span className="text-xs font-bold py-1">Trang {currentPage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} className="px-3 py-1 border rounded bg-white text-xs disabled:opacity-50">Sau</button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}