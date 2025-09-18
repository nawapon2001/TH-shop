'use client'

import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

/*
  New admin management page (local/demo)
  - Reads/writes admin list using localStorage key 'adminUsers'
  - Minimal UI: add user, list users, remove user (prevent remove last)
*/

type AdminCred = { username: string; password: string }

const ADMIN_STORE_KEY = 'adminUsers'
const loadAdmins = (): AdminCred[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(ADMIN_STORE_KEY) : null
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((u: any) => u && typeof u.username === 'string' && typeof u.password === 'string')) {
      return parsed
    }
    return []
  } catch { return [] }
}
const saveAdmins = (list: AdminCred[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_STORE_KEY, JSON.stringify(list))
}

export default function AdminsPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<AdminCred[]>([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // Update document title
  useEffect(() => {
    document.title = 'จัดการผู้ดูแล | TH-THAI SHOP'
  }, [])

  useEffect(() => {
    // Try to fetch admins from server API; fallback to localStorage
    let mounted = true
    const fetchAdmins = async () => {
      try {
        const res = await fetch('/api/admin-users')
        if (!res.ok) throw new Error('api error')
        const data = await res.json()
        // transform to local AdminCred shape if possible
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((u: any) => ({ username: String(u.username), password: '' }))
          if (mounted) { setAdmins(mapped); saveAdmins(mapped) }
          return
        }
      } catch {
        // ignore and fallback to localStorage
      }

      const list = loadAdmins()
      if (list.length === 0) {
        const seed = [{ username: 'admin', password: 'admin123' }]
        saveAdmins(seed)
        if (mounted) setAdmins(seed)
      } else {
        if (mounted) setAdmins(list)
      }
    }
    fetchAdmins()
    return () => { mounted = false }
  }, [])

  const addAdmin = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    const u = username.trim(); const p = password.trim()
    if (!u || !p) { setError('กรุณากรอกชื่อและรหัสผ่าน'); return }
    if (u.length < 4 || p.length < 4) { setError('ความยาวอย่างน้อย 4 ตัวอักษร'); return }
    if (admins.some(a => a.username.toLowerCase() === u.toLowerCase())) { setError('ชื่อผู้ใช้ซ้ำ'); return }
    // Try to persist via API; fallback to localStorage
    (async () => {
      try {
        const res = await fetch('/api/admin-users', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: u, password: p }) })
        if (res.ok) {
          // server created -> reload from server (or optimistic add)
          const next = [...admins, { username: u, password: '' }]
          saveAdmins(next); setAdmins(next)
          setUsername(''); setPassword('')
          return Swal.fire({ icon: 'success', title: 'เพิ่มผู้ดูแลแล้ว', timer: 1000, showConfirmButton: false })
        }
        // otherwise fallback to local persistence
      } catch {
        // fallback
      }
      const next = [...admins, { username: u, password: p }]
      saveAdmins(next); setAdmins(next); setUsername(''); setPassword('')
      Swal.fire({ icon: 'success', title: 'เพิ่มผู้ดูแลแล้ว (local)', timer: 1000, showConfirmButton: false })
    })()
  }

  const removeAdmin = async (u: string) => {
    if (admins.length <= 1) {
      Swal.fire({ icon: 'warning', title: 'ลบไม่ได้', text: 'ต้องมีผู้ดูแลอย่างน้อย 1 คน' }); return
    }
    const ok = await Swal.fire({ icon: 'warning', title: `ลบผู้ดูแล "${u}" ?`, showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' })
    if (!ok.isConfirmed) return
    // Try API delete by username, fallback to local
    try {
      const res = await fetch(`/api/admin-users?username=${encodeURIComponent(u)}`, { method: 'DELETE' })
      if (res.ok) {
        const next = admins.filter(a => a.username !== u)
        saveAdmins(next); setAdmins(next)
        return Swal.fire({ icon: 'success', title: 'ลบแล้ว', timer: 800, showConfirmButton: false })
      }
  } catch {}

    const next = admins.filter(a => a.username !== u)
    saveAdmins(next); setAdmins(next)
    Swal.fire({ icon: 'success', title: 'ลบแล้ว (local)', timer: 800, showConfirmButton: false })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-orange-700"><ArrowLeft className="w-4 h-4" /> ย้อนกลับ</button>
          <h1 className="text-2xl font-bold text-orange-700">จัดการผู้ดูแลระบบ</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-2xl border border-orange-200">
            <h3 className="font-semibold text-orange-700 mb-3">สร้างผู้ดูแลใหม่</h3>
            <form onSubmit={addAdmin} className="grid gap-3">
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="ชื่อผู้ใช้" className="border border-orange-200 rounded-xl p-3" />
              <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="รหัสผ่าน" type="password" className="border border-orange-200 rounded-xl p-3" />
              <div className="flex items-center gap-3">
                <button type="submit" className="h-10 px-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white font-semibold shadow">เพิ่ม</button>
                {error && <div className="text-sm text-red-600">{error}</div>}
              </div>
              <p className="text-xs text-slate-500 mt-2">* เดโมนี้เก็บผู้ดูแลไว้ใน localStorage ของเบราว์เซอร์</p>
            </form>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-orange-200">
            <h3 className="font-semibold text-orange-700 mb-3">รายชื่อผู้ดูแล (local)</h3>
            <div className="divide-y">
              {admins.map((a, idx) => (
                <div key={a.username} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{a.username}</div>
                    <div className="text-xs text-slate-500">ID: {idx + 1}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { navigator.clipboard?.writeText(a.username); Swal.fire({ icon: 'success', title: 'คัดลอกแล้ว', showConfirmButton: false, timer: 800 }) }} className="px-3 py-1 rounded-full bg-white border border-orange-200 text-orange-700 text-sm">คัดลอก</button>
                    <button onClick={() => removeAdmin(a.username)} className="px-3 py-1 rounded-full bg-red-600 text-white text-sm">ลบ</button>
                  </div>
                </div>
              ))}
              {admins.length === 0 && <div className="py-2 text-sm text-slate-500">ยังไม่มีผู้ดูแลระบบ</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
