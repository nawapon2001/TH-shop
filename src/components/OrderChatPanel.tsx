'use client'

import React, { useEffect, useRef, useState } from 'react'

type ChatMsg = { role: 'shop' | 'customer'; text: string; createdAt: string }

export default function OrderChatPanel({ orderId }: { orderId: string | null }) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    )
  }

  const fetchMessages = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/messages?orderId=${id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setMessages(Array.isArray(data.messages) ? data.messages : [])
    } catch (e) {
      setError('โหลดแชทไม่สำเร็จ')
    }
  }

  // เมื่อเปลี่ยน orderId -> โหลดใหม่ + เริ่ม poll
  useEffect(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    setMessages([])
    setError('')
    if (!orderId) return

    setLoading(true)
    fetchMessages(orderId).finally(() => setLoading(false))
    pollRef.current = setInterval(() => fetchMessages(orderId), 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [orderId])

  useEffect(() => { scrollToBottom() }, [messages.length])

  const send = async () => {
    if (!orderId || !input.trim()) return
    const text = input.trim()
    setInput('')

    // optimistic
    const optimistic: ChatMsg = { role: 'shop', text, createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, optimistic])

    try {
      const res = await fetch('/api/orders/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, message: text, role: 'shop' }),
      })
      if (!res.ok) throw new Error()
      // ให้ polling ดึงเวอร์ชันสุดท้ายจากเซิร์ฟเวอร์อยู่แล้ว
    } catch {
      // roll back
      setMessages(prev => prev.filter(m => !(m.role === 'shop' && m.text === text && Math.abs(new Date(m.createdAt).getTime() - Date.now()) < 5000)))
      setError('ส่งไม่สำเร็จ')
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {!orderId ? (
        <div className="flex-1 grid place-items-center p-6 text-center text-slate-500">
          เลือกออเดอร์ทางฝั่งกลางเพื่อเริ่มสนทนา
        </div>
      ) : (
        <>
          <div className="px-4 py-3 border-b border-orange-200 flex items-center gap-2">
            <div className="font-extrabold text-orange-700">แชทลูกค้า</div>
            <span className="ml-auto text-xs text-slate-600">#{orderId.slice(-6)}</span>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {loading && <div className="text-xs text-slate-500">กำลังโหลด…</div>}
            {error && <div className="text-xs text-red-600">{error}</div>}
            {messages.map((m, i) => (
              <div key={`${m.id || m.createdAt}-${i}`} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow ${m.role==='shop' ? 'ml-auto bg-orange-600 text-white' : 'bg-white border border-orange-200 text-slate-800'}`}>
                <div>{m.text}</div>
                <div className={`mt-1 text-[10px] ${m.role==='shop' ? 'text-white/80' : 'text-slate-500'}`}>
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-orange-200">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter') send() }}
                placeholder="พิมพ์ข้อความถึงลูกค้า…"
                className="flex-1 h-10 rounded-xl border border-orange-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button onClick={send} className="h-10 px-4 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700">
                ส่ง
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
