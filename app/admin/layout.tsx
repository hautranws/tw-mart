"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// CẤU HÌNH ADMIN (ĐỒNG BỘ VỚI /admin/page.tsx)
const ADMIN_PHONE_CORE = "989217112";
const ADMIN_EMAILS = ["admin@thienhau.com", "tranthienhaudau2@gmail.com"].map(
  (e) => e.toLowerCase(),
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Sử dụng onAuthStateChange để xử lý trạng thái đăng nhập một cách real-time và ổn định hơn.
    // Nó sẽ tự động chạy khi component mount và mỗi khi trạng thái auth thay đổi.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          // Nếu không có session (chưa đăng nhập hoặc đã đăng xuất), chuyển về trang login.
          setAuthorized(false);
          router.push("/login");
        } else {
          // Nếu có session, kiểm tra quyền admin.
          const userEmail = (session.user.email || "").toLowerCase(); // Chuyển về chữ thường để so sánh
          const userPhone = session.user.phone || "";
          const cleanPhone = userPhone.replace(/[^0-9]/g, "");
          const isEmailMatch = ADMIN_EMAILS.includes(userEmail); // So sánh với mảng email chữ thường
          const isPhoneMatch = cleanPhone.includes(ADMIN_PHONE_CORE);
          if (isEmailMatch || isPhoneMatch) {
            setAuthorized(true); // Là admin, cho phép truy cập.
          } else {
            // Không phải admin, báo lỗi và chuyển về trang chủ.
            setAuthorized(false);
            alert("Bạn không có quyền truy cập trang Quản trị!");
            router.push("/");
          }
        }
      },
    );

    // Dọn dẹp listener khi component unmount.
    return () => authListener.subscription.unsubscribe();
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
