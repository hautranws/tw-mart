"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// --- KHUNG GIỜ GIAO HÀNG (Cho TP.HCM) ---
const TIME_SLOTS = [
    "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
    "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00",
    "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00", "20:00 - 21:00"
];

export default function CheckoutPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // --- STATE QUẢN LÝ ---
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [deliveryMethod, setDeliveryMethod] = useState<"home" | "store">("home");
  const [selectedStoreId, setSelectedStoreId] = useState<number>(0);

  // --- [MỚI] STATE DANH SÁCH NHÀ THUỐC TỪ DB ---
  const [pharmacyLocations, setPharmacyLocations] = useState<any[]>([]);

  // --- STATE ĐỊA CHỈ HÀNH CHÍNH ---
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  
  const [addressData, setAddressData] = useState({
      city: "", district: "", ward: "", specific: ""
  });

  // --- STATE USER & SAVED ADDRESS ---
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [formValues, setFormValues] = useState({ fullName: "", phone: "", note: "" });

  // --- STATE THỜI GIAN NHẬN HÀNG ---
  const [deliveryDates, setDeliveryDates] = useState<string[]>([]); // 4 ngày tới
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [shippingEstimate, setShippingEstimate] = useState<string>(""); 

  // --- STATE COUPON ---
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponMessage, setCouponMessage] = useState({ type: "", text: "" });
  const [discountAmount, setDiscountAmount] = useState(0);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  // Tính tổng tiền GỐC
  const subTotal = cart
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  // --- LOGIC PHÍ SHIP ---
  const shippingFee = deliveryMethod === 'store' ? 0 : (subTotal >= 300000 ? 0 : 30000);

  // --- INIT DATA ---
  useEffect(() => {
      // 1. Tạo ngày giao hàng
      const dates = [];
      const today = new Date();
      for(let i = 0; i < 4; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dayName = i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : `Thứ ${d.getDay() + 1 === 1 ? 'CN' : d.getDay() + 1}`;
          const dateStr = `${dayName}, ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
          dates.push(dateStr);
      }
      setDeliveryDates(dates);
      setSelectedDate(dates[0]);

      // 2. Fetch Tỉnh/Thành
      const fetchCities = async () => {
          try {
              const res = await fetch("https://provinces.open-api.vn/api/?depth=1");
              const data = await res.json();
              setCities(data);
          } catch (e) { console.error(e); }
      };
      fetchCities();

      // 3. [MỚI] Fetch Danh sách nhà thuốc từ DB
      const fetchStores = async () => {
          const { data } = await supabase.from('stores').select('*').eq('is_active', true);
          if (data) setPharmacyLocations(data);
      };
      fetchStores();

  }, []);

  // ... (Giữ nguyên logic fetch Quận/Huyện/Xã) ...
  useEffect(() => {
      if (addressData.city) {
          const fetchDistricts = async () => {
              const cityCode = addressData.city.split("|")[0];
              const res = await fetch(`https://provinces.open-api.vn/api/p/${cityCode}?depth=2`);
              const data = await res.json();
              setDistricts(data.districts); setWards([]);
          };
          fetchDistricts();
      }
  }, [addressData.city]);

  useEffect(() => {
      if (addressData.district) {
          const fetchWards = async () => {
              const distCode = addressData.district.split("|")[0];
              const res = await fetch(`https://provinces.open-api.vn/api/d/${distCode}?depth=2`);
              const data = await res.json();
              setWards(data.wards);
          };
          fetchWards();
      }
  }, [addressData.district]);

  // Lấy User và Coupon
  useEffect(() => {
    if (cart.length > 0 && selectedItems.length === 0) setSelectedItems(cart.map((item) => item.id));
    
    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
            const { data: addresses } = await supabase.from("user_addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
            if (addresses) setSavedAddresses(addresses);
            
            const { data: lastOrder } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single();
            if (lastOrder) {
                setFormValues({ fullName: lastOrder.customer_name, phone: lastOrder.customer_phone, note: "" });
            } else {
                setFormValues(prev => ({ ...prev, phone: user.phone || "" }));
            }
        }
    };
    const fetchCoupons = async () => {
        const now = new Date().toISOString();
        const { data } = await supabase.from('coupons').select('*').eq('is_active', true).or(`expiry_date.is.null,expiry_date.gt.${now}`).order('min_order_value', { ascending: true }).limit(5);
        if (data) setAvailableCoupons(data.filter(c => c.usage_limit === 0 || c.used_count < c.usage_limit));
    };
    fetchData(); fetchCoupons();
  }, [cart]);

  // --- LOGIC ĐỊA ĐIỂM ---
  const currentCityName = useMemo(() => {
      if (deliveryMethod === 'store') return ""; 
      if (selectedAddressId !== 'new') {
          const addr = savedAddresses.find(a => a.id.toString() === selectedAddressId);
          return addr ? addr.full_address : ""; 
      }
      return addressData.city.split("|")[1] || "";
  }, [selectedAddressId, addressData.city, savedAddresses, deliveryMethod]);

  const isHCMC = useMemo(() => {
      const lowerCity = currentCityName.toLowerCase();
      return lowerCity.includes("hồ chí minh") || lowerCity.includes("hcm") || lowerCity.includes("sài gòn");
  }, [currentCityName]);

  useEffect(() => {
      if (!isHCMC && currentCityName) {
          const lowerCity = currentCityName.toLowerCase();
          const today = new Date();
          let minDays = 3, maxDays = 5;
          if (lowerCity.includes("long an") || lowerCity.includes("tiền giang") || lowerCity.includes("cần thơ") || lowerCity.includes("bình dương") || lowerCity.includes("đồng nai")) {
              minDays = 2; maxDays = 3;
          } else if (lowerCity.includes("đà nẵng") || lowerCity.includes("huế")) {
              minDays = 3; maxDays = 4;
          } else if (lowerCity.includes("hà nội") || lowerCity.includes("hải phòng")) {
              minDays = 3; maxDays = 5;
          }
          const dateMin = new Date(today); dateMin.setDate(today.getDate() + minDays);
          const dateMax = new Date(today); dateMax.setDate(today.getDate() + maxDays);
          setShippingEstimate(`Dự kiến giao hàng: ${dateMin.getDate()}/${dateMin.getMonth()+1} - ${dateMax.getDate()}/${dateMax.getMonth()+1}`);
      }
  }, [isHCMC, currentCityName]);

  const availableTimeSlots = useMemo(() => {
      if (!selectedDate.includes("Hôm nay")) return TIME_SLOTS;
      const currentHour = new Date().getHours();
      return TIME_SLOTS.filter(slot => {
          const startHour = parseInt(slot.split(":")[0]);
          return startHour > currentHour;
      });
  }, [selectedDate]);

  const handleAddressBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value; setSelectedAddressId(id);
      if (id !== 'new') {
          const addr = savedAddresses.find(a => a.id.toString() === id);
          if (addr) setFormValues(prev => ({ ...prev, fullName: addr.name, phone: addr.phone }));
      } else { setAddressData({ city: "", district: "", ward: "", specific: "" }); }
  };

  const getFullAddress = () => {
      if (selectedAddressId !== 'new') { const addr = savedAddresses.find(a => a.id.toString() === selectedAddressId); return addr ? addr.full_address : ""; }
      const city = addressData.city.split("|")[1] || ""; const dist = addressData.district.split("|")[1] || ""; const ward = addressData.ward.split("|")[1] || "";
      return `${addressData.specific}, ${ward}, ${dist}, ${city}`.replace(/^, /, "").replace(/, ,/g, ",");
  };

  // --- [SỬA] LỌC NHÀ THUỐC TỪ DB ---
  const filteredStores = pharmacyLocations.filter(store => {
      if (!addressData.city) return true;
      const currentCityCode = addressData.city.split("|")[0]; 
      // So sánh mã tỉnh (Trong DB lưu 'city_code', API trả về 'code')
      return store.city_code === currentCityCode;
  });

  const finalAmount = subTotal - discountAmount + shippingFee;

  // Check Coupon
  const checkCoupon = async (codeOverride?: string) => {
    setCouponMessage({ type: "", text: "" }); setDiscountAmount(0); setAppliedCoupon(null); setCheckingCoupon(true);
    const codeToTest = (codeOverride || couponCode).toUpperCase().trim();
    if (codeOverride) setCouponCode(codeOverride);
    if (!codeToTest) { setCheckingCoupon(false); return; }
    try {
        const { data: coupon, error } = await supabase.from("coupons").select("*").eq("code", codeToTest).eq("is_active", true).single();
        if (error || !coupon) { setCouponMessage({ type: "error", text: "❌ Mã không tồn tại!" }); return; }
        if (subTotal < coupon.min_order_value) { setCouponMessage({ type: "error", text: `❌ Đơn từ ${Number(coupon.min_order_value).toLocaleString()}đ mới được dùng!` }); return; }
        let discount = 0;
        if (coupon.discount_type === "percent") {
            discount = (subTotal * coupon.discount_value) / 100;
            if (coupon.max_discount_amount > 0 && discount > coupon.max_discount_amount) discount = coupon.max_discount_amount;
        } else { discount = coupon.discount_value; }
        if (discount > subTotal) discount = subTotal;
        setDiscountAmount(discount); setAppliedCoupon(coupon); setCouponMessage({ type: "success", text: `✅ Áp dụng thành công: -${discount.toLocaleString()}đ` });
    } catch (err) { console.error(err); } finally { setCheckingCoupon(false); }
  };

  useEffect(() => { if (appliedCoupon && subTotal < appliedCoupon.min_order_value) { setAppliedCoupon(null); setDiscountAmount(0); setCouponMessage({ type: "error", text: "⚠️ Mã đã bị hủy do không đủ điều kiện!" }); } }, [subTotal]);

  // Handle Order
  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    if (selectedItems.length === 0) { alert("Giỏ hàng trống!"); setLoading(false); return; }
    
    // [SỬA] Lấy địa chỉ từ danh sách DB
    const selectedStore = pharmacyLocations.find(s => s.id === selectedStoreId);
    const finalAddress = deliveryMethod === 'store' 
        ? `[NHẬN TẠI KHO] ${selectedStore?.name} - ${selectedStore?.address}`
        : getFullAddress();
    
    if (deliveryMethod === 'home' && (selectedAddressId === 'new' && (!addressData.city || !addressData.specific))) { alert("Vui lòng điền địa chỉ!"); setLoading(false); return; }
    if (deliveryMethod === 'home' && isHCMC && !selectedTimeSlot) { alert("Vui lòng chọn giờ nhận hàng!"); setLoading(false); return; } 

    if (user && deliveryMethod === 'home' && selectedAddressId === 'new') { try { await supabase.from("user_addresses").insert([{ user_id: user.id, name: formValues.fullName, phone: formValues.phone, full_address: finalAddress, is_default: savedAddresses.length === 0 }]); } catch (err) {} }

    let deliveryNote = "";
    if (deliveryMethod === 'home') {
        if (isHCMC) {
            deliveryNote = `Giao hàng: ${selectedTimeSlot}, ${selectedDate}`;
        } else {
            deliveryNote = shippingEstimate;
        }
    }

    const orderInfo = {
      name: formValues.fullName, phone: formValues.phone, address: finalAddress, 
      note: `${deliveryNote}. ${formValues.note}`, 
      deliveryMethod: deliveryMethod
    };

    const itemsToOrder = cart.filter((item) => selectedItems.includes(item.id));
    try {
      const response = await fetch("/api/payment/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToOrder, totalAmount: finalAmount, subTotal: subTotal, couponCode: appliedCoupon ? appliedCoupon.code : null, customer: orderInfo, paymentMethod: paymentMethod, }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
      else { itemsToOrder.forEach((item) => removeFromCart(item.id)); alert("✅ Đặt hàng thành công!"); router.push("/"); }
    } catch (error: any) { alert("❌ " + error.message); } finally { setLoading(false); }
  };

  if (cart.length === 0) return <div className="min-h-screen flex items-center justify-center">Giỏ hàng trống</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans pt-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-800 mb-8 border-l-4 border-blue-600 pl-4">Thanh toán</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
             <div className="bg-white p-6 rounded-lg shadow">
               <h2 className="text-xl font-bold text-gray-700 mb-4">1. Giỏ hàng ({cart.length})</h2>
               {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b pb-4 items-start mb-4">
                    <div className="w-20 h-20 border rounded overflow-hidden flex-shrink-0 bg-white">
                      <img src={item.img} alt={item.title} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-sm md:text-base">{item.title}</h3>
                      <p className="text-blue-600 font-bold mb-2">{item.price.toLocaleString("vi-VN")}đ</p>
                      <div className="flex items-center gap-4">
                          <div className="flex items-center border rounded-lg overflow-hidden">
                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600">-</button>
                            <span className="w-10 h-8 flex items-center justify-center text-sm font-bold bg-white">{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600">+</button>
                          </div>
                          <button type="button" onClick={() => removeFromCart(item.id)} className="text-xs text-red-500 hover:text-red-700 font-medium underline">Xóa</button>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-lg shadow sticky top-4">
              <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">2. Nhận hàng & Thanh toán</h2>

              <form onSubmit={handleOrder} className="space-y-4">
                <div className="flex gap-4 mb-4">
                    <label className={`flex-1 p-3 border rounded-lg cursor-pointer flex items-center justify-center gap-2 ${deliveryMethod === 'home' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50'}`}>
                        <input type="radio" name="delivery" checked={deliveryMethod === 'home'} onChange={() => setDeliveryMethod('home')} className="hidden"/>
                        <span>🚚 Giao tận nơi</span>
                    </label>
                    <label className={`flex-1 p-3 border rounded-lg cursor-pointer flex items-center justify-center gap-2 ${deliveryMethod === 'store' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50'}`}>
                        <input type="radio" name="delivery" checked={deliveryMethod === 'store'} onChange={() => setDeliveryMethod('store')} className="hidden"/>
                        <span>🏪 Nhận tại nhà thuốc</span>
                    </label>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <input required name="fullName" type="text" placeholder="Họ và tên" className="w-full border p-3 rounded-lg bg-gray-50" value={formValues.fullName} onChange={(e) => setFormValues({...formValues, fullName: e.target.value})} />
                  <input required name="phone" type="tel" placeholder="Số điện thoại" className="w-full border p-3 rounded-lg bg-gray-50" value={formValues.phone} onChange={(e) => setFormValues({...formValues, phone: e.target.value})} />
                </div>

                {deliveryMethod === 'home' && (
                    <div className="space-y-4 animate-fade-in border-t pt-4 mt-4">
                        {savedAddresses.length > 0 && (
                            <div className="mb-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Sổ địa chỉ:</label>
                                <select value={selectedAddressId} onChange={handleAddressBookChange} className="w-full border p-2.5 rounded-lg text-sm bg-blue-50 border-blue-200 text-blue-800">
                                    {savedAddresses.map(a => <option key={a.id} value={a.id}>{a.name} - {a.full_address.substring(0,30)}...</option>)}
                                    <option value="new">+ Thêm địa chỉ mới</option>
                                </select>
                            </div>
                        )}

                        {selectedAddressId === 'new' && (
                            <div className="space-y-3 bg-gray-50 p-3 rounded border">
                                <p className="text-xs font-bold text-gray-500 uppercase">Địa chỉ nhận hàng mới:</p>
                                <select className="w-full p-2 border rounded" value={addressData.city} onChange={(e) => setAddressData({ ...addressData, city: e.target.value, district: "", ward: "" })}>
                                    <option value="">-- Chọn Tỉnh/Thành phố --</option>
                                    {cities.map((c: any) => <option key={c.code} value={`${c.code}|${c.name}`}>{c.name}</option>)}
                                </select>
                                <select className="w-full p-2 border rounded" value={addressData.district} disabled={!addressData.city} onChange={(e) => setAddressData({ ...addressData, district: e.target.value, ward: "" })}>
                                    <option value="">-- Chọn Quận/Huyện --</option>
                                    {districts.map((d: any) => <option key={d.code} value={`${d.code}|${d.name}`}>{d.name}</option>)}
                                </select>
                                <select className="w-full p-2 border rounded" value={addressData.ward} disabled={!addressData.district} onChange={(e) => setAddressData({ ...addressData, ward: e.target.value })}>
                                    <option value="">-- Chọn Phường/Xã --</option>
                                    {wards.map((w: any) => <option key={w.code} value={`${w.code}|${w.name}`}>{w.name}</option>)}
                                </select>
                                <input type="text" placeholder="Số nhà, tên đường cụ thể..." className="w-full p-2 border rounded" value={addressData.specific} onChange={(e) => setAddressData({ ...addressData, specific: e.target.value })}/>
                            </div>
                        )}

                        <div className="pt-2">
                            {isHCMC ? (
                                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                    <p className="text-xs font-bold text-blue-800 uppercase mb-2">⏱ Chọn thời gian nhận (TP.HCM):</p>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {deliveryDates.map(date => (
                                            <button key={date} type="button" onClick={() => { setSelectedDate(date); setSelectedTimeSlot(""); }} className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap border ${selectedDate === date ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'}`}>{date}</button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {availableTimeSlots.length > 0 ? availableTimeSlots.map(slot => (
                                            <button key={slot} type="button" onClick={() => setSelectedTimeSlot(slot)} className={`py-1.5 rounded text-xs text-center border ${selectedTimeSlot === slot ? 'bg-green-600 text-white border-green-600' : 'bg-white hover:bg-gray-100'}`}>{slot}</button>
                                        )) : <p className="text-xs text-gray-500 col-span-3 text-center italic">Đã hết giờ giao hôm nay.</p>}
                                    </div>
                                    {selectedTimeSlot && <p className="text-xs text-green-700 mt-2 font-bold">✓ Giao lúc: {selectedTimeSlot}, {selectedDate}</p>}
                                </div>
                            ) : (
                                <div className="bg-orange-50 p-3 rounded border border-orange-200 flex items-center gap-3">
                                    <span className="text-2xl">🚚</span>
                                    <div><p className="text-sm font-bold text-orange-800">Thời gian giao hàng dự kiến</p><p className="text-xs text-orange-700">{shippingEstimate || "Vui lòng chọn địa chỉ để xem ngày giao"}</p></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- [SỬA] LOGIC NHẬN TẠI KHO (Dữ liệu thật) --- */}
                {deliveryMethod === 'store' && (
                    <div className="space-y-2 animate-fade-in border-t pt-4 mt-4">
                        <p className="text-sm font-bold text-gray-600">
                            {addressData.city ? `Nhà thuốc tại ${addressData.city.split("|")[1]}:` : "Danh sách nhà thuốc gần bạn:"}
                        </p>
                        {filteredStores.length > 0 ? filteredStores.map((store: any) => (
                            <label key={store.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${selectedStoreId === store.id ? 'border-blue-600 bg-blue-50' : 'hover:bg-gray-50'}`}>
                                <input type="radio" name="store" checked={selectedStoreId === store.id} onChange={() => setSelectedStoreId(store.id)} className="mt-1"/>
                                <div><div className="font-bold text-sm text-blue-800">{store.name}</div><div className="text-xs text-gray-500">{store.address}</div><div className="text-xs text-green-600 font-bold mt-1">✓ Còn hàng</div></div>
                            </label>
                        )) : (
                            <div className="text-center py-4 bg-gray-50 rounded border border-dashed text-gray-500 text-sm">
                                😔 Chưa có nhà thuốc nào ở khu vực này.<br/>Vui lòng chọn tỉnh thành khác hoặc chọn "Giao tận nơi".
                            </div>
                        )}
                    </div>
                )}

                <textarea name="note" rows={1} placeholder="Ghi chú đơn hàng (nếu có)" className="w-full border p-3 rounded-lg bg-gray-50 mt-4" value={formValues.note} onChange={(e) => setFormValues({...formValues, note: e.target.value})}></textarea>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-dashed border-blue-300">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Mã giảm giá" className="flex-1 p-2 border rounded font-bold uppercase" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                    <button type="button" onClick={() => checkCoupon()} disabled={checkingCoupon} className="bg-blue-600 text-white px-4 rounded font-bold">{checkingCoupon ? "..." : "Áp dụng"}</button>
                  </div>
                  {couponMessage.text && <p className={`text-xs mt-2 font-bold ${couponMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{couponMessage.text}</p>}
                  {availableCoupons.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">🎁 Mã dành cho bạn:</p>
                        <div className="space-y-2">
                            {availableCoupons.map((c) => (
                                <div key={c.id} className="flex justify-between bg-white border border-yellow-300 p-2 rounded text-xs shadow-sm">
                                    <div><span className="font-bold text-blue-800">{c.code}</span> - {c.discount_type === 'percent' ? `Giảm ${c.discount_value}%` : `Giảm ${c.discount_value/1000}k`}</div>
                                    <button type="button" onClick={() => checkCoupon(c.code)} className="text-blue-600 font-bold hover:underline">Dùng</button>
                                </div>
                            ))}
                        </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t space-y-2 text-sm">
                    <div className="flex justify-between"><span>Tạm tính:</span><span>{subTotal.toLocaleString("vi-VN")}đ</span></div>
                    <div className="flex justify-between">
                        <span>Phí vận chuyển:</span>
                        {shippingFee === 0 ? <span className="text-green-600 font-bold">Miễn phí</span> : <span>{shippingFee.toLocaleString("vi-VN")}đ</span>}
                    </div>
                    {deliveryMethod === 'home' && subTotal < 300000 && <p className="text-xs text-orange-500 italic text-right">Mua thêm {(300000 - subTotal).toLocaleString()}đ để được Freeship</p>}
                    {discountAmount > 0 && <div className="flex justify-between text-green-600 font-bold"><span>Giảm giá:</span><span>-{discountAmount.toLocaleString("vi-VN")}đ</span></div>}
                    <div className="flex justify-between pt-2 border-t border-dashed text-base">
                        <span className="font-bold">Tổng thanh toán:</span>
                        <span className="text-2xl font-bold text-red-600">{finalAmount.toLocaleString("vi-VN")}đ</span>
                    </div>
                </div>

                <button type="submit" disabled={loading} className={`w-full text-white font-bold py-4 rounded-lg mt-4 shadow-lg ${loading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"}`}>
                  {loading ? "ĐANG XỬ LÝ..." : `THANH TOÁN NGAY`}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}