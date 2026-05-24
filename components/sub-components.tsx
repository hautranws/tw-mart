import React from "react";
import Link from "next/link";

// --- GIỮ NGUYÊN: Component hiển thị Item lớn (Icon + Title + Count) ---
export const GridItem = ({ href, sticker, title, count }: any) => (
  <Link
    href={href}
    className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-lg bg-white group/item transition hover:border-blue-500"
  >
    <div className="h-16 w-16 flex items-center justify-center bg-gray-50 rounded-lg">
      <span className="text-3xl">{sticker}</span>
    </div>
    <div>
      <h4 className="font-bold text-gray-800 text-base group-hover/item:text-blue-700">
        {title}
      </h4>
      {count && <p className="text-sm text-gray-500">{count}</p>}
    </div>
  </Link>
);

// --- GIỮ NGUYÊN: Component hiển thị Item nhỏ (Icon tròn màu + Title) ---
export const SmallItem = ({ href, sticker, title, bg }: any) => (
  <Link
    href={href}
    className="flex items-center gap-3 p-4 border rounded-lg hover:border-blue-500 hover:shadow-md bg-white transition"
  >
    <div
      className={`w-10 h-10 ${
        bg || "bg-blue-100"
      } rounded-full flex items-center justify-center text-xl`}
    >
      {sticker}
    </div>
    <span className="font-medium text-sm group-hover/item:text-blue-700">
      {title}
    </span>
  </Link>
);

// --- ĐÃ SỬA: Component hiển thị Sản phẩm (Ghép giá và đơn vị) ---
export const ProductCard = ({
  img,
  title,
  price,
  oldPrice,
  discount,
  unit,
}: any) => {
  // Vì Dữ liệu truyền vào price có thể là chuỗi "390.000đ", cần parse để xử lý hiển thị giống Shopee
  const rawPriceStr = String(price).replace(/\D/g, "");
  const currentPrice = rawPriceStr ? parseInt(rawPriceStr, 10) : 0;
  const hash = String(title)
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const discountPercent = 5 + (hash % 11);
  const voucherPrice =
    currentPrice > 0
      ? Math.round((currentPrice * (1 - discountPercent / 100)) / 1000) * 1000
      : 0;

  return (
    <div className="border rounded-lg p-3 hover:shadow-xl transition cursor-pointer bg-white flex flex-col justify-between h-full group/prod relative">
      {/* Huy hiệu giảm giá */}
      {discount && (
        <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-1 rounded">
          {discount}
        </span>
      )}

      {/* Phần Hình ảnh và Tên */}
      <div>
        <div className="h-28 bg-gray-50 rounded mb-2 flex items-center justify-center text-xs text-gray-400 group-hover/prod:scale-105 transition overflow-hidden">
          {img && img.startsWith("http") ? (
            <img src={img} className="h-full object-contain" alt={title} />
          ) : (
            <span className="text-3xl">📦</span> // Icon mặc định nếu không có ảnh
          )}
        </div>
        <p className="text-xs font-bold line-clamp-2 mb-1 text-gray-700 group-hover/prod:text-blue-700">
          {title}
        </p>
      </div>

      {/* HIỂN THỊ GIÁ SAU VOUCHER (GIỐNG SHOPEE) */}
      <div className="flex flex-col mt-2">
        {currentPrice > 0 && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-400 text-[11px] line-through decoration-gray-400">
              ₫{currentPrice.toLocaleString("vi-VN")}
            </span>
          </div>
        )}
        <div className="flex flex-wrap items-end gap-1">
          <span className="text-[#ee4d2d] font-bold text-base leading-none tracking-tight">
            <span className="text-xs">₫</span>
            {currentPrice > 0 ? voucherPrice.toLocaleString("vi-VN") : price}
          </span>
          {currentPrice > 0 && (
            <span className="bg-[#ee4d2d] text-white text-[8px] font-bold px-1 py-0.5 rounded-sm shadow-sm whitespace-nowrap border border-[#ee4d2d]">
              DÙNG VOUCHER
            </span>
          )}
          {unit && (
            <span className="text-gray-500 text-[10px] ml-auto truncate max-w-[40px]">
              / {unit.replace("/", "").trim()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
