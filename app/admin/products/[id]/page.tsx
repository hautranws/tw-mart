"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string; // Ép kiểu string để tránh lỗi Typescript/Next.js

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // --- QUẢN LÝ ẢNH ---
  const [existingImages, setExistingImages] = useState<string[]>([]); // Ảnh cũ từ DB
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);     // File mới chọn từ máy
  const [previewNewUrls, setPreviewNewUrls] = useState<string[]>([]); // Xem trước ảnh mới

  // State thông tin sản phẩm
  const [product, setProduct] = useState({
    title: "",
    price: 0,
    old_price: 0,
    category_id: "",
    description: "",
  });

  useEffect(() => {
    if (id) fetchProductDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProductDetail = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        // Xử lý ảnh: Parse từ JSON string sang Mảng
        let images: string[] = [];
        if (data.img) {
          if (data.img.startsWith("[")) {
            try {
              const parsed = JSON.parse(data.img);
              if (Array.isArray(parsed)) images = parsed;
            } catch (e) {
              images = [];
            }
          } else {
            // Nếu là link đơn lẻ (code cũ)
            images = [data.img];
          }
        }
        setExistingImages(images);

        setProduct({
          title: data.title || "",
          price: data.price || 0,
          old_price: data.old_price || 0,
          category_id: data.category_id || "",
          description: data.description || "",
        });
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Không tìm thấy sản phẩm!");
    } finally {
      setLoading(false);
    }
  };

  // --- XỬ LÝ ẢNH ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      // Kiểm tra tổng số ảnh (Cũ + Mới không quá 6)
      if (existingImages.length + fileArray.length > 6) {
        alert("⚠️ Tổng số ảnh (cũ + mới) không được quá 6 hình!");
        return;
      }

      setSelectedFiles(fileArray);
      // Tạo preview cho ảnh mới
      const newUrls = fileArray.map((file) => URL.createObjectURL(file));
      setPreviewNewUrls(newUrls);
    }
  };

  const removeExistingImage = (indexToRemove: number) => {
    if (window.confirm("Bạn muốn xóa ảnh này khỏi danh sách?")) {
      setExistingImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    }
  };

  const removeNewFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    setPreviewNewUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- LƯU DỮ LIỆU ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      let finalImages = [...existingImages]; // Bắt đầu bằng ảnh cũ còn lại

      // 1. Nếu có ảnh mới -> Upload lên Supabase
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          // Tạo tên file ngẫu nhiên để tránh trùng
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
          
          const { error: uploadError } = await supabase.storage
            .from("products") // Đảm bảo bucket tên là 'products'
            .upload(fileName, file);

          if (uploadError) throw new Error("Lỗi upload ảnh: " + uploadError.message);

          const { data: urlData } = supabase.storage
            .from("products")
            .getPublicUrl(fileName);

          finalImages.push(urlData.publicUrl);
        }
      }

      // 2. Cập nhật vào Database
      const { error } = await supabase
        .from("products")
        .update({
          title: product.title,
          price: Number(product.price),
          old_price: Number(product.old_price),
          img: JSON.stringify(finalImages), // Lưu dưới dạng mảng JSON string
          category_id: product.category_id,
          description: product.description,
        })
        .eq("id", id);

      if (error) throw error;

      alert("✅ Cập nhật thành công!");
      router.push("/admin/inventory"); // Quay về Kho
    } catch (error: any) {
      alert("❌ Lỗi cập nhật: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">⏳ Đang tải thông tin...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <h1 className="text-white text-xl font-bold">✏️ Chỉnh Sửa Sản Phẩm</h1>
          <Link href="/admin/inventory" className="text-blue-100 hover:text-white text-sm font-bold">
              ↩ Quay lại Kho
          </Link>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-6 text-gray-700">
          
          {/* Tên sản phẩm */}
          <div>
            <label className="block text-sm font-bold mb-1">Tên sản phẩm (*)</label>
            <input
              type="text"
              className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={product.title}
              onChange={(e) => setProduct({ ...product, title: e.target.value })}
              required
            />
          </div>

          {/* --- KHU VỰC QUẢN LÝ ẢNH (MỚI) --- */}
          <div className="bg-gray-50 p-4 rounded border border-dashed border-gray-400">
            <label className="block text-sm font-bold mb-3">📸 Quản lý hình ảnh (Tối đa 6)</label>
            
            {/* 1. Danh sách ảnh cũ */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Ảnh hiện có (Bấm vào ❌ để xóa):</p>
                <div className="grid grid-cols-4 gap-2">
                  {existingImages.map((url, idx) => (
                    <div key={idx} className="relative group w-20 h-20">
                      <img src={url} alt="old" className="w-full h-full object-cover rounded border bg-white" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow hover:bg-red-700"
                        title="Xóa ảnh này"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Upload ảnh mới */}
            <div className="mt-2">
               <label className="cursor-pointer bg-blue-100 text-blue-700 px-4 py-2 rounded font-bold hover:bg-blue-200 inline-block transition">
                 📂 Chọn thêm ảnh từ máy tính
                 <input 
                   type="file" 
                   multiple 
                   accept="image/*" 
                   onChange={handleFileChange} 
                   className="hidden" 
                 />
               </label>
               <p className="text-xs text-gray-400 mt-1 italic">Giữ phím Ctrl để chọn nhiều ảnh cùng lúc.</p>
            </div>

            {/* 3. Preview ảnh mới chọn */}
            {previewNewUrls.length > 0 && (
              <div className="mt-4 border-t pt-2">
                <p className="text-xs text-green-600 mb-2 font-bold">Ảnh mới chuẩn bị upload:</p>
                <div className="grid grid-cols-4 gap-2">
                  {previewNewUrls.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20">
                      <img src={url} alt="new" className="w-full h-full object-cover rounded border border-green-400" />
                      <button
                        type="button"
                        onClick={() => removeNewFile(idx)}
                        className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow hover:bg-gray-700"
                        title="Bỏ chọn ảnh này"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* ------------------------- */}

          {/* Giá cả */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1 text-red-600">Giá bán (VNĐ)</label>
              <input
                type="number"
                className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                value={product.price}
                onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-gray-500">Giá cũ (nếu có)</label>
              <input
                type="number"
                className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={product.old_price}
                onChange={(e) => setProduct({ ...product, old_price: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Danh mục & Mô tả */}
          <div>
            <label className="block text-sm font-bold mb-1">Mã Danh Mục (Category ID)</label>
            <input
              type="text"
              className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={product.category_id}
              onChange={(e) => setProduct({ ...product, category_id: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Mô tả chi tiết</label>
            <textarea
              rows={5}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={product.description}
              onChange={(e) => setProduct({ ...product, description: e.target.value })}
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 flex gap-3 border-t mt-4">
            <button
              type="submit"
              disabled={updating}
              className={`flex-1 py-3 rounded-lg font-bold text-white text-lg shadow transition ${
                updating ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {updating ? "⏳ Đang lưu & Upload..." : "💾 LƯU THAY ĐỔI"}
            </button>
            
            <Link
                href="/admin/inventory"
                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 flex items-center justify-center transition"
            >
                Hủy
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}