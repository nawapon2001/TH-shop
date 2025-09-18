// src/components/ProductRecommendations.tsx
import React from 'react';

type Product = {
  _id: string;
  name: string;
  price: number;
  image?: string;
  images?: string[];
  rating?: number;
  reviews?: number;
};

export default function ProductRecommendations({ products, title = "สินค้าแนะนำ" }: { 
  products: Product[]; 
  title?: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <button className="text-orange-500 hover:text-orange-600 font-medium">
          ดูทั้งหมด →
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {products.map((product, index) => (
          <div key={`${product._id || 'rec'}-${index}`} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="relative">
              <img
                src={product.image || "https://via.placeholder.com/200x200?text=No+Image"}
                alt={product.name}
                className="w-full h-40 object-cover rounded-t-lg"
              />
              {product.rating && (
                <div className="absolute top-2 right-2 bg-yellow-400 text-white text-xs px-2 py-1 rounded">
                  ⭐ {product.rating}
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
              <p className="text-lg font-bold text-orange-500">฿{product.price.toLocaleString()}</p>
              {product.reviews && (
                <p className="text-xs text-gray-500">{product.reviews} รีวิว</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
