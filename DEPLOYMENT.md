# 🚀 การ Deploy แอปพลิเคชัน TH-THAI SHOP

## 📋 ข้อมูลการ Build ล่าสุด
- **วันที่**: 17 กันยายน 2025
- **เวอร์ชัน**: Next.js 15.4.5 (Turbopack)
- **ปัญหาที่แก้ไข**: PATCH method สำหรับการอัพเดตสถานะคำสั่งซื้อ

## 📁 ไฟล์ที่ต้อง Deploy

### **Standalone Build**
```
.next/standalone/
├── server.js              # Main server file
├── .next/                 # Build output
├── src/                   # Source code
├── prisma/                # Database schema
├── public/                # Static assets
├── node_modules/          # Dependencies
└── package.json           # Package info
```

## 🔧 วิธีการ Deploy

### **1. คัดลอกไฟล์ทั้งหมดจาก `.next/standalone/`**
```bash
# Upload all files from .next/standalone/ to your server
rsync -avz .next/standalone/ your-server:/path/to/app/
```

### **2. ตั้งค่า Environment Variables**
```bash
# บนเซิร์ฟเวอร์
export DATABASE_URL="mysql://username:password@host:3306/database"
export PORT=3000
export HOSTNAME=0.0.0.0
```

### **3. รันแอปพลิเคชัน**
```bash
cd /path/to/app
node server.js
```

### **4. สำหรับ PM2 (แนะนำ)**
```bash
pm2 start server.js --name "th-thai-shop"
pm2 save
pm2 startup
```

## 🐳 Docker Deployment

### **Dockerfile Example**
```dockerfile
FROM node:18-alpine
WORKDIR /app

# Copy standalone build
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

# Run
CMD ["node", "server.js"]
```

### **Build & Run**
```bash
docker build -t th-thai-shop .
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  th-thai-shop
```

## ✅ การแก้ไขในเวอร์ชันนี้

### **1. PATCH Method Support**
- ✅ เพิ่ม `export async function PATCH` ใน `/api/orders`
- ✅ รองรับการอัพเดตสถานะคำสั่งซื้อ
- ✅ รองรับการอัพเดตเลขติดตาม (tracking number)

### **2. Order Status Management**
- ✅ Admin panel สามารถอัพเดตสถานะได้
- ✅ Seller panel สามารถอัพเดตสถานะได้
- ✅ รองรับสถานะ: pending, processing, shipped, paid, completed, cancelled

### **3. API Endpoints ที่ทำงาน**
- ✅ `GET /api/orders` - ดึงรายการคำสั่งซื้อ
- ✅ `POST /api/orders` - สร้างคำสั่งซื้อใหม่
- ✅ `PUT /api/orders` - อัพเดตคำสั่งซื้อ
- ✅ `PATCH /api/orders` - อัพเดตคำสั่งซื้อ (เหมือน PUT)
- ✅ `DELETE /api/orders` - ลบคำสั่งซื้อ

## 🔍 การทดสอบหลัง Deploy

### **1. ทดสอบ API**
```bash
# ทดสอบการอัพเดตสถานะ
curl -X PATCH "https://your-domain.com/api/orders" \
  -H "Content-Type: application/json" \
  -d '{"id":"1","status":"shipped","shippingNumber":"TH123456789"}'
```

### **2. ทดสอบ Admin Panel**
- เข้า `/admin/orders`
- ลองอัพเดตสถานะคำสั่งซื้อ
- ตรวจสอบว่าไม่มี 405 Method Not Allowed error

### **3. ทดสอบ Seller Panel**
- เข้า `/seller/orders`
- ลองอัพเดตสถานะและเลขติดตาม
- ตรวจสอบการบันทึกข้อมูล

## 🚨 หากยังพบปัญหา 405 Error

### **1. ตรวจสอบ Server**
```bash
# ตรวจสอบว่า server รันอยู่
ps aux | grep node

# ตรวจสอบ log
tail -f /var/log/your-app.log
```

### **2. Restart Application**
```bash
# สำหรับ PM2
pm2 restart th-thai-shop

# สำหรับ Docker
docker restart container-name

# สำหรับ Systemd
systemctl restart your-app
```

### **3. ตรวจสอบการ Deploy**
- ✅ ไฟล์ `.next/standalone/src/app/api/orders/route.ts` มี PATCH method
- ✅ Environment variables ถูกตั้งค่า
- ✅ Database เชื่อมต่อได้
- ✅ Port ไม่ถูกบล็อก

## 📞 Support
หากพบปัญหา กรุณาตรวจสอบ:
1. Server logs
2. Database connection
3. Environment variables
4. File permissions

---
**หมายเหตุ**: Build นี้ใช้ Turbopack ซึ่งยังอยู่ในขั้น experimental แต่ทำงานได้ดีสำหรับ production