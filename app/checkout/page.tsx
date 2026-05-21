"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const TIME_SLOTS = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00",
  "18:00 - 19:00",
  "19:00 - 20:00",
  "20:00 - 21:00",
];

export default function CheckoutPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [deliveryMethod, setDeliveryMethod] = useState<"home" | "store">(
    "home",
  );
  const [selectedStoreId, setSelectedStoreId] = useState<number>(0);

  const [pharmacyLocations, setPharmacyLocations] = useState<any[]>([]);

  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [addressData, setAddressData] = useState({
    city: "",
    district: "",
    ward: "",
    specific: "",
  });

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [formValues, setFormValues] = useState({
    fullName: "",
    phone: "",
    note: "",
  });

  const [deliveryDates, setDeliveryDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [shippingEstimate, setShippingEstimate] = useState<string>("");

  // --- STATE COUPON (TWMED) ---
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponMessage, setCouponMessage] = useState({ type: "", text: "" });
  const [discountAmount, setDiscountAmount] = useState(0);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  const subTotal = cart
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => {
      // [MỚI] Ưu tiên dùng giá của phân loại nếu có
      const price = item.selectedVariant
        ? Number(item.selectedVariant.price)
        : item.price;
      return sum + price * item.quantity;
    }, 0);

  const currentCityName = useMemo(() => {
    if (deliveryMethod === "store") return "";
    if (selectedAddressId !== "new") {
      const addr = savedAddresses.find(
        (a) => a.id.toString() === selectedAddressId,
      );
      return addr ? addr.full_address : "";
    }
    return addressData.city.split("|")[1] || "";
  }, [selectedAddressId, addressData.city, savedAddresses, deliveryMethod]);

  const isHCMC = useMemo(() => {
    const lowerCity = currentCityName.toLowerCase();
    return (
      lowerCity.includes("hồ chí minh") ||
      lowerCity.includes("hcm") ||
      lowerCity.includes("sài gòn")
    );
  }, [currentCityName]);

  const shippingFee = useMemo(() => {
    if (deliveryMethod === "store") return 0;
    if (subTotal >= 50000) return 0;
    return isHCMC ? 18000 : 32000;
  }, [deliveryMethod, subTotal, isHCMC]);

  useEffect(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName =
        i === 0
          ? "Hôm nay"
          : i === 1
            ? "Ngày mai"
            : `Thứ ${d.getDay() + 1 === 1 ? "CN" : d.getDay() + 1}`;
      const dateStr = `${dayName}, ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      dates.push(dateStr);
    }
    setDeliveryDates(dates);
    setSelectedDate(dates[0]);

    const fetchCities = async () => {
      try {
        const res = await fetch("https://provinces.open-api.vn/api/?depth=1");
        const data = await res.json();
        setCities(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCities();

    // Giữ nguyên lấy DS kho hàng, nhưng đổi tên hiển thị sau
    const fetchStores = async () => {
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("is_active", true);
      if (data) setPharmacyLocations(data);
    };
    fetchStores();
  }, []);

  useEffect(() => {
    if (addressData.city) {
      const fetchDistricts = async () => {
        const cityCode = addressData.city.split("|")[0];
        const res = await fetch(
          `https://provinces.open-api.vn/api/p/${cityCode}?depth=2`,
        );
        const data = await res.json();
        setDistricts(data.districts);
        setWards([]);
      };
      fetchDistricts();
    }
  }, [addressData.city]);

  useEffect(() => {
    if (addressData.district) {
      const fetchWards = async () => {
        const distCode = addressData.district.split("|")[0];
        const res = await fetch(
          `https://provinces.open-api.vn/api/d/${distCode}?depth=2`,
        );
        const data = await res.json();
        setWards(data.wards);
      };
      fetchWards();
    }
  }, [addressData.district]);

  useEffect(() => {
    if (cart.length > 0 && selectedItems.length === 0)
      setSelectedItems(cart.map((item) => item.id));
  }, [cart]); // 👈 Chỉ theo dõi cart ở đây

  useEffect(() => {
    // 👈 Tách việc gọi API xuống DB ra một useEffect riêng, CHỈ CHẠY 1 LẦN khi load trang

    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: addresses } = await supabase
          .from("user_addresses")
          .select("*")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false });
        if (addresses) setSavedAddresses(addresses);

        // Tìm đơn hàng cũ từ bảng orders_tw để tự điền form
        const { data: lastOrder } = await supabase
          .from("orders_tw")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (lastOrder) {
          setFormValues({
            fullName: lastOrder.customer_name || "",
            phone: lastOrder.phone_number || "",
            note: "",
          });
        } else {
          setFormValues((prev) => ({ ...prev, phone: user.phone || "" }));
        }
      }
    };

    // 👈 ĐÃ ĐỔI SANG BẢNG coupons_tw
    const fetchCoupons = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("coupons_tw")
        .select("*")
        .eq("is_active", true)
        .or(`expiry_date.is.null,expiry_date.gt.${now}`)
        .order("min_order_value", { ascending: true })
        .limit(5);

      if (data)
        setAvailableCoupons(
          data.filter(
            (c) => c.usage_limit === 0 || c.used_count < c.usage_limit,
          ),
        );
    };

    fetchData();
    fetchCoupons();
  }, []); // 👈 Rất quan trọng: Mảng rỗng để không bị gọi lại khi đổi số lượng món hàng

  useEffect(() => {
    if (currentCityName) {
      const lowerCity = currentCityName.toLowerCase();
      const today = new Date();
      let minDays = 3,
        maxDays = 5;

      if (isHCMC) {
        minDays = 1;
        maxDays = 3;
      } else if (
        lowerCity.includes("long an") ||
        lowerCity.includes("tiền giang") ||
        lowerCity.includes("cần thơ") ||
        lowerCity.includes("bình dương") ||
        lowerCity.includes("đồng nai")
      ) {
        minDays = 2;
        maxDays = 3;
      } else if (lowerCity.includes("đà nẵng") || lowerCity.includes("huế")) {
        minDays = 3;
        maxDays = 4;
      } else if (
        lowerCity.includes("hà nội") ||
        lowerCity.includes("hải phòng")
      ) {
        minDays = 3;
        maxDays = 5;
      }
      const dateMin = new Date(today);
      dateMin.setDate(today.getDate() + minDays);
      const dateMax = new Date(today);
      dateMax.setDate(today.getDate() + maxDays);
      setShippingEstimate(
        `Nhận hàng từ: ${dateMin.getDate()}/${dateMin.getMonth() + 1} - ${dateMax.getDate()}/${dateMax.getMonth() + 1}`,
      );
    }
  }, [isHCMC, currentCityName]);

  const handleAddressBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    if (id !== "new") {
      const addr = savedAddresses.find((a) => a.id.toString() === id);
      if (addr)
        setFormValues((prev) => ({
          ...prev,
          fullName: addr.name || "",
          phone: addr.phone || "",
        }));
    } else {
      setAddressData({ city: "", district: "", ward: "", specific: "" });
    }
  };

  const getFullAddress = () => {
    if (selectedAddressId !== "new") {
      const addr = savedAddresses.find(
        (a) => a.id.toString() === selectedAddressId,
      );
      return addr ? addr.full_address : "";
    }
    const city = addressData.city.split("|")[1] || "";
    const dist = addressData.district.split("|")[1] || "";
    const ward = addressData.ward.split("|")[1] || "";
    return `${addressData.specific}, ${ward}, ${dist}, ${city}`
      .replace(/^, /, "")
      .replace(/, ,/g, ",");
  };

  const filteredStores = pharmacyLocations.filter((store) => {
    if (!addressData.city) return true;
    const currentCityCode = addressData.city.split("|")[0];
    return store.city_code === currentCityCode;
  });

  const finalAmount = subTotal - discountAmount + shippingFee;

  // 👈 KIỂM TRA MÃ TỪ BẢNG coupons_tw
  const checkCoupon = async (codeOverride?: string) => {
    setCouponMessage({ type: "", text: "" });
    setCheckingCoupon(true);
    const codeToTest = (codeOverride || couponCode).toUpperCase().trim();
    if (codeOverride) setCouponCode(codeOverride);
    if (!codeToTest) {
      setCheckingCoupon(false);
      return;
    }

    try {
      const { data: coupon, error } = await supabase
        .from("coupons_tw")
        .select("*")
        .eq("code", codeToTest)
        .eq("is_active", true)
        .single();

      if (error || !coupon) {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponMessage({
          type: "error",
          text: "❌ Mã không tồn tại hoặc đã hết hạn!",
        });
        return;
      }
      if (subTotal < coupon.min_order_value) {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponMessage({
          type: "error",
          text: `❌ Đơn từ ${Number(coupon.min_order_value).toLocaleString("vi-VN")}đ mới được dùng!`,
        });
        return;
      }

      let discount = 0;
      if (coupon.discount_type === "percent") {
        discount = (subTotal * coupon.discount_value) / 100;
        if (
          coupon.max_discount_amount > 0 &&
          discount > coupon.max_discount_amount
        )
          discount = coupon.max_discount_amount;
      } else {
        discount = coupon.discount_value;
      }
      if (discount > subTotal) discount = subTotal;

      setDiscountAmount(discount);
      setAppliedCoupon(coupon);
      setCouponMessage({
        type: "success",
        text: `✅ Áp dụng thành công: -${discount.toLocaleString("vi-VN")}đ`,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingCoupon(false);
    }
  };

  const bestCouponId = useMemo(() => {
    let bestId = null;
    let maxD = 0;
    availableCoupons.forEach((c) => {
      if (subTotal >= c.min_order_value) {
        let d =
          c.discount_type === "percent"
            ? (subTotal * c.discount_value) / 100
            : c.discount_value;
        if (c.max_discount_amount > 0 && d > c.max_discount_amount)
          d = c.max_discount_amount;
        if (d > subTotal) d = subTotal;
        if (d > maxD) {
          maxD = d;
          bestId = c.id;
        }
      }
    });
    return bestId;
  }, [availableCoupons, subTotal]);

  useEffect(() => {
    let best = null;
    let maxD = 0;
    availableCoupons.forEach((c) => {
      if (subTotal >= c.min_order_value) {
        let d =
          c.discount_type === "percent"
            ? (subTotal * c.discount_value) / 100
            : c.discount_value;
        if (c.max_discount_amount > 0 && d > c.max_discount_amount)
          d = c.max_discount_amount;
        if (d > subTotal) d = subTotal;
        if (d > maxD) {
          maxD = d;
          best = c;
        }
      }
    });

    let currentD = 0;
    let currentValid = false;
    if (appliedCoupon) {
      if (subTotal >= (appliedCoupon as any).min_order_value) {
        currentValid = true;
        currentD =
          (appliedCoupon as any).discount_type === "percent"
            ? (subTotal * (appliedCoupon as any).discount_value) / 100
            : (appliedCoupon as any).discount_value;
        if (
          (appliedCoupon as any).max_discount_amount > 0 &&
          currentD > (appliedCoupon as any).max_discount_amount
        )
          currentD = (appliedCoupon as any).max_discount_amount;
        if (currentD > subTotal) currentD = subTotal;
      }
    }

    if (best && maxD > currentD) {
      if (
        (appliedCoupon as any)?.id !== (best as any).id ||
        discountAmount !== maxD
      ) {
        setAppliedCoupon(best);
        setCouponCode((best as any).code);
        setDiscountAmount(maxD);
        setCouponMessage({
          type: "success",
          text: `✅ Đã tự động áp dụng mã ưu đãi: -${maxD.toLocaleString("vi-VN")}đ`,
        });
      }
    } else if (currentValid) {
      if (discountAmount !== currentD) setDiscountAmount(currentD);
    } else {
      if (appliedCoupon !== null || discountAmount !== 0) {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        if (couponMessage.text !== "⚠️ Mã đã bị hủy do chưa đủ điều kiện!") {
          setCouponMessage({
            type: "error",
            text: "⚠️ Mã đã bị hủy do chưa đủ điều kiện!",
          });
        }
      }
    }
  }, [
    subTotal,
    availableCoupons,
    appliedCoupon,
    discountAmount,
    couponMessage.text,
  ]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn sản phẩm để thanh toán!");
      setLoading(false);
      return;
    }

    // --- LOGIC MỚI: TỰ ĐỘNG TẠO/LẤY TÀI KHOẢN CHO KHÁCH VÃNG LAI ---
    let userIdForOrder = user?.id;

    // Nếu là khách vãng lai (chưa đăng nhập) và có nhập SĐT
    if (!user && formValues.phone.trim()) {
      try {
        let formattedPhone = formValues.phone.trim();
        if (formattedPhone.startsWith("0")) {
          formattedPhone = "+84" + formattedPhone.substring(1);
        }
        const fakeEmail = `${formattedPhone}@twmart.com`;
        const tempPassword = Math.random().toString(36).slice(-10);

        // Thử đăng ký tài khoản mới.
        // Supabase sẽ báo lỗi nếu SĐT/email đã tồn tại, nhưng sẽ không trả về user.
        // Đây là giới hạn khi làm ở client, nhưng vẫn đáp ứng yêu cầu tự tạo tài khoản cho đơn đầu.
        const { data: signUpData } = await supabase.auth.signUp({
          email: fakeEmail,
          password: tempPassword,
          options: { data: { full_name: formValues.fullName } },
        });

        if (signUpData.user) {
          userIdForOrder = signUpData.user.id;
          // Cập nhật SĐT cho tài khoản vừa tạo
          await supabase.auth.updateUser({ phone: formattedPhone });
        }
        // Nếu có lỗi (vd: user đã tồn tại), ta bỏ qua và đặt hàng như guest (userIdForOrder = null)
      } catch (accountError) {
        console.warn(
          "Lỗi tự động tạo tài khoản (có thể bỏ qua):",
          accountError,
        );
      }
    }
    // --- KẾT THÚC LOGIC MỚI ---

    const selectedStore = pharmacyLocations.find(
      (s) => s.id === selectedStoreId,
    );
    const finalAddress =
      deliveryMethod === "store"
        ? `[ĐẾN LẤY TẠI KHO] ${selectedStore?.name} - ${selectedStore?.address}`
        : getFullAddress();

    if (
      deliveryMethod === "home" &&
      selectedAddressId === "new" &&
      (!addressData.city || !addressData.specific)
    ) {
      alert("Vui lòng điền địa chỉ!");
      setLoading(false);
      return;
    }

    let deliveryNote = "";
    if (deliveryMethod === "home") {
      deliveryNote = `Giao hàng bay Air: ${shippingEstimate}`;
    }

    const orderInfo = {
      name: formValues.fullName,
      phone: formValues.phone,
      address: finalAddress,
      note: `${deliveryNote}. ${formValues.note}`,
      deliveryMethod: deliveryMethod,
    };

    const itemsToOrder = cart.filter((item) => selectedItems.includes(item.id));
    try {
      // [FIX] Sử dụng URL tuyệt đối để tránh lỗi "Failed to fetch" trên một số môi trường
      const absoluteUrl = new URL("/api/payment/create", window.location.origin)
        .href;

      const response = await fetch(absoluteUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsToOrder,
          totalAmount: finalAmount,
          subTotal: subTotal,
          couponCode: appliedCoupon ? (appliedCoupon as any).code : null,
          customer: orderInfo,
          paymentMethod: paymentMethod,
          userId: userIdForOrder, // Sử dụng ID mới hoặc ID của user đã đăng nhập
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
      else {
        itemsToOrder.forEach((item) => removeFromCart(item.id));
        alert("✅ Đặt hàng thành công! TWMED sẽ liên hệ bạn sớm nhất.");
        router.push("/");
      }
    } catch (error: any) {
      alert("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">
        Giỏ hàng của bạn đang trống
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans pt-8 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8 border-b border-gray-200 pb-4">
          <span className="text-3xl">🇹🇼</span>
          <h1 className="text-3xl font-black text-blue-900 uppercase">
            Thanh Toán Đơn Hàng
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🛒</span> 1. Giỏ hàng của bạn ({cart.length})
              </h2>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 border-b border-gray-50 pb-4 items-start hover:bg-gray-50/50 p-2 rounded-lg transition"
                  >
                    <div className="w-20 h-20 border border-gray-100 rounded-lg overflow-hidden flex-shrink-0 bg-white shadow-sm">
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-sm md:text-base leading-snug mb-1">
                        {item.title}
                      </h3>
                      {/* [MỚI] Hiển thị phân loại hàng đã chọn */}
                      {item.selectedVariant && (
                        <p className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded inline-block">
                          Phân loại:{" "}
                          <span className="font-bold">
                            {item.selectedVariant.name}
                          </span>
                        </p>
                      )}
                      <p className="text-red-600 font-black mb-2">
                        {(item.selectedVariant ? Number(item.selectedVariant.price) : item.price).toLocaleString("vi-VN")}đ
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold"
                          >
                            -
                          </button>
                          <span className="w-10 h-8 flex items-center justify-center text-sm font-bold bg-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs text-gray-400 hover:text-red-600 font-bold underline transition"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2 flex items-center gap-2">
                <span>📦</span> 2. Thông tin nhận hàng
              </h2>

              <form onSubmit={handleOrder} className="space-y-5">
                <div className="flex gap-3 mb-4">
                  <label
                    className={`flex-1 p-3 border-2 rounded-xl cursor-pointer flex flex-col items-center justify-center gap-1 transition ${deliveryMethod === "home" ? "border-blue-600 bg-blue-50 text-blue-800 font-bold" : "border-gray-200 hover:bg-gray-50 text-gray-600"}`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryMethod === "home"}
                      onChange={() => setDeliveryMethod("home")}
                      className="hidden"
                    />
                    <span className="text-2xl">🚚</span>
                    <span className="text-sm text-center">Giao tận nơi</span>
                  </label>
                  <label
                    className={`flex-1 p-3 border-2 rounded-xl cursor-pointer flex flex-col items-center justify-center gap-1 transition ${deliveryMethod === "store" ? "border-blue-600 bg-blue-50 text-blue-800 font-bold" : "border-gray-200 hover:bg-gray-50 text-gray-600"}`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryMethod === "store"}
                      onChange={() => setDeliveryMethod("store")}
                      className="hidden"
                    />
                    <span className="text-2xl">🏪</span>
                    <span className="text-sm text-center">Đến lấy tại kho</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <input
                    required
                    name="fullName"
                    type="text"
                    placeholder="Họ và tên người nhận"
                    className="w-full border-2 border-gray-100 p-3.5 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-400 outline-none transition"
                    value={formValues.fullName || ""}
                    onChange={(e) =>
                      setFormValues({ ...formValues, fullName: e.target.value })
                    }
                  />
                  <input
                    required
                    name="phone"
                    type="tel"
                    placeholder="Số điện thoại liên hệ"
                    className="w-full border-2 border-gray-100 p-3.5 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-400 outline-none transition"
                    value={formValues.phone || ""}
                    onChange={(e) =>
                      setFormValues({ ...formValues, phone: e.target.value })
                    }
                  />
                </div>

                {deliveryMethod === "home" && (
                  <div className="space-y-4 animate-fade-in border-t border-gray-100 pt-4">
                    {savedAddresses.length > 0 && (
                      <div className="mb-2">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                          📍 Sổ địa chỉ đã lưu:
                        </label>
                        <select
                          value={selectedAddressId || ""}
                          onChange={handleAddressBookChange}
                          className="w-full border-2 p-3 rounded-xl text-sm bg-blue-50/50 border-blue-200 text-blue-800 font-medium outline-none"
                        >
                          {savedAddresses.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} - {a.full_address.substring(0, 30)}...
                            </option>
                          ))}
                          <option value="new">+ Thêm địa chỉ mới</option>
                        </select>
                      </div>
                    )}

                    {selectedAddressId === "new" && (
                      <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                          🏠 Địa chỉ nhận hàng mới:
                        </p>
                        <select
                          className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white text-sm"
                          value={addressData.city || ""}
                          onChange={(e) =>
                            setAddressData({
                              ...addressData,
                              city: e.target.value,
                              district: "",
                              ward: "",
                            })
                          }
                        >
                          <option value="">-- Chọn Tỉnh/Thành phố --</option>
                          {cities.map((c: any) => (
                            <option key={c.code} value={`${c.code}|${c.name}`}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white text-sm disabled:bg-gray-100"
                          value={addressData.district || ""}
                          disabled={!addressData.city}
                          onChange={(e) =>
                            setAddressData({
                              ...addressData,
                              district: e.target.value,
                              ward: "",
                            })
                          }
                        >
                          <option value="">-- Chọn Quận/Huyện --</option>
                          {districts.map((d: any) => (
                            <option key={d.code} value={`${d.code}|${d.name}`}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white text-sm disabled:bg-gray-100"
                          value={addressData.ward || ""}
                          disabled={!addressData.district}
                          onChange={(e) =>
                            setAddressData({
                              ...addressData,
                              ward: e.target.value,
                            })
                          }
                        >
                          <option value="">-- Chọn Phường/Xã --</option>
                          {wards.map((w: any) => (
                            <option key={w.code} value={`${w.code}|${w.name}`}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Số nhà, tên đường cụ thể..."
                          className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white text-sm"
                          value={addressData.specific || ""}
                          onChange={(e) =>
                            setAddressData({
                              ...addressData,
                              specific: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}

                    <div className="pt-2">
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                        <span className="text-2xl mt-1 text-blue-600">✈️</span>
                        <div>
                          <p className="text-sm font-bold text-blue-900">
                            Giao hàng đường bay (Air)
                          </p>
                          <p className="text-xs text-blue-700 font-medium mt-1">
                            {shippingEstimate ||
                              "Vui lòng chọn địa chỉ để xem ngày giao dự kiến"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {deliveryMethod === "store" && (
                  <div className="space-y-3 animate-fade-in border-t border-gray-100 pt-4 mt-4">
                    <p className="text-sm font-bold text-gray-700">
                      {addressData.city
                        ? `Kho hàng tại ${addressData.city.split("|")[1]}:`
                        : "Chọn kho lấy hàng:"}
                    </p>
                    {filteredStores.length > 0 ? (
                      filteredStores.map((store: any) => (
                        <label
                          key={store.id}
                          className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${selectedStoreId === store.id ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:bg-gray-50"}`}
                        >
                          <input
                            type="radio"
                            name="store"
                            checked={selectedStoreId === store.id}
                            onChange={() => setSelectedStoreId(store.id)}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-bold text-sm text-blue-900">
                              {store.name}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                              {store.address}
                            </div>
                            <div className="text-[10px] bg-green-100 text-green-700 font-black px-2 py-0.5 rounded mt-2 inline-block uppercase">
                              Sẵn hàng - Đến lấy ngay
                            </div>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500 text-sm">
                        😔 Chưa có kho hàng TWMED ở khu vực này.
                        <br />
                        Vui lòng chọn "Giao tận nơi".
                      </div>
                    )}
                  </div>
                )}

                <textarea
                  name="note"
                  rows={2}
                  placeholder="Ghi chú đơn hàng (Thời gian nhận, lưu ý cho shipper...)"
                  className="w-full border-2 border-gray-100 p-3.5 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-400 outline-none transition mt-2 text-sm"
                  value={formValues.note || ""}
                  onChange={(e) =>
                    setFormValues({ ...formValues, note: e.target.value })
                  }
                ></textarea>

                <div className="mt-6 border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase flex items-center gap-2">
                    <span>💳</span> Phương thức thanh toán
                  </h3>
                  <div className="space-y-3">
                    <label
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition border-blue-600 bg-blue-50 shadow-sm`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="COD"
                        checked={paymentMethod === "COD"}
                        readOnly
                        className="w-5 h-5 text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-blue-900 text-sm">
                          Thanh toán khi nhận hàng (COD)
                        </p>
                        <p className="text-xs text-blue-700/80 mt-0.5">
                          Kiểm tra hàng thoải mái trước khi thanh toán tiền mặt
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* KHU VỰC NHẬP MÃ GIẢM GIÁ */}
                <div className="mt-6 p-5 bg-red-50/50 rounded-2xl border border-dashed border-red-200">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Nhập mã ưu đãi TWMED..."
                      className="flex-1 p-3 border border-white rounded-lg font-bold uppercase outline-none focus:ring-2 focus:ring-red-400 bg-white shadow-sm"
                      value={couponCode || ""}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => checkCoupon()}
                      disabled={checkingCoupon}
                      className="bg-red-600 hover:bg-red-700 text-white px-5 rounded-lg font-bold transition shadow-sm"
                    >
                      {checkingCoupon ? "..." : "Áp dụng"}
                    </button>
                  </div>

                  {couponMessage.text && (
                    <p
                      className={`text-xs font-bold mt-2 ${couponMessage.type === "error" ? "text-red-600" : "text-green-600"}`}
                    >
                      {couponMessage.text}
                    </p>
                  )}

                  {availableCoupons.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-dashed border-red-200">
                      <p className="text-xs font-black text-red-800 uppercase mb-3 flex items-center gap-1">
                        <span>🎁</span> Mã TWMED dành cho bạn:
                      </p>
                      <div className="space-y-3">
                        {availableCoupons.map((c) => {
                          const isBest = c.id === bestCouponId;
                          const isApplied = (appliedCoupon as any)?.id === c.id;

                          return (
                            <div
                              key={c.id}
                              className={`flex flex-col p-3.5 rounded-xl border-2 transition-all ${isApplied ? "border-red-500 bg-white shadow-md" : "bg-white border-transparent shadow-sm hover:border-red-200"}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-red-700 text-lg tracking-wider">
                                    {c.code}
                                  </span>
                                  {isBest && (
                                    <span className="bg-yellow-400 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-sm uppercase shadow-sm">
                                      🔥 Ngon nhất
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => checkCoupon(c.code)}
                                  className={`font-bold text-xs px-4 py-2 rounded-lg transition-all ${isApplied ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"}`}
                                  disabled={isApplied}
                                >
                                  {isApplied ? "Đang áp dụng" : "Dùng mã"}
                                </button>
                              </div>
                              <div className="text-gray-600 text-xs space-y-1.5">
                                <p>
                                  <span className="font-bold text-gray-800">
                                    Giảm{" "}
                                    {c.discount_type === "percent"
                                      ? `${c.discount_value}%`
                                      : `${c.discount_value.toLocaleString("vi-VN")}đ`}
                                  </span>
                                  {c.max_discount_amount > 0 && (
                                    <span>
                                      {" "}
                                      (Tối đa{" "}
                                      {c.max_discount_amount.toLocaleString(
                                        "vi-VN",
                                      )}
                                      đ)
                                    </span>
                                  )}
                                </p>
                                <p className="text-gray-500">
                                  Áp dụng cho đơn từ{" "}
                                  {c.min_order_value.toLocaleString("vi-VN")}đ
                                </p>
                              </div>

                              {subTotal < c.min_order_value && (
                                <div className="mt-3 pt-3 border-t border-gray-50">
                                  <p className="text-red-500 text-[11px] font-bold flex items-center gap-1.5">
                                    <span className="bg-red-100 rounded-full w-4 h-4 flex items-center justify-center">
                                      !
                                    </span>{" "}
                                    Mua thêm{" "}
                                    {(
                                      c.min_order_value - subTotal
                                    ).toLocaleString("vi-VN")}
                                    đ để đủ điều kiện
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t-2 border-gray-100 space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Tạm tính:</span>
                    <span>{subTotal.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Phí vận chuyển nội địa VN:</span>
                    {shippingFee === 0 ? (
                      <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">
                        Miễn phí
                      </span>
                    ) : (
                      <span>{shippingFee.toLocaleString("vi-VN")}đ</span>
                    )}
                  </div>
                  {deliveryMethod === "home" && subTotal < 50000 && (
                    <p className="text-[11px] text-orange-500 italic text-right font-medium">
                      Mua thêm {(50000 - subTotal).toLocaleString("vi-VN")}đ để
                      được Freeship
                    </p>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-red-600 font-black text-base pt-2">
                      <span>Mã giảm giá:</span>
                      <span>-{discountAmount.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-4 mt-2 border-t border-dashed border-gray-200 items-end">
                    <div>
                      <span className="font-bold text-gray-800 block text-base">
                        Tổng thanh toán:
                      </span>
                      <span className="text-[10px] text-gray-400 italic">
                        Đã bao gồm VAT & Thuế thông quan
                      </span>
                    </div>
                    <span className="text-3xl font-black text-blue-900">
                      {finalAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white font-black py-5 rounded-2xl mt-6 shadow-xl transition transform active:scale-95 text-lg ${loading ? "bg-gray-400" : "bg-gradient-to-r from-red-600 to-blue-900 hover:from-red-700 hover:to-blue-950"}`}
                >
                  {loading ? "ĐANG XỬ LÝ ĐƠN HÀNG..." : `CHỐT ĐƠN NGAY`}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
