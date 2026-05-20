"use client";
import React from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  User,
  Package,
  MapPin,
  FileText,
  LogOut,
  ChevronDown,
} from "lucide-react";

interface UserDropdownProps {
  user: any; // Thông tin user từ Header truyền vào
}

export default function UserDropdown({ user }: UserDropdownProps) {
  // Lấy tên hiển thị (Ưu tiên tên, nếu không có thì lấy SĐT/Email)
  const displayName =
    user.user_metadata?.full_name ||
    user.phone ||
    user.email?.split("@")[0] ||
    "Khách hàng";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="relative group z-50">
      {/* 1. PHẦN HIỂN THỊ TÊN (Luôn hiện) */}
      <div className="flex items-center gap-1 cursor-pointer py-2 hover:opacity-80 transition">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
          {/* Lấy chữ cái đầu của tên */}
          {displayName.toString().charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Xin chào,</span>
          <span className="text-sm font-bold text-blue-800 flex items-center gap-1">
            {displayName.length > 10
              ? displayName.substring(0, 10) + "..."
              : displayName}
            <ChevronDown size={14} />
          </span>
        </div>
      </div>

      {/* 2. MENU XỔ XUỐNG (Chỉ hiện khi Hover vào group cha) */}
      <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
        {/* Mũi tên nhọn chỉ lên trên (trang trí) */}
        <div className="absolute -top-2 right-6 w-4 h-4 bg-white transform rotate-45 border-l border-t border-gray-100"></div>

        <div className="relative z-10 py-2">
          {/* Mục: Thông tin cá nhân */}
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition"
          >
            <User size={18} />
            <span className="text-sm font-medium">Thông tin cá nhân</span>
          </Link>

          {/* Mục: Đơn hàng của tôi */}
          <Link
            href="/profile/orders"
            className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition"
          >
            <Package size={18} />
            <span className="text-sm font-medium">Đơn hàng của tôi</span>
          </Link>

          {/* Mục: Sổ địa chỉ */}
          <Link
            href="/profile/address"
            className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition"
          >
            <MapPin size={18} />
            <span className="text-sm font-medium">Sổ địa chỉ nhận hàng</span>
          </Link>

          {/* Mục: Danh sách order */}
          <Link
            href="/profile/prescriptions"
            className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition"
          >
            <FileText size={18} />
            <span className="text-sm font-medium">Danh sách order</span>
          </Link>

          <div className="border-t my-1"></div>

          {/* Mục: Đăng xuất */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-gray-700 hover:text-red-600 transition text-left"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
}
