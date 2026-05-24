import React from "react";

// Dữ liệu giả lập đánh giá (Sau này sẽ lấy từ Database)
const reviews = [
  {
    id: 1,
    user: "Nguyễn Văn A",
    date: "12/10/2023",
    rating: 5,
    content:
      "Sản phẩm chính hãng, tem mác đầy đủ. Giao hàng siêu nhanh trong 2h.",
  },
  {
    id: 2,
    user: "Trần Thị B",
    date: "05/11/2023",
    rating: 4,
    content: "Đóng gói cẩn thận, shipper thân thiện. Sẽ ủng hộ shop dài dài.",
  },
  {
    id: 3,
    user: "Lê Văn C",
    date: "20/01/2024",
    rating: 5,
    content:
      "Mua lần thứ 3 rồi, hàng chuẩn, chất lượng, giá tốt hơn mua ở các shop khác.",
  },
];

export default function ProductReviews({
  productId = "default",
}: {
  productId?: string | number;
}) {
  const idString = String(productId);
  const hash = idString.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rating = 4 + (hash % 10) / 10;
  const reviewCount = (hash % 150) + 120;

  return (
    <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-6 border-l-4 border-blue-600 pl-3">
        Đánh giá sản phẩm
      </h2>

      <div className="flex flex-col md:flex-row gap-8">
        {/* CỘT TRÁI: TỔNG QUAN ĐIỂM SỐ */}
        <div className="md:w-1/3 flex flex-col items-center justify-center border-r border-gray-100 pr-4">
          <div className="text-5xl font-bold text-blue-600 mb-2">
            {rating}
            <span className="text-2xl text-gray-400">/5</span>
          </div>
          <div className="flex text-yellow-400 text-xl mb-2">★★★★★</div>
          <p className="text-gray-500 text-sm">({reviewCount} đánh giá)</p>

          {/* Thanh tỉ lệ sao */}
          <div className="w-full mt-4 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div
                key={star}
                className="flex items-center gap-2 text-xs text-gray-500"
              >
                <span>{star} ★</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-yellow-400`}
                    style={{
                      width: star === 5 ? "70%" : star === 4 ? "20%" : "5%",
                    }}
                  ></div>
                </div>
                <span>{star === 5 ? "70%" : star === 4 ? "20%" : "5%"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI: DANH SÁCH BÌNH LUẬN */}
        <div className="md:w-2/3">
          <h3 className="font-bold text-gray-800 mb-4">
            Nhận xét từ khách hàng
          </h3>

          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                      {review.user.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800">
                        {review.user}
                      </p>
                      <div className="flex text-yellow-400 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>{i < review.rating ? "★" : "☆"}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{review.date}</span>
                </div>
                <p className="text-gray-600 text-sm ml-11 bg-gray-50 p-3 rounded-lg">
                  {review.content}
                </p>
              </div>
            ))}
          </div>

          {/* Nút xem thêm */}
          <div className="text-center mt-6">
            <button className="text-blue-600 border border-blue-600 px-6 py-2 rounded-full text-sm font-bold hover:bg-blue-50 transition">
              Xem tất cả {reviewCount} đánh giá
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
