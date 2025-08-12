# MongoDB Atlas Quick Setup Checklist

## ✅ สร้างการเชื่อมต่อ MongoDB Atlas ใน 5 นาที

### 1. ตั้งค่า MongoDB Atlas
- [ ] สร้าง account บน [MongoDB Atlas](https://www.mongodb.com/atlas/database)
- [ ] สร้าง cluster (เลือก "Shared" ฟรี tier)
- [ ] ตั้งค่า Network Access (0.0.0.0/0 สำหรับ dev)
- [ ] สร้าง Database User (จด username/password ไว้)

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` ใน root directory:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/signshop?retryWrites=true&w=majority
```

### 3. ทดสอบการเชื่อมต่อ
รันเซิร์ฟเวอร์:
```bash
npm run dev
```

### 4. ตรวจสอบการเชื่อมต่อ
เปิด browser ไปที่:
- `http://localhost:3000/api/products` - ควรแสดงรายการสินค้า
- `http://localhost:3000/api/categories` - ควรแสดงหมวดหมู่

### 5. ตัวอย่าง Connection String
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/signshop?retryWrites=true&w=majority
```

### 📋 สิ่งที่ต้องแก้ไข:
1. แทนที่ `<username>` และ `<password>` ด้วยข้อมูลจริง
2. แทนที่ `cluster0.abc123` ด้วย cluster name ของคุณ
3. ตรวจสอบว่า `.env.local` อยู่ใน `.gitignore`

### 🔧 ไฟล์ที่ถูกอัปเดตแล้ว:
- ✅ `src/lib/mongodb.ts` - รองรับ MongoDB Atlas
- ✅ `src/models/` - ทุก models พร้อมใช้งาน
- ✅ `MONGODB_ATLAS_SETUP.md` - คู่มือฉบับเต็ม
- ✅ `QUICK_SETUP_CHECKLIST.md` - ตรวจสอบรวดเร็ว

---

**หลังจากทำตาม checklist นี้ ระบบจะพร้อมใช้งานกับ MongoDB Atlas ทันที!**
