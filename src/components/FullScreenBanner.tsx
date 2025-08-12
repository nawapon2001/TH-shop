'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Banner {
  _id: string;
  image: string;
  contentType: string;
  filename?: string;
  url?: string;
  isSmall?: boolean;
}

export default function FullScreenBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/banners');
      const data = await response.json();
      setBanners(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setLoading(false);
    }
  };

  // Auto slide for main banners (not small ones)
  const mainBanners = banners.filter((b) => !b.isSmall);
  useEffect(() => {
    if (mainBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % mainBanners.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [mainBanners.length]);

  const smallBanners = banners.filter((b) => b.isSmall);

  if (loading) {
    return (
      <div className="w-full h-[400px] md:h-[500px] lg:h-[600px] bg-gray-100 animate-pulse" />
    );
  }
  if (mainBanners.length === 0 && smallBanners.length === 0) {
    return null;
  }
  return (
    <div className="w-full h-[400px] md:h-[500px] lg:h-[600px] relative overflow-hidden">
      {/* Main Banner (auto slide) */}
      {mainBanners.length > 0 && (
        <div className="overflow-hidden rounded-lg shadow-lg w-full h-full relative flex items-center justify-center">
          <img
            src={mainBanners[current].image}
            alt={`Banner ${current + 1}`}
            className="w-full h-full object-cover transition-all duration-700"
            style={{
              width: '100vw',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              margin: '0 auto',
            }}
          />
          {/* จุดบอกตำแหน่ง */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {mainBanners.map((_, idx) => (
              <button
                key={idx}
                className={`w-3 h-3 rounded-full ${
                  idx === current ? 'bg-orange-500' : 'bg-gray-300'
                } opacity-80`}
                onClick={() => setCurrent(idx)}
                aria-label={`Go to banner ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}
      {/* Small Banners (เล็ก) วางซ้อนขวาล่าง */}
      {smallBanners.length > 0 && (
        <div
          className="absolute flex flex-col gap-2 right-2 bottom-2 z-10"
          style={{ width: 120 }}
        >
          {smallBanners.map((b, idx) => (
            <img
              key={idx}
              src={b.image}
              alt={`Small Banner ${idx + 1}`}
              className="rounded shadow border bg-white"
              style={{ width: 120, height: 56, objectFit: 'cover' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
      