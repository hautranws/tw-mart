// components/header/constants.ts
// Tạm thời giữ nguyên import cũ để web không bị sập. Ở bài sau chúng ta sẽ đổi ruột data.
import { TPCN_DATA, DMP_DATA, CSCN_DATA, TBYT_DATA } from "../data";

export const TOP_SEARCHES = [
  "Dầu Metholanum",
  "Green Oil 10g",
  "Cao dán Kim Môn",
  "Dầu xoa bóp Chinpai",
  "Vaseline 600ml",
  "Mặt nạ Dr. Morita",
  "Trà sữa Đài Loan",
  "Bánh dứa",
];

export const THUOC_SIDEBAR = [
  { id: "HangBanChay", l: "🔥 Hàng bán chạy", i: "🔥" },
  { id: "HangMoiVe", l: "✨ Hàng mới về", i: "✨" },
  { id: "GiamGia", l: "🎁 Khuyến mãi", i: "🎁" },
];

export const THUOC_GRID = [
  // Đã phối tông màu nền Xanh - Đỏ - Trắng theo cờ Đài Loan
  { t: "Dầu gió & Dầu xoa bóp", i: "🧴", bg: "bg-blue-50 border border-blue-100" }, 
  { t: "Cao dán nhức mỏi", i: "🩹", bg: "bg-red-50 border border-red-100" }, 
  { t: "Trà sữa & Đồ uống", i: "🧋", bg: "bg-white border border-gray-200" },
  { t: "Bánh kẹo đặc sản", i: "🍍", bg: "bg-red-50 border border-red-100" },
  { t: "Mỹ phẩm nội địa", i: "💄", bg: "bg-blue-50 border border-blue-100" },
];

export const BENH_SIDEBAR = [
  { t: "Góc review Đài Loan", i: "🇹🇼" },
  { t: "Phân biệt thật - giả", i: "🔍" },
  { t: "Săn sale cùng TWMED", i: "🛍️" },
  { t: "Kinh nghiệm xách tay", i: "✈️" },
];

export const NAV_ITEMS = [
  {
    id: "DAU_CAO",
    label: "Dầu Gió & Cao Dán",
    href: "/category/Dầu Gió & Cao Dán",
    data: TBYT_DATA, // Tạm mượn data thiết bị y tế để hiển thị menu
    defaultTab: "DungCuYTe", 
    type: "dynamic",
  },
  {
    id: "SKINCARE",
    label: "Mỹ Phẩm & Skincare",
    href: "/category/Mỹ Phẩm & Skincare",
    data: DMP_DATA,
    defaultTab: "ChamSocDaMat",
    type: "dynamic",
  },
  {
    id: "DAC_SAN",
    label: "Đặc Sản & Trà Sữa",
    href: "/category/Đặc Sản",
    data: CSCN_DATA, // Tạm mượn data chăm sóc cá nhân
    defaultTab: "HoTroTinhDuc", 
    type: "dynamic",
  },
  {
    id: "TPCN",
    label: "Thực Phẩm Chức Năng",
    href: "/category/Thực Phẩm Chức Năng",
    data: TPCN_DATA,
    defaultTab: "Vitamin",
    type: "dynamic",
  },
  {
    id: "BLOG",
    label: "Cẩm Nang Xách Tay",
    href: "/blog",
    data: null,
    defaultTab: null,
    type: "custom_benh",
  },
];