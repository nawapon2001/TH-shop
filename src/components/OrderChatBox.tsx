'use client'
import React, { useEffect, useRef, useState } from 'react'
import { MessageCircle, Loader2, X } from 'lucide-react'

type ChatMsg = { role: 'shop'|'customer'; text: string; createdAt: string }

function mergeMessages(prev: ChatMsg[], incoming: ChatMsg[]) {
  // ใช้ key จาก text + createdAt ชั่วคราวเพื่อ dedupe
  const seen = new Set<string>()
  const keep: ChatMsg[] = []
  for (const m of [...prev, ...incoming]) {
    const k = `${m.role}|${m.text}|${new Date(m.createdAt).getTime()}`
    if (!seen.has(k)) { seen.add(k); keep.push(m) }
  }
  // เรียงตามเวลาเก่า -> ใหม่
  keep.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  return keep
}

export default function OrderChatBox({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef<any>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = (smooth = false) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      })
    })
  }

  const load = async () => {
    if (!orderId) return
    try {
      setFetching(true)
      const res = await fetch(`/api/orders/messages?orderId=${orderId}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'load error')
      const incoming: ChatMsg[] = (Array.isArray(data.messages) ? data.messages : []).map((m: any) => ({
        role: m.role,
        text: m.text,
        createdAt: m.createdAt || new Date().toISOString(),
      }))
      // MERGE แทนการ set ทับ
      setMessages(prev => mergeMessages(prev, incoming))
      scrollToBottom()
    } catch (e: any) {
      setError(e?.message || 'เกิดข้อผิดพลาดในการโหลดแชท')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    load()
    pollRef.current = setInterval(load, 3000) // poll ทุก 3 วิ
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [open])

  const send = async () => {
    if (!input.trim() || !orderId) return
    const optimistic: ChatMsg = { role: 'customer', text: input.trim(), createdAt: new Date().toISOString() }

    // โชว์ทันที (optimistic)
    setMessages(prev => mergeMessages(prev, [optimistic]))
    setInput('')
    scrollToBottom(true)

    try {
      setLoading(true)
      const res = await fetch('/api/orders/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, message: optimistic.text, role: 'customer' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'ส่งข้อความไม่สำเร็จ')

      // ไม่ต้อง load ทันที ปล่อยให้รอบ poll ถัดไปดึงกลับมา
      // แต่ถ้าอยากชัวร์มากขึ้น จะ setTimeout(load, 500) ก็ได้
      // setTimeout(load, 500)
    } catch (e: any) {
      // ถ้าสendพลาด เอา optimistic ออก
      setMessages(prev =>
        prev.filter(m =>
          !(m.role === optimistic.role &&
            m.text === optimistic.text &&
            new Date(m.createdAt).getTime() === new Date(optimistic.createdAt).getTime())
        )
      )
      alert(e?.message || 'ส่งข้อความไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(true)}
        disabled={!orderId}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 disabled:opacity-60"
      >
        <MessageCircle className="w-4 h-4" /> แชทกับร้าน
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 p-4">
          <div className="mx-auto max-w-md h-[70vh] rounded-2xl bg-white shadow-xl flex flex-col">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-orange-700" />
              <div className="font-bold text-orange-700">แชทกับร้าน</div>
              <span className="ml-auto text-xs text-slate-600">#{orderId?.slice?.(-6)}</span>
              <button onClick={() => setOpen(false)} className="ml-2 text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {!!error && <div className="text-xs text-red-600">{error}</div>}
              {fetching && !messages.length ? (
                <div className="text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลดแชท…
                </div>
              ) : null}
              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}-${m.createdAt}`}
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow ${
                    m.role === 'customer'
                      ? 'ml-auto bg-orange-600 text-white'
                      : 'bg-white border border-orange-200 text-slate-800'
                  }`}
                >
                  <div>{m.text}</div>
                  <div className={`mt-1 text-[10px] ${m.role === 'customer' ? 'text-white/80' : 'text-slate-500'}`}>
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') send() }}
                  placeholder="พิมพ์ข้อความ…"
                  className="flex-1 h-10 rounded-xl border border-orange-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                />
                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className="h-10 px-4 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ส่ง'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
