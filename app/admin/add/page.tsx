"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function AddProductPage() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  interface ImageItem {
    id: string;
    file: File;
    previewUrl: string;
  }
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<ImageItem | null>(null);

  // --- [MỚI] State cho Phân loại hàng (variants) ---
  const [variants, setVariants] = useState([
    { name: "", price: "", stock: "" },
  ]);
  const [useVariants, setUseVariants] = useState(false); // Checkbox để bật/tắt phân loại

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

  // --- [MỚI] Hàm quản lý Variants ---
  const handleVariantChange = (index: number, field: string, value: string) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { name: "", price: "", stock: "" }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) {
      alert("Phải có ít nhất một phân loại.");
      return;
    }
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
  };

  // Tự động cập nhật giá chính và tồn kho chính từ variant đầu tiên
  useEffect(() => {
    if (useVariants && variants.length > 0) {
      const firstVariant = variants[0];
      const totalStock = variants.reduce(
        (sum, v) => sum + Number(v.stock || 0),
        0,
      );
      setFormData((prev) => ({
        ...prev,
        price: firstVariant.price || "",
        stock_quantity: String(totalStock),
      }));
    }
  }, [variants, useVariants]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (imageItems.length + files.length > 6) {
        alert("Tối đa 6 ảnh!");
        return;
      }

      // FIX OVERLOAD: Cảnh báo dung lượng ảnh để không bị sập Supabase Storage
      for (let i = 0; i < files.length; i++) {
        if (files[i].size > 2 * 1024 * 1024) {
          alert(
            `❌ Ảnh "${files[i].name}" quá nặng (>2MB). Vui lòng nén ảnh trước khi tải lên để tránh lỗi sập mạng!`,
          );
          return;
        }
      }

      const newItems = Array.from(files).map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file: file,
        previewUrl: URL.createObjectURL(file),
      }));
      setImageItems((prev) => [...prev, ...newItems]);
    }
  };

  const removeImage = (id: string) => {
    setImageItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    item: ImageItem,
  ) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetItem: ImageItem,
  ) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const newItems = [...imageItems];
    const draggedIndex = newItems.findIndex((i) => i.id === draggedItem.id);
    const targetIndex = newItems.findIndex((i) => i.id === targetItem.id);
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);
    setImageItems(newItems);
    setDraggedItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (
      !formData.title ||
      (!useVariants && !formData.price) ||
      !formData.category
    ) {
      alert("⚠️ Vui lòng điền Tên, Giá và Danh mục!");
      setLoading(false);
      return;
    }

    try {
      let finalImageString = "";

      // --- XỬ LÝ UPLOAD ẢNH LÊN STORAGE ---
      if (imageItems.length > 0) {
        setUploading(true);
        const uploadedUrls: string[] = [];

        for (const item of imageItems) {
          const file = item.file;
          // Tạo tên file độc nhất để tránh bị ghi đè
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("tw-mart-products") // 👈 Đã đổi sang bucket cho sản phẩm
            .upload(filePath, file);

          if (uploadError) {
            console.error("Lỗi Storage:", uploadError);
            throw new Error(
              `Không thể tải ảnh ${file.name} lên kho. Vui lòng kiểm tra quyền Public của Bucket 'tw-mart-products'`,
            );
          }

          const { data: urlData } = supabase.storage
            .from("tw-mart-products") // 👈 Đã đổi sang bucket cho sản phẩm
            .getPublicUrl(filePath);

          uploadedUrls.push(urlData.publicUrl);
        }

        finalImageString = JSON.stringify(uploadedUrls);
        setUploading(false);
      } else if (formData.img) {
        // Dự phòng nếu dán link ảnh trực tiếp
        finalImageString = formData.img.startsWith("[")
          ? formData.img
          : JSON.stringify([formData.img]);
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
        variants: useVariants
          ? JSON.stringify(variants.filter((v) => v.name && v.price))
          : null,
      };

      const { error: dbError } = await supabase
        .from("products_tw")
        .insert([payload]);

      if (dbError) {
        console.error("Lỗi Database:", dbError);
        throw new Error(
          "Lỗi khi lưu thông tin vào bảng products_tw: " + dbError.message,
        );
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
            <p className="text-gray-500 text-sm italic">
              Hệ thống lưu trữ ảnh thông minh
            </p>
          </div>
          <Link
            href="/admin/inventory"
            className="text-blue-600 hover:underline font-bold text-sm"
          >
            ← Xem kho hàng
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Tên & Danh mục */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tên sản phẩm (*)
              </label>
              <input
                type="text"
                className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-red-500 outline-none transition"
                placeholder="VD: Bánh dứa Chia Te..."
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Danh mục (*)
              </label>
              <select
                className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-red-500 outline-none bg-white"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              >
                <option value="">-- Chọn danh mục --</option>
                <option value="Dầu Gió & Cao Dán">Dầu Gió & Cao Dán</option>
                <option value="Mỹ Phẩm & Skincare">Mỹ Phẩm & Skincare</option>
                <option value="Đặc Sản & Trà Sữa">Đặc Sản & Trà Sữa</option>
                <option value="Thực Phẩm Chức Năng">Thực Phẩm Chức Năng</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Thương hiệu
              </label>
              <input
                type="text"
                className="w-full p-4 border-2 border-gray-100 rounded-xl"
                placeholder="VD: Chia Te"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
              />
            </div>
          </div>

          {/* Tài chính & Kho */}
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="use-variants"
                className="w-5 h-5"
                checked={useVariants}
                onChange={(e) => setUseVariants(e.target.checked)}
              />
              <label
                htmlFor="use-variants"
                className="font-bold text-blue-800 text-lg"
              >
                Sản phẩm có nhiều phân loại (dung tích, màu sắc...)
              </label>
            </div>

            {/* --- Giao diện cho sản phẩm có phân loại --- */}
            {useVariants ? (
              <div className="space-y-3 animate-fade-in">
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center p-2 bg-white/50 rounded"
                  >
                    <div className="col-span-5">
                      <label className="text-xs font-bold text-gray-500">
                        Tên phân loại (*)
                      </label>
                      <input
                        type="text"
                        placeholder="VD: 100ml"
                        value={variant.name}
                        onChange={(e) =>
                          handleVariantChange(index, "name", e.target.value)
                        }
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs font-bold text-gray-500">
                        Giá (đ) (*)
                      </label>
                      <input
                        type="number"
                        placeholder="150000"
                        value={variant.price}
                        onChange={(e) =>
                          handleVariantChange(index, "price", e.target.value)
                        }
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-gray-500">
                        Tồn kho
                      </label>
                      <input
                        type="number"
                        placeholder="10"
                        value={variant.stock}
                        onChange={(e) =>
                          handleVariantChange(index, "stock", e.target.value)
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="col-span-2 flex items-end h-full">
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="bg-red-100 text-red-600 h-10 w-10 rounded font-bold hover:bg-red-200"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariant}
                  className="w-full text-sm bg-blue-100 text-blue-700 font-bold py-2 rounded hover:bg-blue-200"
                >
                  + Thêm phân loại
                </button>
                <div className="text-xs text-gray-500 italic pt-2 border-t border-blue-200">
                  <p>
                    Giá bán và tồn kho chính của sản phẩm sẽ được tự động tính
                    toán dựa trên các phân loại bạn đã nhập.
                  </p>
                  <p>Giá bán chính sẽ lấy theo giá của phân loại đầu tiên.</p>
                  <p>
                    Tồn kho chính sẽ là tổng tồn kho của tất cả các phân loại.
                  </p>
                </div>
              </div>
            ) : (
              /* --- Giao diện cho sản phẩm không có phân loại (như cũ) --- */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-2">
                    Giá bán (đ) (*)
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border-2 border-white rounded-lg font-bold text-red-600"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required={!useVariants}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    Giá cũ (nếu có)
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border-2 border-white rounded-lg"
                    value={formData.old_price}
                    onChange={(e) =>
                      setFormData({ ...formData, old_price: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    Tồn kho
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border-2 border-white rounded-lg text-center font-bold"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_quantity: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* Hiển thị giá và tồn kho được tính toán */}
            {useVariants && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-200">
                <div className="text-sm">
                  <p className="font-bold text-gray-500">
                    Giá bán chính (tự động):
                  </p>
                  <p className="font-bold text-red-600 text-lg">
                    {Number(formData.price).toLocaleString("vi-VN")}đ
                  </p>
                </div>
                <div className="text-sm">
                  <p className="font-bold text-gray-500">
                    Tổng tồn kho (tự động):
                  </p>
                  <p className="font-bold text-blue-600 text-lg">
                    {formData.stock_quantity}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* UPLOAD ẢNH */}
          <div className="border-2 border-dashed border-red-200 p-8 rounded-2xl text-center bg-red-50/20">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-center gap-2">
              📸 Hình ảnh sản phẩm (Tối đa 6 ảnh)
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Ảnh đầu tiên sẽ là ảnh đại diện. Kéo thả để sắp xếp thứ tự.
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
              disabled={imageItems.length >= 6}
            />

            {imageItems.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-6">
                {imageItems.map((item, i) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, item)}
                    className="relative group aspect-square shadow-md rounded-lg overflow-hidden border-2 border-white cursor-move"
                  >
                    <img
                      src={item.previewUrl}
                      alt={`Preview ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0 left-0 bg-black/50 text-white text-xs px-1.5 py-0.5 font-bold rounded-br-lg">
                      #{i + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(item.id)}
                      className="absolute top-0 right-0 bg-red-600 text-white w-6 h-6 rounded-bl-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xóa ảnh này"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mô tả & Submit */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Mô tả & Công dụng
            </label>
            <textarea
              className="w-full p-4 border-2 border-gray-100 rounded-xl h-40 focus:border-red-500 outline-none"
              placeholder="Thông tin chi tiết về sản phẩm..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            ></textarea>
          </div>

          <div className="flex items-center gap-4 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
            <input
              type="checkbox"
              className="w-6 h-6 rounded border-yellow-400 text-yellow-600"
              checked={formData.is_best_seller}
              onChange={(e) =>
                setFormData({ ...formData, is_best_seller: e.target.checked })
              }
            />
            <label className="text-sm font-bold text-yellow-800 uppercase italic">
              🔥 Đặt sản phẩm vào mục "Bán chạy" tại trang chủ
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className={`w-full py-5 rounded-2xl font-black text-white text-xl shadow-2xl transition transform active:scale-95 ${loading || uploading ? "bg-gray-400" : "bg-gradient-to-r from-blue-900 via-red-600 to-blue-900 bg-[length:200%_auto] hover:bg-right"}`}
          >
            {loading || uploading
              ? "⏳ ĐANG XỬ LÝ DỮ LIỆU..."
              : "🚀 ĐĂNG SẢN PHẨM LÊN SHOP"}
          </button>
        </form>
      </div>
    </div>
  );
}
