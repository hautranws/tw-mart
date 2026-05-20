"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// CẤU HÌNH ADMIN (ĐỒNG BỘ VỚI /admin/page.tsx)
const ADMIN_PHONE_CORE = "989217112";
const ADMIN_EMAILS = ["admin@thienhau.com", "tranthienhaudau2@gmail.com"];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      // 1. Lấy thông tin người đang đăng nhập
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Chưa đăng nhập -> Đá về Login
        router.push("/login");
      } else {
        // 2. KIỂM TRA QUYỀN ADMIN (EMAIL HOẶC SĐT)
        const userEmail = session.user.email || "";
        const userPhone = session.user.phone || "";
        const cleanPhone = userPhone.replace(/[^0-9]/g, "");

        const isEmailMatch = ADMIN_EMAILS.includes(userEmail);
        const isPhoneMatch = cleanPhone.includes(ADMIN_PHONE_CORE);

        if (isEmailMatch || isPhoneMatch) {
          setAuthorized(true); // Đúng là Admin -> Cho vào
        } else {
          alert("Bạn không có quyền truy cập trang Quản trị!");
          router.push("/");
        }
      }
    };

    checkUser();
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Đang kiểm tra quyền Admin...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-8 py-3 flex justify-between items-center shadow-sm">
        <span className="font-bold text-blue-900">🛡️ TRANG QUẢN TRỊ VIÊN</span>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Đăng xuất
        </button>
      </div>
      {children}
    </div>
  );
}
