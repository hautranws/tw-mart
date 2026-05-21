import React from "react";
import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import ProductSpecs from "@/components/ProductSpecs";
import ProductReviews from "@/components/ProductReviews";
import RelatedProducts from "@/components/RelatedProducts";
import Breadcrumb from "@/components/Breadcrumb";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const { data: product, error } = await supabase
    .from("products_tw")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) {
    notFound();
  }

  return (
    <div className="bg-gray-50 py-6 min-h-screen font-sans">
      <div className="container mx-auto px-4">
        <Breadcrumb category={product.category} productName={product.title} />

        <ProductDetailClient product={product} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-blue-600 pl-3">
                Mô tả sản phẩm
              </h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                {product.description ||
                  "Chưa có thông tin mô tả chi tiết cho sản phẩm này."}
              </div>
            </div>
            <ProductReviews />
          </div>
          <div className="md:col-span-1">
            <ProductSpecs product={product} />
          </div>
        </div>

        <RelatedProducts category={product.category} currentId={product.id} />
      </div>
    </div>
  );
}
