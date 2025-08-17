export type SelectedOptions = Record<string, string>

export type CartItem = {
  _id: string
  name: string
  price: number
  image?: string
  images?: string[]
  quantity: number
  selectedOptions?: SelectedOptions
  discountPercent?: number
}

const KEY = 'cart_v2' // bump version

function keyOf(p: Pick<CartItem, '_id' | 'selectedOptions'>) {
  const opt = p.selectedOptions ? JSON.stringify(Object.keys(p.selectedOptions).sort().reduce((o,k)=>{ o[k]=p.selectedOptions![k]; return o },{} as any)) : '{}'
  return `${p._id}::${opt}`
}

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

function save(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export const CartManager = {
  getCart(): CartItem[] {
    return load()
  },

  addProduct(product: any, quantity = 1) {
    const items = load()
    const item: CartItem = {
      _id: product._id,
      name: product.name,
      price: Math.round(
        product.discountPercent ? product.price * (1 - product.discountPercent / 100) : product.price
      ),
      image: product.image,
      images: product.images,
      quantity,
      selectedOptions: product.selectedOptions || undefined,
      discountPercent: product.discountPercent
    }
    const k = keyOf(item)
    const idx = items.findIndex(it => keyOf(it) === k)
    if (idx >= 0) items[idx].quantity += quantity
    else items.push(item)
    save(items)
  },

  isInCart(productId: string, selectedOptions?: SelectedOptions) {
    const k = keyOf({ _id: productId, selectedOptions })
    return load().some(it => keyOf(it) === k)
  },

  getItemQuantity(productId: string, selectedOptions?: SelectedOptions) {
    const k = keyOf({ _id: productId, selectedOptions })
    const it = load().find(it => keyOf(it) === k)
    return it?.quantity || 0
  },

  updateQuantity(productId: string, selectedOptions: SelectedOptions | undefined, q: number) {
    const items = load()
    const k = keyOf({ _id: productId, selectedOptions })
    const idx = items.findIndex(it => keyOf(it) === k)
    if (idx >= 0) {
      items[idx].quantity = Math.max(1, q)
      save(items)
    }
  },

  remove(productId: string, selectedOptions?: SelectedOptions) {
    const items = load().filter(it => keyOf(it) !== keyOf({ _id: productId, selectedOptions }))
    save(items)
  },

  clear() { save([]) }
}
