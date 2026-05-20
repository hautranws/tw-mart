"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function AddProductPage() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    old_price: "",
    img: "", 
    category: "",
    brand: "",
    origin: "Đài Loan",
    unit: "",
    description: "",
    stock_quantity: "0",
    is_best_seller: false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files).slice(0, 6);
      setSelectedFiles(fileArray);
      // Tạo preview
      const urls = fileArray.map((file) => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.title || !formData.price || !formData.category) {
      alert("⚠️ Vui lòng điền Tên, Giá và Danh mục!");
      setLoading(false);
      return;
    }

    try {
      let finalImageString = ""; 

      // --- XỬ LÝ UPLOAD ẢNH LÊN STORAGE ---
      if (selectedFiles.length > 0) {
        setUploading(true);
        const uploadedUrls: string[] = [];
        
        for (const file of selectedFiles) {
          // Tạo tên file độc nhất để tránh bị ghi đè
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("products") // 👈 PHẢI TRÙNG TÊN VỚI BUCKET ĐÃ TẠO
            .upload(filePath, file);

          if (uploadError) {
            console.error("Lỗi Storage:", uploadError);
            throw new Error(`Không thể tải ảnh ${file.name} lên kho. Vui lòng kiểm tra quyền Public của Bucket 'products'`);
          }

          const { data: urlData } = supabase.storage
            .from("products")
            .getPublicUrl(filePath);

          uploadedUrls.push(urlData.publicUrl);
        }
        
        finalImageString = JSON.stringify(uploadedUrls);
        setUploading(false);
      } else if (formData.img) {
        // Dự phòng nếu dán link ảnh trực tiếp
        finalImageString = formData.img.startsWith("[") ? formData.img : JSON.stringify([formData.img]);
      }

      // --- LƯU THÔNG TIN VÀO DATABASE ---
      const payload = {
        title: formData.title,
        price: Number(formData.price),
        old_price: formData.old_price ? Number(formData.old_price) : null,
        img: finalImageString,
        category: formData.category,
        brand: formData.brand,
        origin: formData.origin,
        unit: formData.unit,
        description: formData.description,
        stock_quantity: Number(formData.stock_quantity),
        is_best_seller: formData.is_best_seller,
      };

      const { error: dbError } = await supabase.from("products_tw").insert([payload]);
      
      if (dbError) {
        console.error("Lỗi Database:", dbError);
        throw new Error("Lỗi khi lưu thông tin vào bảng products_tw: " + dbError.message);
      }

      alert("✅ Đã đăng hàng lên shop TWMED thành công!");
      window.location.href = "/admin/inventory";
    } catch (error: any) {
      alert("❌ " + error.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-10 border border-red-100">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">
              🇹🇼 Thêm Hàng Đài Loan
            </h1>
            <p className="text-gray-500 text-sm italic">Hệ thống lưu trữ ảnh thông minh</p>
          </div>
          <Link href="/admin/inventory" className="text-blue-600 hover:underline font-bold text-sm">
            ← Xem kho hàng
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Tên & Danh mục */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Tên sản phẩm (*)</label>
              <input type="text" className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-red-500 outline-none transition" placeholder="VD: Bánh dứa Chia Te..." value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Danh mục (*)</label>
              <select className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-red-500 outline-none bg-white" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required>
                <option value="">-- Chọn danh mục --</option>
                <option value="Dầu Gió & Cao Dán">Dầu Gió & Cao Dán</option>
                <option value="Mỹ Phẩm & Skincare">Mỹ Phẩm & Skincare</option>
                <option value="Đặc Sản & Trà Sữa">Đặc Sản & Trà Sữa</option>
                <option value="Thực Phẩm Chức Năng">Thực Phẩm Chức Năng</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Thương hiệu</label>
              <input type="text" className="w-full p-4 border-2 border-gray-100 rounded-xl" placeholder="VD: Chia Te" value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} />
            </div>
          </div>

          {/* Tài chính & Kho */}
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-blue-800 mb-2">Giá bán (đ)</label>
              <input type="number" className="w-full p-3 border-2 border-white rounded-lg font-bold text-red-600" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">Giá cũ (nếu có)</label>
              <input type="number" className="w-full p-3 border-2 border-white rounded-lg" value={formData.old_price} onChange={(e) => setFormData({...formData, old_price: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">Tồn kho</label>
              <input type="number" className="w-full p-3 border-2 border-white rounded-lg text-center font-bold" value={formData.stock_quantity} onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})} />
            </div>
          </div>

          {/* UPLOAD ẢNH */}
          <div className="border-2 border-dashed border-red-200 p-8 rounded-2xl text-center bg-red-50/20">
            <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center justify-center gap-2">
              📸 Tải ảnh lên Storage (Tối đa 6 ảnh)
            </label>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer" />
            
            {previewUrls.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                {previewUrls.map((url, i) => (
                  <div key={i} className="relative group shadow-md rounded-lg overflow-hidden border-2 border-white">
                    <img src={url} className="w-24 h-24 object-cover" />
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] px-1.5 py-0.5 font-bold">#{i+1}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mô tả & Submit */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả & Công dụng</label>
            <textarea className="w-full p-4 border-2 border-gray-100 rounded-xl h-40 focus:border-red-500 outline-none" placeholder="Thông tin chi tiết về sản phẩm..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
          </div>

          <div className="flex items-center gap-4 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
             <input type="checkbox" className="w-6 h-6 rounded border-yellow-400 text-yellow-600" checked={formData.is_best_seller} onChange={(e) => setFormData({...formData, is_best_seller: e.target.checked})} />
             <label className="text-sm font-bold text-yellow-800 uppercase italic">🔥 Đặt sản phẩm vào mục "Bán chạy" tại trang chủ</label>
          </div>

          <button type="submit" disabled={loading || uploading} className={`w-full py-5 rounded-2xl font-black text-white text-xl shadow-2xl transition transform active:scale-95 ${loading || uploading ? "bg-gray-400" : "bg-gradient-to-r from-blue-900 via-red-600 to-blue-900 bg-[length:200%_auto] hover:bg-right"}`}>
            {loading || uploading ? "⏳ ĐANG XỬ LÝ DỮ LIỆU..." : "🚀 ĐĂNG SẢN PHẨM LÊN SHOP"}
          </button>
        </form>
      </div>
    </div>
  );
}