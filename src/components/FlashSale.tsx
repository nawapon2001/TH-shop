// src/components/FlashSale.tsx
import React, { useState, useEffect } from 'react';

type FlashSaleProduct = {
  _id: string;
  name: string;
  price: number;
  originalPrice: number;
  image?: string;
  discount: number;
  stock: number;
  sold: number;
};

export default function FlashSale({ products }: { products: FlashSaleProduct[] }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 30,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-white font-bold text-xl">⚡ Flash Sale</span>
          <div className="bg-white rounded px-2 py-1">
            <span className="text-red-500 font-bold">
              {String(timeLeft.hours).padStart(2, '0')}:
              {String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
        <button className="text-white underline">ดูทั้งหมด</button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.slice(0, 4).map(product => (
          <div key={product._id} className="bg-white rounded-lg p-3">
            <div className="relative">
              <img 
                src={product.image || '/placeholder.jpg'} 
                alt={product.name}
                className="w-full h-32 object-cover rounded"
              />
              <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                -{product.discount}%
              </span>
            </div>
            <h3 className="text-sm font-semibold mt-2 line-clamp-2">{product.name}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-red-500 font-bold">฿{product.price}</span>
              <span className="text-gray-400 text-xs line-through">฿{product.originalPrice}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${(product.sold / product.stock) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">ขายแล้ว {product.sold}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
