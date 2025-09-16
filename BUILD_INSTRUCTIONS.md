# 🚀 Standalone Build Instructions

## การเตรียมการสำหรับ Standalone Build

### 1. ตรวจสอบการตั้งค่า
- ✅ `next.config.ts` มี `output: "standalone"` แล้ว
- ✅ Package.json มี scripts ที่จำเป็นแล้ว
- ✅ Environment variables พร้อมแล้ว

### 2. การ Build

คุณสามารถเลือกใช้คำสั่งใดคำสั่งหนึ่ง:

```bash
# Basic build
npm run build

# Build สำหรับ standalone (แนะนำ)
npm run build:standalone

# Build แบบ safe (ใช้ memory มากขึ้น)
npm run build:safe
```

### 3. ไฟล์ที่จะได้หลัง Build

หลังจาก build แล้วจะได้:
- `.next/standalone/` - โฟลเดอร์ที่พร้อม deploy
- `.next/static/` - Static assets
- `public/` - Public files

### 4. การรัน Standalone Build

#### แบบ Local Testing:
```bash
npm run start:standalone
```

#### แบบ Production:
```bash
# คัดลอก environment variables
cp .env.production.example .env.production
# แก้ไขค่าใน .env.production ให้เหมาะสม

# รัน standalone server
cd .next/standalone
node server.js
```

### 5. การ Deploy

#### แบบ Manual:
1. คัดลอกไฟล์เหล่านี้ไปยัง production server:
   - โฟลเดอร์ `.next/standalone/` ทั้งหมด
   - โฟลเดอร์ `.next/static/` → `.next/static/`
   - โฟลเดอร์ `public/` → `public/`
   - โฟลเดอร์ `src/generated/` → `src/generated/`

2. ตั้งค่า environment variables ใน production
3. รันคำสั่ง: `node server.js`

#### แบบ Docker:
```bash
# Build Docker image
docker build -t th-thai-shop .

# Run Docker container
docker run -p 3000:3000 --env-file .env.production th-thai-shop
```

### 6. Environment Variables สำหรับ Production

สร้างไฟล์ `.env.production` โดยใช้ `.env.production.example` เป็นแม่แบบ:

```bash
cp .env.production.example .env.production
```

แล้วแก้ไขค่าเหล่านี้:
- `DATABASE_URL` - URL ของ database ใน production
- `NEXTAUTH_SECRET` - Secret key ที่ปลอดภัย
- `NEXT_PUBLIC_SITE_URL` - URL ของเว็บไซต์ใน production

### 7. ข้อควรระวัง

- ตรวจสอบให้แน่ใจว่า database สามารถเชื่อมต่อได้จาก production server
- ตั้งค่า firewall ให้อนุญาต port 3000 (หรือ port ที่ใช้)
- ใช้ reverse proxy (nginx/apache) สำหรับ production จริง
- ตั้งค่า SSL certificate สำหรับ HTTPS

### 8. คำสั่งที่เป็นประโยชน์

```bash
# ตรวจสอบขนาดของ build
du -sh .next/

# ตรวจสอบ bundle size
npm run build && npx @next/bundle-analyzer

# ทดสอบ production build ก่อน deploy
npm run build:standalone && npm run start:standalone
```

### 9. Troubleshooting

หากมีปัญหา:
1. ลบ `.next` และ `node_modules` แล้ว build ใหม่
2. ตรวจสอบ logs ใน console
3. ตรวจสอบ network connectivity ไปยัง database
4. ตรวจสอบ environment variables

---

**🎉 พร้อมแล้ว! คุณสามารถกด build ได้เลย**