import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Cho phép ảnh từ mọi kho Supabase
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // Cho phép ảnh mẫu (nếu có)
      },
      {
        protocol: 'https',
        hostname: 'nhathuoclongchau.com.vn', // Cho phép ảnh demo (nếu có)
      },
    ],
  },
};

export default nextConfig;