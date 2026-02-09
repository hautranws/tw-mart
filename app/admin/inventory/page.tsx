"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
// import Image from "next/image"; // [Gợi ý] Bạn nên bật dòng này nếu muốn dùng Image tối ưu sau này

const ITEMS_PER_PAGE = 100; // Số lượng hiển thị mỗi trang

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- [CODE MỚI] State cho phân trang ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [currentPage]); // Chạy lại khi đổi trang

  // --- [CODE MỚI] Hàm tìm kiếm (Debounce hoặc tìm server-side nếu cần) ---
  // Ở đây tôi giữ logic cũ client-side filter cho đơn giản,
  // nhưng nếu tìm kiếm trên toàn bộ 4000 sp thì nên làm server-side search sau này.
  // Hiện tại logic này chỉ tìm trong 100 sp đang hiển thị.
  // Để tìm toàn bộ, ta cần sửa fetchProducts thêm tham số search.
  // -> Tạm thời giữ nguyên logic tìm kiếm client-side trên tập data đã fetch để an toàn code cũ.

  const fetchProducts = async () => {
    setLoading(true);

    // 1. Lấy tổng số lượng để tính số trang
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    
    setTotalProducts(count || 0);

    // 2. Tính toán phân đoạn (Pagination Range)
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    // 3. Lấy dữ liệu phân trang từ Supabase
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false })
      .range(from, to); // Chỉ lấy từ dòng 'from' đến 'to'

    if (data) {
      setProducts(data);
    } else if (error) {
      console.error("Lỗi tải kho:", error);
    }
    setLoading(false);
  };

  // Hàm cập nhật nhanh (Optimistic UI) - GIỮ NGUYÊN
  const handleUpdate = async (id: number, field: string, value: any) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );

    const { error } = await supabase
      .from("products")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      alert("❌ Lỗi cập nhật: " + error.message);
      fetchProducts();
    }
  };

  // Hàm xử lý ảnh an toàn - GIỮ NGUYÊN
  const getProductImage = (imgData: any) => {
    if (!imgData) return "https://via.placeholder.com/150";
    if (Array.isArray(imgData)) {
      return imgData[0] || "https://via.placeholder.com/150";
    }
    if (typeof imgData === "string") {
      if (imgData.startsWith("[")) {
        try {
          const parsed = JSON.parse(imgData);
          return Array.isArray(parsed) ? parsed[0] : imgData;
        } catch (e) {
          return "https://via.placeholder.com/150";
        }
      }
      return imgData;
    }
    return "https://via.placeholder.com/150";
  };

  // Lọc sản phẩm theo tên - GIỮ NGUYÊN (Tìm trong trang hiện tại)
  const filteredProducts = products.filter((p) =>
    (p.title || p.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- [CODE MỚI] Tính tổng số trang ---
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header - GIỮ NGUYÊN */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/admin" className="text-blue-600 hover:underline flex items-center gap-2">
            <span>🔙</span> Quay lại Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">📦 Quản Lý Kho Hàng</h1>
        </div>

        {/* Thanh tìm kiếm - GIỮ NGUYÊN */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <input
            type="text"
            placeholder="🔍 Nhập tên sản phẩm (trong trang hiện tại)..."
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Bảng dữ liệu - GIỮ NGUYÊN CẤU TRÚC */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-bold">
                <tr>
                  <th className="p-4 border-b w-16">ID</th>
                  <th className="p-4 border-b w-24">Hình ảnh</th>
                  <th className="p-4 border-b">Tên sản phẩm</th>
                  <th className="p-4 border-b text-center w-32">Giá bán (VNĐ)</th>
                  <th className="p-4 border-b text-center w-24">Tồn kho</th>
                  <th className="p-4 border-b text-right w-24">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-500">
                      ⏳ Đang tải dữ liệu từ kho...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-500">
                      📭 Không tìm thấy sản phẩm nào ở trang này.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-blue-50 transition duration-150">
                      <td className="p-4 text-gray-500 font-mono text-xs">
                        #{product.id}
                      </td>
                      <td className="p-4">
                        <div className="w-12 h-12 border rounded bg-white flex items-center justify-center overflow-hidden relative">
                          <img
                            src={getProductImage(product.img || product.image_url)}
                            className="w-full h-full object-contain"
                            alt="sp"
                            loading="lazy"
                          />
                        </div>
                      </td>
                      <td className="p-4 font-medium text-gray-800">
                        <div
                          className="truncate max-w-[200px] md:max-w-xs"
                          title={product.title || product.name}
                        >
                          {product.title || product.name}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          className="w-full p-2 border rounded text-right focus:border-blue-500 outline-none focus:ring-1 focus:ring-blue-200 font-semibold text-gray-700"
                          value={product.price}
                          onChange={(e) =>
                            handleUpdate(product.id, "price", Number(e.target.value))
                          }
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          className={`w-full p-2 border rounded text-center focus:border-blue-500 outline-none focus:ring-1 focus:ring-blue-200 font-bold ${
                            (product.quantity || 0) < 10 ? "text-red-600 bg-red-50" : "text-gray-700"
                          }`}
                          value={product.quantity || 0}
                          onChange={(e) =>
                            handleUpdate(product.id, "quantity", Number(e.target.value))
                          }
                        />
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="inline-block text-blue-600 hover:text-blue-800 text-xs font-bold bg-blue-100 px-3 py-2 rounded hover:bg-blue-200 transition"
                        >
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- [CODE MỚI] THANH ĐIỀU HƯỚNG PHÂN TRANG --- */}
          {!loading && totalProducts > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> đến{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)}
                    </span>{" "}
                    trong tổng số <span className="font-medium">{totalProducts}</span> kết quả
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {/* Nút Trước */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span className="sr-only">Previous</span>
                      ◀ Trước
                    </button>
                    
                    {/* Hiển thị số trang */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Logic hiển thị dải trang thông minh (Luôn hiện trang hiện tại ở giữa)
                        let pageNum = currentPage - 2 + i;
                        if (currentPage <= 3) pageNum = i + 1;
                        if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
                        
                        if (pageNum > 0 && pageNum <= totalPages) {
                            return (
                                <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === pageNum
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                                >
                                {pageNum}
                                </button>
                            );
                        }
                        return null;
                    })}

                    {/* Nút Sau */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      Sau ▶
                      <span className="sr-only">Next</span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}