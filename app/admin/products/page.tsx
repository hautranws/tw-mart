"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
// import Image from "next/image"; // Bật dòng này nếu muốn dùng Image tối ưu

const ITEMS_PER_PAGE = 100; // Số lượng hiển thị mỗi trang

export default function ProductManagementPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>("");

  // --- [CODE MỚI] State cho phân trang ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Gọi hàm fetch mỗi khi đổi trang
  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const fetchProducts = async () => {
    setLoading(true);
    setDebugInfo("Đang kết nối...");

    try {
      // 1. Lấy tổng số lượng để tính số trang
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });
      
      setTotalProducts(count || 0);

      // 2. Tính toán phân đoạn
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // 3. Lấy dữ liệu theo trang
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: false })
        .range(from, to); // [QUAN TRỌNG] Chỉ lấy 100 dòng

      if (error) {
        setDebugInfo(`❌ Lỗi: ${error.message}`);
      } else {
        if (!data || data.length === 0) {
          setDebugInfo("✅ Kết nối tốt, nhưng chưa có sản phẩm nào ở trang này.");
          setProducts([]);
        } else {
          setDebugInfo(`✅ Đang hiển thị ${data.length} sản phẩm (Trang ${currentPage}).`);
          setProducts(data);
        }
      }
    } catch (err: any) {
      setDebugInfo(`❌ Lỗi nghiêm trọng: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa không?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert("Lỗi xóa: " + error.message);
    else {
      alert("Đã xóa!");
      fetchProducts();
    }
  };

  // --- Hàm xử lý hiển thị ảnh đại diện (GIỮ NGUYÊN) ---
  const getThumbnail = (imgData: string) => {
    if (!imgData) return null;
    try {
      const parsed = JSON.parse(imgData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
      return imgData;
    } catch (e) {
      return imgData;
    }
  };
  // ---------------------------------------------

  // Tính tổng số trang
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-900">📦 QUẢN LÝ KHO (Trang {currentPage})</h1>
          <Link
            href="/admin/products/add" // Lưu ý: Code cũ của bạn link là /admin/products/add
            // Nếu bạn dùng /admin/add như ở Dashboard thì sửa lại cho khớp nhé
            className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700"
          >
            + Đăng sản phẩm mới
          </Link>
        </div>

        {/* Debug Info */}
        <div className="bg-black text-green-400 p-4 rounded mb-6 font-mono text-sm">
          Status: {debugInfo} | Tổng cộng: {totalProducts} sản phẩm
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-blue-50 text-blue-800 font-bold">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Ảnh</th>
                <th className="p-4">Tên sản phẩm</th>
                <th className="p-4">Giá</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                     ⏳ Đang tải dữ liệu...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Danh sách trống.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-500">#{p.id}</td>
                    <td className="p-4">
                      {p.img ? (
                        <img
                          src={getThumbnail(p.img)}
                          alt=""
                          className="w-10 h-10 object-contain border rounded bg-white"
                          loading="lazy"
                        />
                      ) : (
                        "No Img"
                      )}
                    </td>
                    <td className="p-4 font-medium max-w-xs truncate" title={p.title}>{p.title}</td>
                    <td className="p-4 text-blue-600 font-bold">
                      {Number(p.price).toLocaleString()}đ
                    </td>
                    <td className="p-4 text-center flex justify-center gap-2">
                      <Link
                        href={`/admin/products/${p.id}`} // Đã sửa lại cho khớp logic edit page
                        className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                      >
                        Sửa
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* --- [CODE MỚI] THANH PHÂN TRANG --- */}
          {!loading && totalProducts > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
               <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                 <div>
                    <p className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)}</span> trong <span className="font-medium">{totalProducts}</span> kết quả
                    </p>
                 </div>
                 <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 border rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-400' : 'bg-white hover:bg-gray-100'}`}
                    >
                        Trước
                    </button>
                    {/* Hiển thị số trang đơn giản */}
                    <span className="px-3 py-1 border bg-blue-50 text-blue-600 font-bold rounded">
                        Trang {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 border rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-400' : 'bg-white hover:bg-gray-100'}`}
                    >
                        Sau
                    </button>
                 </div>
               </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link href="/admin" className="text-gray-500 hover:underline">
            ← Quay về Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}