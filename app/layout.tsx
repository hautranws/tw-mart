import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Import CartProvider
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveChat from "@/components/LiveChat";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TW MART - Siêu thị Đài Loan",
  description: "Hệ thống hàng Đài Loan chính hãng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        {/* CartProvider bọc toàn bộ nội dung để chia sẻ dữ liệu Giỏ hàng */}
        <CartProvider>
          <Header />

          {children}

          <LiveChat />

          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
