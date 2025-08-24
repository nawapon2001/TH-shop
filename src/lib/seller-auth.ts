// Small helper to centralize seller auth localStorage handling
export function isSellerLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return !!(localStorage.getItem('sellerUser') || localStorage.getItem('sellerToken'))
  } catch {
    return false
  }
}

export function getSellerUsername(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('sellerUser')
    if (!raw) return null
    // iterative decode (handles double-encoding)
    try {
      let cur = raw
      for (let i = 0; i < 5; i++) {
        try {
          const next = decodeURIComponent(cur)
          if (next === cur) break
          cur = next
        } catch { break }
      }
      return cur
    } catch {
      return raw
    }
  } catch { return null }
}

export function setSellerLogin(username: string, token?: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('sellerUser', username)
    if (token) localStorage.setItem('sellerToken', token)
  } catch {}
}

export function logoutSeller() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('sellerUser')
    localStorage.removeItem('sellerToken')
    localStorage.removeItem('sellerProfile')
  } catch {}
}

export default { isSellerLoggedIn, getSellerUsername, setSellerLogin, logoutSeller }
