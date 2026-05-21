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

  interface ImageItem {
    id: string;
    url: string;
    file?: File;
  }

  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<ImageItem | null>(null);

  // --- [MỚI] State cho Phân loại hàng (variants) ---
  const [variants, setVariants] = useState([{ name: "", price: "", stock: "" }]);
  const [useVariants, setUseVariants] = useState(false);


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
          const loadedImageItems = loadedImages.map((url) => ({
            id: url, // Use URL as a unique ID for existing images
            url: url,
          }));
          setImageItems(loadedImageItems);

          // [MỚI] Load và xử lý variants
          if (data.variants) {
            try {
                const parsedVariants = JSON.parse(data.variants);
                if (Array.isArray(parsedVariants) && parsedVariants.length > 0) {
                    setVariants(parsedVariants);
                    setUseVariants(true);
                }
            } catch {}
          }

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
  }, [params.id, router]); // FIX VÒNG LẶP VÔ HẠN: Chỉ phụ thuộc vào params.id

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
      const totalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
      setFormData(prev => ({
        ...prev,
        price: firstVariant.price || "",
        stock_quantity: String(totalStock)
      }));
    }
  }, [variants, useVariants]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (imageItems.length + files.length > 6) {
      alert("Tối đa 6 ảnh!");
      return;
    }

    // FIX OVERLOAD: Kiểm tra dung lượng (giới hạn 2MB)
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 2 * 1024 * 1024) {
        alert(`❌ Ảnh "${files[i].name}" quá nặng (>2MB). Vui lòng nén ảnh lại để tránh sập mạng tải lên!`);
        return;
      }
    }

    const newItems: ImageItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file: file,
      url: URL.createObjectURL(file),
    }));
    setImageItems((prev) => [...prev, ...newItems]);
  };

  const removeImage = (idToRemove: string) => {
    setImageItems((prev) => prev.filter((item) => item.id !== idToRemove));
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploading(true);

    try {
      const id = params.id;
      const finalImageUrls: string[] = [];

      for (const item of imageItems) {
        if (item.file) {
          const file = item.file;
          const fileName = `tw-mart-product-${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
          const { error: uploadError } = await supabase.storage
            .from("tw-mart-products") // Đã đổi sang bucket mới
            .upload(fileName, file);
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage
            .from("tw-mart-products") // Đã đổi sang bucket mới
            .getPublicUrl(fileName);
          finalImageUrls.push(urlData.publicUrl);
        } else {
          finalImageUrls.push(item.url);
        }
      }

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
        img: JSON.stringify(finalImageUrls),
        variants: useVariants ? JSON.stringify(variants.filter(v => v.name && v.price)) : null,
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

          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4">
            <div className="flex items-center gap-3">
                <input type="checkbox" id="use-variants" className="w-5 h-5" checked={useVariants} onChange={(e) => setUseVariants(e.target.checked)} />
                <label htmlFor="use-variants" className="font-bold text-blue-800 text-lg">Sản phẩm có nhiều phân loại (dung tích, màu sắc...)</label>
            </div>

            {/* --- Giao diện cho sản phẩm có phân loại --- */}
            {useVariants ? (
                <div className="space-y-3 animate-fade-in">
                    {variants.map((variant, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 bg-white/50 rounded">
                            <div className="col-span-5">
                                <label className="text-xs font-bold text-gray-500">Tên phân loại (*)</label>
                                <input type="text" placeholder="VD: 100ml" value={variant.name} onChange={(e) => handleVariantChange(index, 'name', e.target.value)} className="w-full p-2 border rounded" required />
                            </div>
                            <div className="col-span-3">
                                <label className="text-xs font-bold text-gray-500">Giá (đ) (*)</label>
                                <input type="number" placeholder="150000" value={variant.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} className="w-full p-2 border rounded" required />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-gray-500">Tồn kho</label>
                                <input type="number" placeholder="10" value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} className="w-full p-2 border rounded" />
                            </div>
                            <div className="col-span-2 flex items-end h-full">
                                <button type="button" onClick={() => removeVariant(index)} className="bg-red-100 text-red-600 h-10 w-10 rounded font-bold hover:bg-red-200">✕</button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addVariant} className="w-full text-sm bg-blue-100 text-blue-700 font-bold py-2 rounded hover:bg-blue-200">+ Thêm phân loại</button>
                </div>
            ) : (
                /* --- Giao diện cho sản phẩm không có phân loại (như cũ) --- */
                <div className="grid grid-cols-2 gap-6 animate-fade-in">
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
                            required={!useVariants}
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
            )}

            {/* Hiển thị giá và tồn kho được tính toán */}
            {useVariants && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-200">
                    <div className="text-sm">
                        <p className="font-bold text-gray-500">Giá bán chính (tự động):</p>
                        <p className="font-bold text-red-600 text-lg">{Number(formData.price).toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div className="text-sm">
                        <p className="font-bold text-gray-500">Tổng tồn kho (tự động):</p>
                        <p className="font-bold text-blue-600 text-lg">{formData.stock_quantity}</p>
                    </div>
                </div>
            )}
          </div>

          <div className="border-t pt-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Hình ảnh ({imageItems.length}/6) - Kéo thả để sắp xếp
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-4">
              {imageItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, item)}
                  className="relative group aspect-square border rounded-lg overflow-hidden shadow-sm cursor-move"
                >
                  <img
                    src={item.url}
                    alt={`Ảnh sản phẩm ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 left-0 bg-black/50 text-white text-xs px-1.5 py-0.5 font-bold rounded-br-lg">
                    #{index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(item.id)}
                    className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 rounded-bl-lg flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa ảnh này"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {imageItems.length < 6 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 text-3xl text-gray-400 hover:text-gray-500">
                  +
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
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
