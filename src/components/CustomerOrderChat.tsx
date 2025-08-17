'use client'

import React, { useEffect, useRef, useState } from 'react'

type ChatMsg = { role: 'shop' | 'customer'; text: string; createdAt: string }

export default function CustomerOrderChat({ orderId }: { orderId: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => requestAnimationFrame(
    () => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  )

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/orders/messages?orderId=${orderId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setMessages(Array.isArray(data.messages) ? data.messages : [])
    } catch (e) {
      setError('โหลดแชทไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMessages([]); setError(''); setLoading(true)
    fetchMessages()
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(fetchMessages, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [orderId])

  useEffect(() => { scrollToBottom() }, [messages.length])

  const send = async () => {
    if (!input.trim()) return
    const text = input.trim()
    setInput('')

    const optimistic: ChatMsg = { role: 'customer', text, createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, optimistic])

    try {
      const res = await fetch('/api/orders/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, message: text, role: 'customer' }),
      })
      if (!res.ok) throw new Error()
      // ปล่อยให้ polling sync
    } catch (e) {
      setMessages(prev => prev.filter(m => !(m.role==='customer' && m.text===text && Math.abs(new Date(m.createdAt).getTime() - Date.now()) < 5000)))
      setError('ส่งไม่สำเร็จ')
    }
  }

  return (
    <div className="rounded-xl border border-orange-100 bg-white">
      <div className="px-4 py-3 border-b border-orange-100 font-bold text-orange-700">แชทกับร้าน</div>

      <div ref={listRef} className="max-h-80 overflow-y-auto px-4 py-3 space-y-2">
        {loading && <div className="text-xs text-slate-500">กำลังโหลด…</div>}
        {error && <div className="text-xs text-red-600">{error}</div>}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow ${m.role==='customer' ? 'ml-auto bg-orange-600 text-white' : 'bg-white border border-orange-200 text-slate-800'}`}>
            <div>{m.text}</div>
            <div className={`mt-1 text-[10px] ${m.role==='customer' ? 'text-white/80' : 'text-slate-500'}`}>
              {new Date(m.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-orange-100">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter') send() }}
            placeholder="พิมพ์ข้อความถึงร้าน…"
            className="flex-1 h-10 rounded-xl border border-orange-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button onClick={send} className="h-10 px-4 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700">ส่ง</button>
        </div>
      </div>
    </div>
  )
}
