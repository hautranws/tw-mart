"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]); // Danh sách tỉnh để lấy City Code

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city_code: "",
    map_url: "",
    image_url: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Lấy danh sách tỉnh để user chọn (Đồng bộ với Checkout)
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/?depth=1")
      .then((res) => res.json())
      .then((data) => setCities(data))
      .catch((err) => console.error(err));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let uploadedImageUrl = formData.image_url;

      // 1. Upload ảnh nếu có
      if (imageFile) {
        const fileName = `${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
        // Lưu ý: Bạn nhớ tạo bucket tên là 'stores' và bật Public nhé
        const { error: uploadError } = await supabase.storage.from("stores").upload(fileName, imageFile);
        
        if (uploadError) throw new Error("Lỗi upload ảnh: " + uploadError.message);
        
        const { data: urlData } = supabase.storage.from("stores").getPublicUrl(fileName);
        uploadedImageUrl = urlData.publicUrl;
      }

      // 2. Lưu vào DB
      const { error } = await supabase.from("stores").insert([{
        ...formData,
        image_url: uploadedImageUrl
      }]);

      if (error) throw error;

      alert("✅ Thêm nhà thuốc thành công!");
      router.push("/admin/stores");

    } catch (error: any) {
      alert("❌ Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-blue-800 mb-6">🏥 Thêm Nhà Thuốc Mới</h1>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tên & SĐT */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Tên nhà thuốc (*)</label>
              <input type="text" required className="w-full border p-3 rounded" placeholder="VD: Nhà thuốc Quận 1" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Số điện thoại</label>
              <input type="text" className="w-full border p-3 rounded" placeholder="090..." 
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          {/* Chọn Tỉnh/Thành (Quan trọng để lấy City Code) */}
          <div>
            <label className="block text-sm font-bold mb-1 text-red-600">Khu vực (Tỉnh/Thành) (*)</label>
            <select required className="w-full border p-3 rounded bg-blue-50"
              value={formData.city_code}
              onChange={e => setFormData({...formData, city_code: e.target.value})}
            >
              <option value="">-- Chọn Tỉnh/Thành phố --</option>
              {cities.map((city: any) => (
                <option key={city.code} value={city.code}>{city.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Chọn đúng tỉnh để liên kết với tính năng "Nhận tại cửa hàng" ở trang Checkout.</p>
          </div>

          {/* Địa chỉ chi tiết */}
          <div>
            <label className="block text-sm font-bold mb-1">Địa chỉ hiển thị (*)</label>
            <input type="text" required className="w-full border p-3 rounded" placeholder="VD: 123 Lê Lợi, P. Bến Nghé..." 
              value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>

          {/* Google Map & Ảnh */}
          <div>
            <label className="block text-sm font-bold mb-1">Link Google Map (Share Link)</label>
            <input type="text" className="w-full border p-3 rounded" placeholder="https://maps.app.goo.gl/..." 
              value={formData.map_url} onChange={e => setFormData({...formData, map_url: e.target.value})} />
          </div>

          <div className="border-2 border-dashed border-gray-300 p-4 rounded text-center">
            <label className="cursor-pointer block">
              <span className="text-blue-600 font-bold block mb-2">📸 Tải ảnh nhà thuốc lên</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            {previewUrl && <img src={previewUrl} alt="Preview" className="h-32 mx-auto object-cover rounded shadow" />}
          </div>

          <div className="flex gap-4 pt-4">
            <Link href="/admin/stores" className="flex-1 py-3 bg-gray-200 text-center rounded font-bold text-gray-700">Hủy</Link>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">
              {loading ? "Đang lưu..." : "Lưu Nhà Thuốc"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}