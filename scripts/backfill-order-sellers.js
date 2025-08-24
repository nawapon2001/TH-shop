#!/usr/bin/env node
/**
 * Migration helper: Backfill `items.seller` in `orders` collection.
 *
 * - Dry-run by default. Use --apply to persist changes.
 * - Strategy:
 *   1. Load all `seller_products` and build maps by _id and by normalized name.
 *   2. Scan `orders` collection. For each item missing `.seller`:
 *      - if item.productId exists and matches a seller_product._id -> set seller
 *      - else if item.name matches a single seller_product name -> set seller
 *      - otherwise leave unchanged and report ambiguous
 *
 * Usage (bash):
 *   export MONGO_URI="your-mongo-uri"
 *   node scripts/backfill-order-sellers.js         # dry-run
 *   node scripts/backfill-order-sellers.js --apply   # perform updates
 */

const { MongoClient, ObjectId } = require('mongodb')

function parseArgs() {
  const args = process.argv.slice(2)
  return {
    apply: args.includes('--apply'),
    limit: (() => {
      const arg = args.find(a => a.startsWith('--limit='))
      if (!arg) return undefined
      const v = Number(arg.split('=')[1])
      return Number.isFinite(v) && v > 0 ? v : undefined
    })(),
  }
}

async function main() {
  const { apply, limit } = parseArgs()
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || ''
  if (!MONGO_URI) {
    console.error('MONGO_URI or MONGODB_URI env var is required. Set it and re-run.')
    process.exit(1)
  }

  const client = new MongoClient(MONGO_URI, { maxPoolSize: 10 })
  await client.connect()
  const db = client.db()

  console.log('Connected to MongoDB. Loading seller products...')
  const sellerProducts = await db.collection('seller_products').find({}).toArray()
  const byId = {}
  const byName = {}
  for (const p of sellerProducts) {
    const id = String(p._id)
    const uname = p.username || p.username === 0 ? String(p.username) : null
    byId[id] = uname
    if (p.name) {
      const key = String(p.name).toLowerCase().trim()
      byName[key] = byName[key] || new Set()
      if (uname) byName[key].add(uname)
    }
  }

  console.log(`Loaded ${sellerProducts.length} seller_products`)

  const ordersColl = db.collection('orders')
  const cursor = ordersColl.find({}).batchSize(100)

  let scanned = 0
  let itemsSeen = 0
  let itemsPatched = 0
  let ordersUpdated = 0
  let ambiguousMatches = 0
  const examples = []

  while (await cursor.hasNext()) {
    if (limit && scanned >= limit) break
    const order = await cursor.next()
    scanned++
    let changed = false
    const newItems = (order.items || []).map((it) => {
      itemsSeen++
      // ensure plain object
      const item = Object.assign({}, it)
      if (!item.seller) {
        // try productId match
        if (item.productId && byId[String(item.productId)]) {
          item.seller = byId[String(item.productId)]
          changed = true
          itemsPatched++
        } else if (item.name) {
          const key = String(item.name).toLowerCase().trim()
          const set = byName[key]
          if (set && set.size === 1) {
            item.seller = Array.from(set)[0]
            changed = true
            itemsPatched++
          } else if (set && set.size > 1) {
            ambiguousMatches++
          }
        }
      }
      return item
    })

    if (changed) {
      if (apply) {
        await ordersColl.updateOne({ _id: order._id }, { $set: { items: newItems, updatedAt: new Date() } })
        ordersUpdated++
        if (examples.length < 5) examples.push({ orderId: String(order._id), updatedItems: newItems.filter(i=>i.seller) })
      } else {
        // dry-run counts only
        ordersUpdated++
        if (examples.length < 5) examples.push({ orderId: String(order._id), wouldUpdate: newItems.filter(i=>i.seller) })
      }
    }
  }

  console.log('\nSummary:')
  console.log(` Orders scanned:      ${scanned}`)
  console.log(` Items seen:          ${itemsSeen}`)
  console.log(` Items that would be/were patched: ${itemsPatched}`)
  console.log(` Orders that would be/were updated: ${ordersUpdated}`)
  console.log(` Ambiguous name matches: ${ambiguousMatches}`)
  console.log(` Mode: ${apply ? 'APPLY (changes written)' : 'DRY-RUN (no changes)'}`)
  if (examples.length) {
    console.log('\nExamples:')
    console.log(JSON.stringify(examples, null, 2))
  }

  await client.close()
  console.log('\nDone.')
}

main().catch(err => {
  console.error('Migration failed', err)
  process.exit(2)
})
