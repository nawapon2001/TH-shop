'use client'
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // ตัวอย่างเรียก API สมมติ /api/login
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.status === 404) {
      setError('ไม่พบ API /api/login กรุณาสร้าง route นี้ก่อน');
      return;
    }
    const data = await res.json();
    if (res.ok && data.user) {
      setUser(data.user.fullName || data.user.email);
      // redirect to home with username in query
      router.push(`/?username=${encodeURIComponent(data.user.fullName || data.user.email)}`);
      return;
    } else {
      setError(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <Header user={user} />
      <main className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center mb-6">
            {/* โลโก้หรือไอคอน */}
           
            <h2 className="text-2xl font-bold text-orange-700 mb-1">เข้าสู่ระบบ</h2>
            <p className="text-sm text-gray-500">กรุณากรอกอีเมลและรหัสผ่านของคุณ</p>
          </div>
          {!user ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="border border-orange-200 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="border border-orange-200 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg py-2 transition shadow"
              >
                เข้าสู่ระบบ
              </button>
              {error && <p className="mt-2 text-red-600 text-center">{error}</p>}
            </form>
          ) : (
            <div className="text-xl text-green-700 font-semibold text-center">
              สวัสดีคุณ {user} ยินดีต้อนรับเข้าสู่ระบบ!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
