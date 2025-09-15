# คำแนะนำการแก้ไขการเชื่อมต่อฐานข้อมูล MySQL

## ปัญหาที่พบ
แม้จะเปลี่ยนรหัสผ่านเป็น `BAwfp7UXbXWAYC8uRakV` แล้ว ยังคงได้ `Access denied`

## ขั้นตอนแก้ไขใน cPanel

### 1. ตรวจสอบ MySQL Users
ไปที่ cPanel → MySQL Databases → Current Users

**ตรวจสอบ:**
- มี user `thth_thaish_Data` หรือไม่?
- Host ของ user นี้เป็นอะไร? (localhost, %, หรือ IP specific)

### 2. สร้าง User ใหม่สำหรับ Remote Access
**ในส่วน "Add New User":**
```
Username: remote_user
Password: BAwfp7UXbXWAYC8uRakV
```

**หรือแก้ไข user เดิม:**
- คลิก Edit ที่ user `thth_thaish_Data`
- เปลี่ยน Host จาก `localhost` เป็น `%` หรือ `223.204.171.235`

### 3. ตรวจสอบ Remote MySQL Access
ไปที่ cPanel → Remote MySQL

**ตรวจสอบ:**
- มี IP `223.204.171.235` ใน Access Host List หรือไม่?
- หรือมี `%` สำหรับอนุญาตทุก IP

**ถ้าไม่มี ให้เพิ่ม:**
```
223.204.171.235
```

### 4. ตรวจสอบ Database Privileges
ไปที่ cPanel → MySQL Databases → Current Databases

**ตรวจสอบ:**
- User `thth_thaish_Data` มี Privileges บน database `thth_thaish_Data` หรือไม่?

**ถ้าไม่มี ให้เพิ่ม:**
- เลือก User: `thth_thaish_Data`
- เลือก Database: `thth_thaish_Data`
- คลิก "Add User to Database"
- เลือก "ALL PRIVILEGES"

### 5. ทดสอบผ่าน phpMyAdmin
- ไปที่ https://th-thai.shop/phpmyadmin
- ลองล็อกอินด้วย:
  - Username: `thth_thaish_Data`
  - Password: `BAwfp7UXbXWAYC8uRakV`

## SQL Commands สำหรับแก้ไข (ถ้าเข้า SSH ได้)

```sql
-- เข้า MySQL
mysql -u root -p

-- สร้าง user สำหรับ remote access
CREATE USER 'thth_thaish_Data'@'%' IDENTIFIED BY 'BAwfp7UXbXWAYC8uRakV';

-- ให้สิทธิ์เข้าถึงฐานข้อมูล
GRANT ALL PRIVILEGES ON thth_thaish_Data.* TO 'thth_thaish_Data'@'%';

-- ให้สิทธิ์สำหรับ IP เฉพาะ
GRANT ALL PRIVILEGES ON thth_thaish_Data.* TO 'thth_thaish_Data'@'223.204.171.235' IDENTIFIED BY 'BAwfp7UXbXWAYC8uRakV';

-- รีเฟรช privileges
FLUSH PRIVILEGES;

-- ตรวจสอบ users
SELECT User, Host FROM mysql.user WHERE User = 'thth_thaish_Data';
```

## ทางเลือกอื่น

### ใช้ Local Database สำหรับ Development
```bash
# ติดตั้ง XAMPP
# เปลี่ยน .env เป็น:
DATABASE_URL="mysql://root:@localhost:3306/signshop_local"

# ทดสอบ
npm run db:local
```

### ใช้ Cloud Database
**PlanetScale (ฟรี):**
1. ไปที่ https://planetscale.com
2. สร้างบัญชีฟรี
3. สร้างฐานข้อมูลใหม่
4. Copy connection string

**Railway (ฟรี):**
1. ไปที่ https://railway.app
2. สร้าง MySQL database
3. Copy connection string

## ขั้นตอนถัดไป
1. **แก้ไขใน cPanel** ตามขั้นตอนข้างบน
2. **ทดสอบใหม่** ด้วย `npm run db:test-cred`
3. **หากยังไม่ได้** ให้ใช้ local database ก่อน
4. **Deploy** บน production ทีหลัง
