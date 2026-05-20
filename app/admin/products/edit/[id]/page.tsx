"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    old_price: "",
    category: "",
    brand: "",
    origin: "Đài Loan",
    unit: "",
    description: "",
    stock_quantity: "0",
    is_best_seller: false,
  });

  const [images, setImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const id = params.id;

        // 👈 TRUY XUẤT TỪ BẢNG ĐÀI LOAN
        const { data, error } = await supabase
          .from("products_tw")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          let loadedImages: string[] = [];
          if (data.img) {
            try {
              if (data.img.startsWith("[")) {
                loadedImages = JSON.parse(data.img);
              } else {
                loadedImages = [data.img];
              }
            } catch {
              loadedImages = [data.img];
            }
          }
          setImages(loadedImages);

          setFormData({
            title: data.title || "",
            price: String(data.price) || "",
            old_price: String(data.old_price) || "",
            category: data.category || "",
            brand: data.brand || "",
            origin: data.origin || "Đài Loan",
            unit: data.unit || "",
            description: data.description || "",
            stock_quantity: String(data.stock_quantity) || "0",
            is_best_seller: data.is_best_seller || false,
          });
        }
      } catch (error) {
        console.error("Lỗi tải sản phẩm TW:", error);
        alert("Không tìm thấy sản phẩm trong kho Đài Loan!");
        router.push("/admin/inventory");
      } finally {
        setFetching(false);
      }
    };

    fetchProduct();
  }, [params, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length + files.length > 6) {
      alert("Tối đa 6 ảnh!");
      return;
    }
    const fileArray = Array.from(files);
    setNewFiles((prev) => [...prev, ...fileArray]);
    const newPreviewUrls = fileArray.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const id = params.id;

      let newUploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        setUploading(true);
        for (const file of newFiles) {
          const fileName = `tw-mart-product-${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
          const { error: uploadError } = await supabase.storage
            .from("tw-mart-products") // Đã đổi sang bucket mới
            .upload(fileName, file);
          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("tw-mart-products") // Đã đổi sang bucket mới
              .getPublicUrl(fileName);
            newUploadedUrls.push(urlData.publicUrl);
          }
        }
        setUploading(false);
      }

      const keptOldImages = images.filter((img) => !img.startsWith("blob:"));
      const finalImages = [...keptOldImages, ...newUploadedUrls];

      const payload = {
        title: formData.title,
        price: Number(formData.price),
        old_price: formData.old_price ? Number(formData.old_price) : null,
        category: formData.category,
        brand: formData.brand,
        origin: formData.origin,
        unit: formData.unit,
        description: formData.description,
        stock_quantity: Number(formData.stock_quantity),
        is_best_seller: formData.is_best_seller,
        img: JSON.stringify(finalImages),
      };

      // 👈 CẬP NHẬT VÀO BẢNG ĐÀI LOAN
      const { error } = await supabase
        .from("products_tw")
        .update(payload)
        .eq("id", id);

      if (error) throw error;

      alert("✅ Cập nhật kho Đài Loan thành công!");
      router.push("/admin/inventory");
    } catch (error: any) {
      alert("Lỗi cập nhật: " + error.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (fetching)
    return (
      <div className="p-10 text-center text-gray-500 italic">
        ⏳ Đang lấy dữ liệu từ products_tw...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-10 border border-blue-100">
        <div className="flex justify-between items-center mb-8 border-b pb-6">
          <h1 className="text-2xl font-black text-blue-900 uppercase">
            ✏️ Chỉnh Sửa Hàng Đài Loan
          </h1>
          <Link
            href="/admin/inventory"
            className="text-gray-400 hover:text-red-600 font-bold"
          >
            ✕ HỦY
          </Link>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Tên sản phẩm
            </label>
            <input
              type="text"
              className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Danh mục
              </label>
              <select
                className="w-full p-4 border rounded-xl"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              >
                <option value="Dầu Gió & Cao Dán">Dầu Gió & Cao Dán</option>
                <option value="Mỹ Phẩm & Skincare">Mỹ Phẩm & Skincare</option>
                <option value="Đặc Sản & Trà Sữa">Đặc Sản & Trà Sữa</option>
                <option value="Thực Phẩm Chức Năng">Thực Phẩm Chức Năng</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tồn kho
              </label>
              <input
                type="number"
                className="w-full p-4 border rounded-xl font-bold text-blue-600"
                value={formData.stock_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, stock_quantity: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-red-600 mb-2">
                Giá bán (đ)
              </label>
              <input
                type="number"
                className="w-full p-4 border rounded-xl font-bold"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Giá gốc (đ)
              </label>
              <input
                type="number"
                className="w-full p-4 border rounded-xl text-gray-400"
                value={formData.old_price}
                onChange={(e) =>
                  setFormData({ ...formData, old_price: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Hình ảnh ({images.length}/6)
            </label>
            <div className="flex flex-wrap gap-4 mb-4">
              {images.map((imgSrc, index) => (
                <div
                  key={index}
                  className="relative w-24 h-24 border rounded-lg overflow-hidden shadow-sm"
                >
                  <img src={imgSrc} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {images.length < 6 && (
                <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 text-2xl text-gray-300">
                  +
                </label>
              )}
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-4 bg-red-50 p-4 rounded-xl border border-red-100">
            <input
              type="checkbox"
              className="w-5 h-5"
              checked={formData.is_best_seller}
              onChange={(e) =>
                setFormData({ ...formData, is_best_seller: e.target.checked })
              }
            />
            <label className="text-sm font-bold text-red-700 uppercase">
              🔥 Hiện thị ở mục BÁN CHẠY tại trang chủ
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className={`w-full py-5 rounded-2xl font-black text-white text-xl shadow-xl transition ${loading || uploading ? "bg-gray-400" : "bg-blue-900 hover:bg-black"}`}
          >
            {loading || uploading ? "⏳ ĐANG LƯU..." : "💾 XÁC NHẬN THAY ĐỔI"}
          </button>
        </form>
      </div>
    </div>
  );
}
