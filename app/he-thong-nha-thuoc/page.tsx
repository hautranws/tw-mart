"use client";
import React, { useState, useEffect } from "react";
import {
  MapPin,
  Search,
  Phone,
  ShieldCheck,
  Truck,
  RotateCcw,
  Stethoscope,
  X,
  Navigation,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// GIỮ NGUYÊN PHẦN SERVICES (Tĩnh)
const SERVICES = [
  {
    icon: <ShieldCheck className="w-8 h-8 text-blue-600" />,
    title: "Hàng xách tay chuẩn 100%",
    desc: "Sở hữu danh mục hàng nội địa Đài Loan vừa đa dạng, phong phú, bay air liên tục.",
  },
  {
    icon: <Stethoscope className="w-8 h-8 text-blue-600" />,
    title: "Chuyên viên tư vấn am hiểu",
    desc: "Tư vấn nhiệt tình, hỗ trợ tìm kiếm và order hàng theo yêu cầu nhanh chóng.",
  },
  {
    icon: <Truck className="w-8 h-8 text-blue-600" />,
    title: "Giao hàng tận nơi",
    desc: "Giao hàng cực nhanh trong khu vực Tp.HCM và chuyển hàng đến tận nhà tại các tỉnh thành khác.",
  },
  {
    icon: <RotateCcw className="w-8 h-8 text-blue-600" />,
    title: "Đổi trả nguyên giá",
    desc: "Chỉ cần đọc SĐT hoặc giữ lại hóa đơn, bạn sẽ được đổi trả / hoàn tiền đã mua trong vòng 30 ngày.",
  },
];

export default function StoreSystemPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("Tất cả");
  const [activeTab, setActiveTab] = useState("search");
  const [showLocationPopup, setShowLocationPopup] = useState(false);

  // --- [THAY ĐỔI] Dùng State thay vì Const tĩnh ---
  const [allStores, setAllStores] = useState<any[]>([]); // Dữ liệu gốc từ DB
  const [displayStores, setDisplayStores] = useState<any[]>([]); // Dữ liệu đang hiển thị
  const [selectedStore, setSelectedStore] = useState<any>(null);

  // 1. FETCH DATA TỪ SUPABASE
  useEffect(() => {
    const fetchStores = async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("is_active", true);

      if (data) {
        setAllStores(data);
        setDisplayStores(data);
      }
    };
    fetchStores();
  }, []);

  // 2. LOGIC LỌC TÌM KIẾM (Đã cập nhật dùng allStores)
  useEffect(() => {
    if (activeTab === "search") {
      const filtered = allStores.filter((store) => {
        const matchName =
          store.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          store.name.toLowerCase().includes(searchTerm.toLowerCase());

        // Logic lọc tỉnh: Nếu chọn HCM thì lọc theo city_code 79 hoặc tên tỉnh
        const matchProvince =
          selectedProvince === "Tất cả" ||
          (selectedProvince === "TP.HCM" &&
            (store.city_code === "79" ||
              store.address.includes("Hồ Chí Minh") ||
              store.address.includes("HCM")));

        return matchName && matchProvince;
      });
      setDisplayStores(filtered);
    }
  }, [searchTerm, selectedProvince, activeTab, allStores]);

  // 3. LOGIC TÍNH KHOẢNG CÁCH
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleNearMeClick = () => {
    setActiveTab("near_me");
    if (!navigator.geolocation) {
      setShowLocationPopup(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const storesWithDistance = allStores.map((store) => {
          // Nếu DB chưa có lat/lng thì cho khoảng cách cực lớn
          if (!store.lat || !store.lng) return { ...store, distance: 99999 };

          const dist = calculateDistance(
            latitude,
            longitude,
            store.lat,
            store.lng,
          );
          return { ...store, distance: dist };
        });
        const sortedStores = storesWithDistance.sort(
          (a, b) => a.distance - b.distance,
        );
        setDisplayStores(sortedStores);

        if (sortedStores.length > 0) setSelectedStore(sortedStores[0]);
      },
      (error) => {
        console.error("Lỗi định vị:", error);
        setShowLocationPopup(true);
        setActiveTab("search");
      },
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-10 relative">
      <div className="bg-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Hệ thống cửa hàng và kho hàng
          </h1>
          <p className="opacity-90">
            Thời gian hoạt động: 6:00 - 22:00 hàng ngày (Thay đổi tùy theo từng
            cửa hàng)
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6 flex flex-col md:flex-row gap-6">
        {/* === CỘT TRÁI: DANH SÁCH === */}
        <div className="w-full md:w-1/3 bg-white p-4 rounded-xl shadow-sm h-fit">
          <div className="flex border-b mb-4">
            <button
              onClick={() => setActiveTab("search")}
              className={`flex-1 py-2 font-bold transition-colors ${activeTab === "search" ? "text-blue-700 border-b-2 border-blue-700" : "text-gray-500 hover:text-blue-600"}`}
            >
              Tìm kiếm cửa hàng
            </button>
            <button
              onClick={handleNearMeClick}
              className={`flex-1 py-2 font-bold transition-colors ${activeTab === "near_me" ? "text-blue-700 border-b-2 border-blue-700" : "text-gray-500 hover:text-blue-600"}`}
            >
              Cửa hàng gần bạn
            </button>
          </div>

          {activeTab === "search" ? (
            <>
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Tìm theo tên đường..."
                  className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:border-blue-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
              <div className="text-center text-xs text-gray-400 mb-3">
                ----- hoặc chọn nhanh -----
              </div>
              <select
                className="w-full p-2 border rounded-lg mb-4 text-sm outline-none"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="Tất cả">Tất cả khu vực</option>
                <option value="TP.HCM">TP. Hồ Chí Minh (Thủ Đức)</option>
              </select>
            </>
          ) : (
            <div className="mb-4 bg-blue-50 text-blue-800 text-sm p-3 rounded-lg border border-blue-100 flex items-start gap-2">
              <Navigation className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Kết quả gần bạn nhất:</span>
                <br />
                <span className="text-xs text-blue-600">
                  (Đã sắp xếp theo khoảng cách)
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {activeTab === "search" && (
              <h3 className="font-bold text-sm text-gray-700">
                Cửa hàng gợi ý ({displayStores.length})
              </h3>
            )}

            {displayStores.map((store: any) => (
              <div
                key={store.id}
                onClick={() => setSelectedStore(store)}
                className={`flex gap-3 items-start p-3 border rounded-lg cursor-pointer transition group relative
                    ${selectedStore?.id === store.id ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "hover:border-blue-400 hover:bg-gray-50"}
                `}
              >
                <div
                  className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 
                    ${selectedStore?.id === store.id ? "border-blue-600" : "border-gray-400"}
                  `}
                >
                  {selectedStore?.id === store.id && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4
                      className={`font-bold text-sm pr-2 ${selectedStore?.id === store.id ? "text-blue-700" : "text-gray-800"}`}
                    >
                      {store.name}
                    </h4>
                    {store.distance && store.distance < 9999 && (
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">
                        {store.distance < 1
                          ? `${(store.distance * 1000).toFixed(0)}m`
                          : `${store.distance.toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {store.address}
                  </p>
                </div>
              </div>
            ))}

            {displayStores.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-4">
                Không tìm thấy cửa hàng nào.
              </div>
            )}
          </div>
        </div>

        {/* === CỘT PHẢI: HIỂN THỊ CHI TIẾT HOẶC GIỚI THIỆU === */}
        <div className="w-full md:w-2/3">
          {selectedStore ? (
            // 👉 GIAO DIỆN CHI TIẾT CỬA HÀNG
            <div className="bg-white p-6 rounded-xl shadow-sm h-full animate-fade-in">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-4 border-b border-gray-100">
                {selectedStore.name}
              </h2>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Bản đồ (Tự động dùng Map Link hoặc Tạo từ Địa chỉ) */}
                <div className="w-full md:w-1/2 h-64 md:h-auto rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-gray-100 relative">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={
                      selectedStore.map_url ||
                      `https://maps.google.com/maps?q=${encodeURIComponent(selectedStore.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                    }
                  ></iframe>
                  <a
                    href={
                      selectedStore.map_url ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedStore.address)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-2 left-2 bg-white px-3 py-1 text-xs font-bold text-blue-600 rounded shadow hover:bg-blue-50"
                  >
                    Xem bản đồ lớn hơn
                  </a>
                </div>

                {/* Thông tin chi tiết */}
                <div className="w-full md:w-1/2 flex flex-col gap-4">
                  {/* Nếu có ảnh thì hiện ảnh nhỏ ở đây */}
                  {selectedStore.image_url && (
                    <div className="h-32 w-full rounded-lg overflow-hidden border">
                      <img
                        src={selectedStore.image_url}
                        className="w-full h-full object-cover"
                        alt="Store Image"
                      />
                    </div>
                  )}

                  <div>
                    <p className="font-bold text-gray-700 mb-1">Địa chỉ:</p>
                    <p className="text-sm text-gray-600">
                      {selectedStore.address}
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-blue-600 mb-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      {selectedStore.status || "Đang mở cửa"}{" "}
                      <span className="text-gray-400 font-normal">
                        • Mở cửa lúc 06:00
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />{" "}
                      {selectedStore.hours || "06:00 - 22:00"}
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-gray-700 mb-1">Điện thoại:</p>
                    <p className="text-lg font-bold text-blue-700">
                      {selectedStore.phone}
                    </p>
                  </div>

                  <div className="mt-auto flex gap-3 pt-4">
                    <a
                      href={
                        selectedStore.map_url ||
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedStore.address)}`
                      }
                      target="_blank"
                      className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-full text-center transition flex items-center justify-center gap-2"
                    >
                      <MapPin size={18} /> Chỉ đường
                    </a>
                    <a
                      href={`tel:${selectedStore.phone}`}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold py-2 rounded-full text-center transition flex items-center justify-center gap-2"
                    >
                      <Phone size={18} /> Gọi tư vấn
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="font-bold text-gray-800 mb-3">
                  Dịch vụ tại cửa hàng này:
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {SERVICES.map((s, i) => (
                    <div
                      key={i}
                      className="flex gap-2 items-center text-sm text-gray-600"
                    >
                      <div className="scale-75 origin-left">{s.icon}</div>
                      <span>{s.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // 👉 GIAO DIỆN MẶC ĐỊNH (KHI CHƯA CHỌN)
            <div className="bg-white p-6 rounded-xl shadow-sm h-full">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                TW MART chuyên hàng nội địa xách tay Đài Loan uy tín tại TP.HCM.
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {SERVICES.map((service, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="shrink-0">{service.icon}</div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-1">
                        {service.title}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {service.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="font-bold text-gray-800 mb-4">
                Hình ảnh hệ thống cửa hàng / kho hàng TW MART:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <img
                  src="https://via.placeholder.com/400x300.png?text=Kho+TW+MART+1"
                  className="rounded-lg h-32 w-full object-cover"
                  alt="Store 1"
                />
                <img
                  src="https://via.placeholder.com/400x300.png?text=Kho+TW+MART+2"
                  className="rounded-lg h-32 w-full object-cover"
                  alt="Store 2"
                />
                <img
                  src="https://via.placeholder.com/400x300.png?text=Kho+TW+MART+3"
                  className="rounded-lg h-32 w-full object-cover"
                  alt="Store 3"
                />
                <img
                  src="https://via.placeholder.com/400x300.png?text=Kho+TW+MART+4"
                  className="rounded-lg h-32 w-full object-cover"
                  alt="Store 4"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showLocationPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center relative shadow-2xl">
            <button
              onClick={() => setShowLocationPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <div className="flex justify-center mb-4 relative">
              <div className="bg-blue-100 p-4 rounded-full">
                <MapPin className="w-12 h-12 text-blue-600" />
              </div>
              <div className="absolute top-0 right-[35%] bg-white rounded-full p-0.5">
                <div className="bg-red-500 rounded-full p-1">
                  <X size={12} className="text-white" />
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Vị trí của bạn không khả dụng
            </h3>
            <p className="text-sm text-gray-600 mb-6 px-2">
              Vui lòng vào <b>cài đặt</b> {">"} Chọn <b>quyền riêng tư</b> {">"}{" "}
              Cho phép <b>bật định vị</b> để sử dụng tính năng này.
            </p>

            <button
              onClick={() => setShowLocationPopup(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-full transition"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
