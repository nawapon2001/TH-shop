export function getProductId(p: any): string {
  // prefer _id, then id, then fallback to empty string
  const id = p && (p._id ?? p.id ?? p.productId ?? '')
  return id ? String(id) : ''
}

export function safeProductHref(p: any): string {
  const id = getProductId(p)
  return id ? `/product/${encodeURIComponent(id)}` : '#'
}
