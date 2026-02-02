"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Paperclip, X } from "lucide-react"; 

export default function LiveChat() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false); 

  // --- MỚI: STATE CHO BONG BÓNG CHAT ---
  const [currentBubbleMsg, setCurrentBubbleMsg] = useState(0);
  const [isBubbleVisible, setIsBubbleVisible] = useState(true);
  
  const bubbleMessages = [
    "💊 Tư vấn thuốc cắt liều: Ho, sổ mũi, đau cơ...",
    "🏥 Cần tư vấn sức khỏe miễn phí?",
    "🔎 Tìm thuốc đặc biệt không thấy trên web?",
    "⚡ Giao hàng hỏa tốc trong 2h",
  ];

  // --- 1. KIỂM TRA ĐĂNG NHẬP (GIỮ NGUYÊN) ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setCurrentUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- MỚI: HIỆU ỨNG CHẠY CHỮ BONG BÓNG ---
  useEffect(() => {
    // Chỉ chạy khi chat đang đóng
    if (!isOpen) {
        const interval = setInterval(() => {
          setIsBubbleVisible(false); // Ẩn câu cũ
          setTimeout(() => {
            setCurrentBubbleMsg((prev) => (prev + 1) % bubbleMessages.length);
            setIsBubbleVisible(true); // Hiện câu mới
          }, 500); 
        }, 4000); // Đổi câu mỗi 4 giây
    
        return () => clearInterval(interval);
    }
  }, [isOpen]);

  // --- 2. HÀM MỞ CHAT (GIỮ NGUYÊN) ---
  const handleOpenChat = () => {
    if (!currentUser) {
      router.push("/login");
    } else {
      setIsOpen(true);
    }
  };

  // --- 3. TẢI TIN NHẮN & REALTIME (GIỮ NGUYÊN) ---
  useEffect(() => {
    if (isOpen && currentUser) {
      const identifier = currentUser.phone || currentUser.email;

      const fetchHistory = async () => {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("phone", identifier)
          .order("created_at", { ascending: true });

        if (error) console.error("Lỗi tải chat:", error);
        if (data) {
            setChatHistory(data);
            scrollToBottom();
        }
      };

      fetchHistory();

      const channel = supabase
        .channel(`chat-room-${identifier}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `phone=eq.${identifier}`,
          },
          (payload) => {
            setChatHistory((prev) => {
                const exists = prev.find(m => m.id === payload.new.id);
                if (exists) return prev;
                return [...prev, payload.new];
            });
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, currentUser]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // --- 4. XỬ LÝ UPLOAD ẢNH (GIỮ NGUYÊN) ---
  const handleUploadImage = async (file: File) => {
    if (!currentUser) return;
    setUploading(true);

    try {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-uploads")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("chat-uploads")
        .getPublicUrl(fileName);

      await sendMessage("", urlData.publicUrl);
    } catch (error) {
      console.error("Upload lỗi:", error);
      alert("Lỗi tải ảnh lên!");
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) handleUploadImage(file);
      }
    }
  };

  // --- 5. HÀM GỬI TIN NHẮN CHUNG (GIỮ NGUYÊN) ---
  const sendMessage = async (textContent: string = "", imageUrl: string | null = null) => {
    if ((!textContent.trim() && !imageUrl) || !currentUser) return;

    const identifier = currentUser.phone || currentUser.email;
    const displayName = currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "Khách hàng";

    const tempMessage = {
        id: Date.now(),
        content: textContent,
        img: imageUrl,
        is_admin: false,
        created_at: new Date().toISOString(),
        phone: identifier
    };
    setChatHistory((prev) => [...prev, tempMessage]);
    scrollToBottom();

    try {
      const { error } = await supabase.from("messages").insert([
        {
          content: textContent,
          img: imageUrl,
          is_admin: false,
          phone: identifier,
          user_name: displayName,
        },
      ]);
      if (error) console.error("Lỗi gửi tin:", error);
    } catch (err) {
      console.error("Lỗi:", err);
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(message);
    setMessage("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 font-sans">
      
      {/* --- PHẦN CỬA SỔ CHAT (GIỮ NGUYÊN) --- */}
      {isOpen && currentUser && (
        <div
          className="w-[350px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-fade-in-up"
          style={{ height: "450px" }}
        >
          {/* Header */}
          <div className="bg-blue-600 p-4 flex items-center justify-between text-white shadow">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white p-0.5 overflow-hidden">
                  <img src="https://cdn-icons-png.flaticon.com/512/3304/3304567.png" className="w-full h-full object-cover" alt="Dược sĩ" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-blue-600 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-sm">Dược sĩ Thiên Hậu</h3>
                <p className="text-xs text-blue-100">● Đang trực tuyến</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-blue-700 w-8 h-8 rounded-full transition">✕</button>
          </div>

          {/* Nội dung Chat */}
          <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-3">
            <div className="flex justify-start">
              <img src="https://cdn-icons-png.flaticon.com/512/3304/3304567.png" className="w-8 h-8 rounded-full mr-2 self-end mb-1" />
              <div className="bg-white text-gray-800 p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-200 text-sm max-w-[85%]">
                Chào bạn! Dược sĩ có thể giúp gì cho sức khỏe của bạn hôm nay?
              </div>
            </div>

            {chatHistory.map((msg) => (
              <div key={msg.id} className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}>
                {msg.is_admin && (
                  <img src="https://cdn-icons-png.flaticon.com/512/3304/3304567.png" className="w-8 h-8 rounded-full mr-2 self-end mb-1" />
                )}
                <div className={`max-w-[85%] flex flex-col gap-1 ${msg.is_admin ? "items-start" : "items-end"}`}>
                  
                  {/* Ảnh */}
                  {msg.img && (
                    <img 
                      src={msg.img} 
                      alt="Gửi ảnh" 
                      className="max-w-[200px] rounded-lg border border-gray-200 cursor-pointer hover:opacity-90"
                      onClick={() => window.open(msg.img, "_blank")}
                    />
                  )}

                  {/* Sản phẩm */}
                  {msg.product_data && (
                    <div className="bg-white border border-blue-200 rounded-lg p-2 flex gap-2 items-center w-full shadow-sm cursor-pointer hover:bg-blue-50 transition" onClick={() => router.push(`/product/${msg.product_data.id}`)}>
                        <img src={msg.product_data.img && msg.product_data.img.startsWith('[') ? JSON.parse(msg.product_data.img)[0] : msg.product_data.img} className="w-12 h-12 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate text-gray-800">{msg.product_data.title}</p>
                            <p className="text-sm font-bold text-red-600">{Number(msg.product_data.price).toLocaleString()}đ</p>
                        </div>
                    </div>
                  )}

                  {/* Text */}
                  {msg.content && (
                    <div className={`p-3 text-sm rounded-2xl shadow-sm ${msg.is_admin ? "bg-white text-gray-800 rounded-bl-none border border-gray-200" : "bg-blue-600 text-white rounded-br-none"}`}>
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {uploading && <div className="text-right text-xs text-gray-400 italic">Đang gửi ảnh...</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập liệu */}
          <form onSubmit={handleSendText} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
            <label className="cursor-pointer text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition">
                <Paperclip size={20} />
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => e.target.files && handleUploadImage(e.target.files[0])}
                />
            </label>

            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-1 focus:ring-blue-500 text-black transition"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onPaste={handlePaste}
            />
            <button type="submit" className="bg-blue-600 text-white w-10 h-10 rounded-full hover:bg-blue-700 flex items-center justify-center shadow-sm">➤</button>
          </form>
        </div>
      )}

      {/* --- PHẦN NÚT CHAT THU NHỎ (CÓ BONG BÓNG MỚI) --- */}
      {!isOpen && (
        <div className="relative flex flex-col items-end gap-2">
            
            {/* 🔥 BONG BÓNG CHAT CHẠY CHỮ (MỚI THÊM) */}
            <div 
                className={`bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg border border-blue-100 max-w-[250px] text-sm font-medium transition-all duration-500 transform origin-bottom-right relative mb-1 mr-1
                ${isBubbleVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-2"}
                `}
            >
                {bubbleMessages[currentBubbleMsg]}
                {/* Mũi tên trỏ xuống */}
                <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white transform rotate-45 border-r border-b border-blue-100"></div>
                {/* Nút tắt bong bóng */}
                <button 
                    onClick={(e) => { e.currentTarget.parentElement?.remove() }}
                    className="absolute -top-2 -left-2 bg-gray-200 text-gray-500 rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500 hover:text-white shadow-sm"
                >
                    ✕
                </button>
            </div>

            {/* Nút tròn xanh (Giữ nguyên) */}
            <button onClick={handleOpenChat} className="group flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full shadow-lg hover:scale-105 transition-all duration-300 hover:bg-blue-700 relative z-50 ring-4 ring-white animate-bounce-slow">
                {/* Tooltip cũ khi hover (Giữ nguyên) */}
                <div className="absolute right-full mr-4 bg-white text-gray-800 px-4 py-2 rounded-xl shadow-lg border border-gray-100 whitespace-nowrap hidden group-hover:block transition-all animate-fade-in">
                    <p className="text-sm font-bold text-blue-600">Chat với Dược sĩ</p>
                    <p className="text-xs text-gray-500">{currentUser ? "Bạn đang đăng nhập" : "Vui lòng đăng nhập để chat"}</p>
                    <div className="absolute top-1/2 -right-2 w-4 h-4 bg-white transform -translate-y-1/2 rotate-45 border-r border-t border-gray-100"></div>
                </div>
                
                <img src="https://cdn-icons-png.flaticon.com/512/3304/3304567.png" className="w-10 h-10 object-cover" alt="icon" />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
            </button>
        </div>
      )}
    </div>
  );
}