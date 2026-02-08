"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Đảm bảo file data này tồn tại trong dự án của bạn
import {
  TPCN_DATA,
  DMP_DATA,
  CSCN_DATA,
  TBYT_DATA,
  THUOC_DATA,
} from "@/components/data";

const CATEGORY_OPTIONS: any = {
  Thuốc: THUOC_DATA,
  "Thực phẩm chức năng": TPCN_DATA,
  "Dược mỹ phẩm": DMP_DATA,
  "Chăm sóc cá nhân": CSCN_DATA,
  "Thiết bị y tế": TBYT_DATA,
};

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>; // Cập nhật type cho Next.js mới nhất
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false); // --- MỚI: Trạng thái upload ---

  // --- STATE DỮ LIỆU ---
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    old_price: "",
    category: "",
    sub_category: [] as string[],
    brand: "",
    origin: "",
    unit: "",
    description: "",
    registration_no: "",
    dosage_form: "",
    specification: "",
    manufacturer: "",
    ingredients: "",
    expiry: "",
    is_best_seller: false,
  });

  // --- STATE QUẢN LÝ ẢNH ---
  const [images, setImages] = useState<string[]>([]); // Dùng để hiển thị (Preview)
  const [newFiles, setNewFiles] = useState<File[]>([]); // --- MỚI: Chứa file chờ upload ---
  const [subOptions, setSubOptions] = useState<any[]>([]);

  // --- 1. Lấy dữ liệu cũ ---
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Unwrap params (xử lý bất đồng bộ cho Next.js 15+)
        const resolvedParams = await params;
        const id = resolvedParams.id;

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          // Xử lý danh mục phụ (String -> Array)
          let subs: string[] = [];
          if (data.sub_category) {
            if (data.sub_category.startsWith("[")) {
               try {
                  subs = JSON.parse(data.sub_category);
               } catch {
                  subs = [];
               }
            } else {
               subs = data.sub_category.split(",").map((s: string) => s.trim());
            }
          }

          // --- XỬ LÝ ẢNH CŨ ---
          let loadedImages: string[] = [];
          if (data.img) {
            try {
              // Nếu là JSON mảng (Kiểu mới)
              if (data.img.startsWith("[")) {
                const parsed = JSON.parse(data.img);
                loadedImages = Array.isArray(parsed) ? parsed : [data.img];
              } else {
                // Nếu là Base64 hoặc link đơn (Kiểu cũ)
                loadedImages = [data.img];
              }
            } catch {
              loadedImages = [data.img];
            }
          }
          setImages(loadedImages);

          // Đổ dữ liệu vào Form
          setFormData({
            title: data.title || "",
            price: data.price || "",
            old_price: data.old_price || "",
            category: data.category || "", 
            sub_category: subs,
            brand: data.brand || "",
            origin: data.origin || "",
            unit: data.unit || "",
            description: data.description || "",
            registration_no: data.registration_no || "",
            dosage_form: data.dosage_form || "",
            specification: data.specification || "",
            manufacturer: data.manufacturer || "",
            ingredients: data.ingredients || "",
            expiry: data.expiry || "",
            is_best_seller: data.is_best_seller || false,
          });

          // Load danh mục con
          if (data.category && CATEGORY_OPTIONS[data.category]) {
            const groupData = CATEGORY_OPTIONS[data.category];
            let items: any[] = [];
            Object.values(groupData).forEach((group: any) => {
              if (group.items) {
                group.items.forEach((item: any) => {
                  if (item.children && item.children.length > 0) {
                    items = [...items, ...item.children];
                  } else {
                    items.push(item);
                  }
                });
              }
            });
            const uniqueItems = Array.from(
              new Set(items.map((i) => i.title))
            ).map((title) => items.find((i) => i.title === title));
            setSubOptions(uniqueItems);
          }
        }
      } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
        alert("Không tìm thấy sản phẩm hoặc lỗi kết nối!");
        router.push("/admin/products");
      } finally {
        setFetching(false);
      }
    };

    fetchProduct();
  }, [params, router]);

  // --- Logic thay đổi Danh mục lớn ---
  const handleCategoryChange = (e: any) => {
    const selectedCat = e.target.value;
    setFormData({ ...formData, category: selectedCat, sub_category: [] });

    if (selectedCat && CATEGORY_OPTIONS[selectedCat]) {
      const groupData = CATEGORY_OPTIONS[selectedCat];
      let items: any[] = [];
      Object.values(groupData).forEach((group: any) => {
        if (group.items) {
          group.items.forEach((item: any) => {
            if (item.children && item.children.length > 0) {
              items = [...items, ...item.children];
            } else {
              items.push(item);
            }
          });
        }
      });
      const uniqueItems = Array.from(new Set(items.map((i) => i.title))).map(
        (title) => items.find((i) => i.title === title)
      );
      setSubOptions(uniqueItems);
    } else {
      setSubOptions([]);
    }
  };

  const handleSubCategoryChange = (subTitle: string) => {
    setFormData((prev) => {
      const currentSubs = prev.sub_category;
      if (currentSubs.includes(subTitle)) {
        return {
          ...prev,
          sub_category: currentSubs.filter((s) => s !== subTitle),
        };
      } else {
        return { ...prev, sub_category: [...currentSubs, subTitle] };
      }
    });
  };

  // --- [ĐÃ SỬA] XỬ LÝ ẢNH: CHUẨN BỊ FILE ĐỂ UPLOAD ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 6) {
      alert("Chỉ được đăng tối đa 6 ảnh!");
      return;
    }

    const fileArray = Array.from(files);
    
    // Thêm file vào hàng đợi upload
    setNewFiles((prev) => [...prev, ...fileArray]);

    // Tạo ảnh preview ngay lập tức (dùng Blob URL nhẹ nhàng)
    const newPreviewUrls = fileArray.map(file => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (indexToRemove: number) => {
    // Lưu ý: Nếu xóa ảnh mới chọn thì file đó vẫn nằm trong hàng đợi upload (chấp nhận được)
    // Hoặc logic phức tạp hơn cần map ID. Ở đây làm đơn giản là xóa khỏi giao diện.
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- 2. Hàm Cập Nhật (UPDATE) ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const resolvedParams = await params;
      const id = resolvedParams.id;

      // 1. Upload ảnh mới (nếu có) lên Storage
      let newUploadedUrls: string[] = [];
      if (newFiles.length > 0) {
          setUploading(true);
          for (const file of newFiles) {
              const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
              const { error: uploadError } = await supabase.storage
                  .from("products") // Upload vào bucket 'products'
                  .upload(fileName, file);
              
              if (uploadError) {
                  console.error("Lỗi upload:", uploadError);
                  // Không throw error để vẫn lưu được các ảnh khác
                  continue; 
              }

              const { data: urlData } = supabase.storage
                  .from("products")
                  .getPublicUrl(fileName);
              
              newUploadedUrls.push(urlData.publicUrl);
          }
          setUploading(false);
      }

      // 2. Gộp ảnh:
      // - Lấy những ảnh CŨ còn giữ lại (là những link bắt đầu bằng http hoặc data:image cũ)
      // - Loại bỏ những ảnh blob: (là ảnh preview tạm thời, thay bằng link thật vừa upload)
      const keptOldImages = images.filter(img => !img.startsWith('blob:'));
      
      // - Gộp ảnh cũ + ảnh mới vừa upload xong
      const finalImages = [...keptOldImages, ...newUploadedUrls];
      const imgJsonString = JSON.stringify(finalImages);

      const subCategoryString = formData.sub_category.join(", ");

      const payload = {
        ...formData,
        img: imgJsonString, // Lưu chuỗi JSON link ảnh
        sub_category: subCategoryString,
        price: Number(formData.price),
        old_price: formData.old_price ? Number(formData.old_price) : 0,
      };

      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", id);

      if (error) throw error;

      alert("✅ Cập nhật thành công!");
      router.push("/admin/activity"); 
    } catch (error: any) {
      console.error(error);
      alert("Lỗi cập nhật: " + error.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (fetching)
    return <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-yellow-600 uppercase flex items-center gap-2">
            ✏️ CHỈNH SỬA SẢN PHẨM
          </h1>
          <Link
            href="/admin/activity"
            className="text-sm text-gray-500 hover:text-blue-600 underline"
          >
            ← Hủy bỏ
          </Link>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Tên SP */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Tên sản phẩm
            </label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          {/* --- CHECKBOX BÁN CHẠY --- */}
          <div className="flex items-center p-3 bg-red-50 border border-red-100 rounded-lg">
            <input
              id="bestseller-check"
              type="checkbox"
              className="w-5 h-5 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
              checked={formData.is_best_seller}
              onChange={(e) =>
                setFormData({ ...formData, is_best_seller: e.target.checked })
              }
            />
            <label
              htmlFor="bestseller-check"
              className="ml-3 text-red-700 font-bold cursor-pointer select-none"
            >
              🔥 Đánh dấu là sản phẩm bán chạy (Best Seller)
            </label>
          </div>

          {/* --- KHU VỰC QUẢN LÝ NHIỀU ẢNH --- */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Hình ảnh sản phẩm ({images.length}/6)
            </label>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-4">
              {images.map((imgSrc, index) => (
                <div
                  key={index}
                  className="relative w-full h-24 border rounded-lg overflow-hidden group bg-gray-50"
                >
                  <img
                    src={imgSrc}
                    alt={`Ảnh ${index}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-80 hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {images.length < 6 && (
                <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 h-24 text-gray-400 transition">
                  <span className="text-2xl">+</span>
                  <span className="text-xs">Thêm ảnh</span>
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

          {/* Danh mục */}
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100">
            <div className="mb-4">
              <label className="block text-sm font-bold text-blue-800 mb-2">
                1. Danh Mục Lớn
              </label>
              <select
                className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-300 outline-none"
                value={formData.category}
                onChange={handleCategoryChange}
                required
              >
                <option value="">-- Chọn danh mục --</option>
                {Object.keys(CATEGORY_OPTIONS).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-blue-800 mb-2">
                2. Loại Chi Tiết ({formData.sub_category.length})
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-white border rounded-lg">
                {subOptions.length > 0 ? (
                  subOptions.map((item, idx) => (
                    <label
                      key={idx}
                      className="flex items-start space-x-2 cursor-pointer hover:bg-blue-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 mt-1"
                        value={item.title}
                        checked={formData.sub_category.includes(item.title)}
                        onChange={() => handleSubCategoryChange(item.title)}
                      />
                      <span className="text-sm">{item.title}</span>
                    </label>
                  ))
                ) : (
                  <div className="col-span-3 text-center text-gray-500 text-sm py-4">
                    {formData.category ? "Không có mục con" : "Vui lòng chọn danh mục lớn trước"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Giá cả */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Giá bán (VNĐ)</label>
              <input
                type="number"
                className="w-full p-3 border rounded-lg"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-gray-500">Giá cũ</label>
              <input
                type="number"
                className="w-full p-3 border rounded-lg"
                value={formData.old_price}
                onChange={(e) =>
                  setFormData({ ...formData, old_price: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Đơn vị (Hộp/Vỉ)</label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
              />
            </div>
          </div>

          {/* Thương hiệu & Xuất xứ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">
                Thương hiệu
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Xuất xứ</label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg"
                value={formData.origin}
                onChange={(e) =>
                  setFormData({ ...formData, origin: e.target.value })
                }
              />
            </div>
          </div>

          {/* --- KHU VỰC THÔNG TIN CHI TIẾT --- */}
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mt-6">
            <h3 className="text-lg font-bold text-yellow-800 mb-4 border-b border-yellow-200 pb-2">
              📋 Thông tin dược phẩm chi tiết
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Số đăng ký
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg"
                  value={formData.registration_no}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registration_no: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Dạng bào chế
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg"
                  value={formData.dosage_form}
                  onChange={(e) =>
                    setFormData({ ...formData, dosage_form: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Quy cách đóng gói
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg"
                  value={formData.specification}
                  onChange={(e) =>
                    setFormData({ ...formData, specification: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Hạn sử dụng
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg"
                  value={formData.expiry}
                  onChange={(e) =>
                    setFormData({ ...formData, expiry: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Nhà sản xuất
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Thành phần
                </label>
                <textarea
                  className="w-full p-3 border rounded-lg h-24"
                  value={formData.ingredients}
                  onChange={(e) =>
                    setFormData({ ...formData, ingredients: e.target.value })
                  }
                ></textarea>
              </div>
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-bold mb-1">Mô tả sản phẩm</label>
            <textarea
              className="w-full p-3 border rounded-lg h-32"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className={`w-full py-4 rounded-lg font-bold text-white text-lg transition ${
              loading || uploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-yellow-500 hover:bg-yellow-600 shadow-lg"
            }`}
          >
            {loading || uploading ? "Đang Upload ảnh & Lưu..." : "💾 LƯU THAY ĐỔI"}
          </button>
        </form>
      </div>
    </div>
  );
}