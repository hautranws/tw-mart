"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Search, PackageOpen, ShoppingBag, Truck, CheckCircle, XCircle, RefreshCcw } from "lucide-react";

// Định nghĩa các trạng thái đơn hàng (Tab)
const TABS = [
  { id: "all", label: "Tất cả" },
  { id: "pending", label: "Đang xử lý" }, // Chờ xác nhận
  { id: "shipping", label: "Đang giao" },
  { id: "completed", label: "Đã giao" },
  { id: "cancelled", label: "Đã hủy" },
  { id: "returned", label: "Trả hàng" },
];

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // --- 1. LẤY DỮ LIỆU ĐƠN HÀNG TỪ SUPABASE ---
  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // [ĐÃ SỬA] Lấy thêm dữ liệu từ bảng order_items
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)") 
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data);
      } else if (error) {
        console.error("Lỗi lấy đơn hàng:", error);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  // --- 2. LỌC ĐƠN HÀNG THEO TAB VÀ TÌM KIẾM ---
  const filteredOrders = orders.filter((order) => {
    // Lọc theo Tab (Trạng thái)
    const matchStatus = activeTab === "all" ? true : order.payment_status === activeTab || order.status === activeTab;
    
    // Lọc theo Tìm kiếm (Mã đơn hoặc Tên sản phẩm)
    const matchSearch = 
        searchTerm === "" || 
        order.id.toString().includes(searchTerm) ||
        // Tìm trong danh sách sản phẩm
        (order.order_items && JSON.stringify(order.order_items).toLowerCase().includes(searchTerm.toLowerCase()));

    return matchStatus && matchSearch;
  });

  // --- 3. HÀM HIỂN THỊ TRẠNG THÁI MÀU SẮC ---
  const renderStatusBadge = (status: string) => {
     switch(status) {
        case 'pending': return <span className="text-orange-500 font-bold flex items-center gap-1"><ShoppingBag size={14}/> Đang xử lý</span>;
        case 'paid': return <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={14}/> Đã thanh toán</span>; // Thêm trạng thái thanh toán
        case 'shipping': return <span className="text-blue-500 font-bold flex items-center gap-1"><Truck size={14}/> Đang giao</span>;
        case 'completed': return <span className="text-green-500 font-bold flex items-center gap-1"><CheckCircle size={14}/> Đã giao</span>;
        case 'cancelled': return <span className="text-red-500 font-bold flex items-center gap-1"><XCircle size={14}/> Đã hủy</span>;
        case 'returned': return <span className="text-gray-500 font-bold flex items-center gap-1"><RefreshCcw size={14}/> Trả hàng</span>;
        default: return <span className="text-gray-500">Chờ cập nhật</span>;
     }
  };

  if (loading) return <div className="p-10 text-center bg-white rounded-xl">Đang tải đơn hàng...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm min-h-[500px] flex flex-col">
      
      {/* --- HEADER: TIÊU ĐỀ & TÌM KIẾM --- */}
      <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4">
         <h2 className="text-lg font-bold text-gray-800">Đơn hàng của tôi</h2>
         
         {/* Ô tìm kiếm giống Long Châu */}
         <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Tìm theo tên đơn, mã đơn, hoặc tên sản phẩm..." 
              className="w-full bg-gray-100 border-none rounded-full py-2 px-4 pr-10 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600">
               <Search size={18} />
            </button>
         </div>
      </div>

      {/* --- THANH TAB TRẠNG THÁI --- */}
      <div className="flex overflow-x-auto border-b hide-scrollbar">
         {TABS.map((tab) => (
            <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`whitespace-nowrap px-6 py-4 text-sm font-medium transition-all relative ${
                  activeTab === tab.id 
                  ? "text-blue-700 font-bold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-blue-600" 
                  : "text-gray-500 hover:text-blue-600"
               }`}
            >
               {tab.label}
            </button>
         ))}
      </div>

      {/* --- NỘI DUNG CHÍNH --- */}
      <div className="flex-1 bg-gray-50 p-4">
         
         {/* TRƯỜNG HỢP 1: KHÔNG CÓ ĐƠN HÀNG (EMPTY STATE GIỐNG HÌNH) */}
         {filteredOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-12 animate-fade-in">
               <div className="w-40 h-40 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-gray-400">
                  {/* Icon hộp mở (giả lập hình cái hộp trong ảnh) */}
                  <PackageOpen size={80} strokeWidth={1} />
               </div>
               <h3 className="text-gray-800 font-bold text-lg mb-2">Bạn chưa có đơn hàng nào.</h3>
               <p className="text-gray-500 text-sm mb-6 text-center max-w-md">
                  Cùng khám phá hàng ngàn sản phẩm tại Nhà thuốc Thiên Hậu nhé!
               </p>
               <Link 
                  href="/" 
                  className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
               >
                  Khám phá ngay
               </Link>
            </div>
         ) : (
            /* TRƯỜNG HỢP 2: CÓ ĐƠN HÀNG (LIST DANH SÁCH) */
            <div className="space-y-4">
               {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                     {/* Header Card */}
                     <div className="flex justify-between items-start border-b pb-3 mb-3">
                        <div>
                           <div className="font-bold text-gray-800">Đơn hàng #{order.id}</div>
                           <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('vi-VN')}</div>
                        </div>
                        <div className="text-sm">
                           {renderStatusBadge(order.payment_status === 'paid' ? 'paid' : (order.status || 'pending'))}
                        </div>
                     </div>

                     {/* Product Preview (Lấy sản phẩm đầu tiên làm đại diện) */}
                     <div className="flex gap-4 mb-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border">
                           {/* Nếu có ảnh thì hiện, ko thì hiện icon túi mua sắm */}
                           {order.order_items && order.order_items[0]?.img ? (
                              <img src={order.order_items[0].img} className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag size={24}/></div>
                           )}
                        </div>
                        <div className="flex-1">
                           <h4 className="font-bold text-sm text-gray-800 line-clamp-1">
                              {/* [ĐÃ SỬA] Đọc tên từ order_items */}
                              {order.order_items && order.order_items.length > 0 ? order.order_items[0].product_name : "Sản phẩm chưa đặt tên"}
                           </h4>
                           <p className="text-xs text-gray-500 mt-1">
                              {/* [ĐÃ SỬA] Đọc số lượng từ order_items */}
                              {order.order_items && order.order_items.length > 1 
                                 ? `và ${order.order_items.length - 1} sản phẩm khác` 
                                 : `Số lượng: ${order.order_items && order.order_items.length > 0 ? order.order_items[0].quantity : 1}`}
                           </p>
                        </div>
                        <div className="text-right">
                           {/* [ĐÃ SỬA] Lấy final_price thay vì total */}
                           <div className="text-red-600 font-bold">{Number(order.final_price || 0).toLocaleString("vi-VN")}đ</div>
                        </div>
                     </div>

                     {/* Footer Card */}
                     <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
                        <button className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition">
                           Xem chi tiết
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition">
                           Mua lại
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}