// src/components/Banner.tsx
'use client'
import React, { useEffect, useMemo, useState } from 'react'

type BannerItem = { _id?: string; url?: string; image?: string; isSmall?: boolean }

type BannerProps = {
  images?: BannerItem[] // จะส่งมาก็ได้ ไม่ส่งก็ให้ component ไปโหลดเอง
  height?: number       // สูงแบบ px ถ้าอยาก override (ค่าเริ่มต้นจะใช้ aspect 16:9)
  className?: string
}

export default function Banner({ images = [], height, className }: BannerProps) {
  const [loaded, setLoaded] = useState<BannerItem[]>(images)
  const [current, setCurrent] = useState(0)

  // โหลดจาก /api/banner อัตโนมัติถ้าไม่ส่ง images มา
  useEffect(() => {
    if (images.length > 0) {
      setLoaded(images)
      return
    }
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/banners', { cache: 'no-store' })
        const data = await res.json()
        // ปรับชื่อฟิลด์ให้เป็นรูปแบบเดียวกัน
        const normalized: BannerItem[] = Array.isArray(data)
          ? data.map((b: any) => ({
              _id: b._id,
              url: b.image ?? b.url,
              image: b.image ?? b.url,
              isSmall: !!b.isSmall,
            }))
          : []
        if (alive) setLoaded(normalized)
      } catch {
        if (alive) setLoaded([])
      }
    })()
    return () => { alive = false }
  }, [images])

  // แยกเป็นแบนเนอร์ใหญ่/เล็ก
  const mainBanners = useMemo(
    () => loaded.filter((b) => !b.isSmall && getSrc(b)),
    [loaded]
  )
  const smallBanners = useMemo(
    () => loaded.filter((b) => b.isSmall && getSrc(b)),
    [loaded]
  )

  // สไลด์อัตโนมัติ
  useEffect(() => {
    if (mainBanners.length <= 1) return
    const t = setInterval(() => setCurrent((i) => (i + 1) % mainBanners.length), 4000)
    return () => clearInterval(t)
  }, [mainBanners.length])

  if (!mainBanners.length && !smallBanners.length) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="relative w-full aspect-[16/9] rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white grid place-items-center text-slate-500">
          ไม่มีแบนเนอร์
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full ${className || ''}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* กล่องแบนเนอร์ 16:9 */}
        <div
          className={`relative w-full ${height ? '' : 'aspect-[16/9]'} rounded-2xl overflow-hidden border border-orange-200 shadow-sm`}
          style={height ? { height } : undefined}
        >
          {/* สไลด์ */}
          <div
            className="absolute inset-0 flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {mainBanners.map((b, i) => (
              <div key={b._id ?? i} className="min-w-full h-full relative">
                <img
                  src={getSrc(b)}
                  alt={`banner-${i + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1600x900?text=Banner'
                  }}
                />
              </div>
            ))}
          </div>

          {/* จุดบอกตำแหน่ง */}
          {mainBanners.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {mainBanners.map((_, i) => (
                <button
                  key={i}
                  aria-label={`ไปสไลด์ที่ ${i + 1}`}
                  onClick={() => setCurrent(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    i === current ? 'w-6 bg-orange-600' : 'w-2.5 bg-white/90 border border-orange-200'
                  }`}
                />
              ))}
            </div>
          )}

          {/* แบนเนอร์เล็ก ซ้อนขวาล่าง */}
          {!!smallBanners.length && (
            <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-2">
              {smallBanners.map((b, i) => (
                <img
                  key={b._id ?? `s-${i}`}
                  src={getSrc(b)}
                  alt={`small-${i + 1}`}
                  className="w-28 h-14 rounded-lg border border-orange-200 bg-white object-cover shadow"
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* utils */
function getSrc(b: { url?: string; image?: string }) {
  const raw = (b.url || b.image || '').trim()
  if (!raw) return ''
  // ถ้าเป็น base64 หรือ http หรือ /banners หรือ /uploads ให้ใช้ตรง ๆ
  if (raw.startsWith('data:') || raw.startsWith('http') || raw.startsWith('/banners/') || raw.startsWith('/uploads/')) return raw
  // เผื่อกรณีเซฟเป็นชื่อไฟล์เฉย ๆ
  return `/banners/${raw.replace(/^\/?banners\//, '')}`
}
