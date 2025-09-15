# วิธีแก้ปัญหาการเชื่อมต่อฐานข้อมูล th-thai.shop

## ปัญหาที่พบ
- ✅ เซิร์ฟเวอร์ th-thai.shop ตอบสนอง (IP: 15.235.227.117)
- ✅ MySQL port 3306 เปิดอยู่
- ❌ **Access denied** - user ไม่มีสิทธิ์เข้าถึงจาก IP ภายนอก (223.204.171.235)

## วิธีแก้ไข

### 1. เข้าไป cPanel/WHM ของเว็บ th-thai.shop
- ไปที่ MySQL Databases หรือ Remote MySQL
- เพิ่ม IP address: `223.204.171.235` ใน Remote MySQL Access Hosts
- หรือเพิ่ม `%` สำหรับอนุญาตทุก IP (ไม่แนะนำเพื่อความปลอดภัย)

### 2. ใช้ SSH เข้าเซิร์ฟเวอร์แล้วรันคำสั่ง MySQL
```sql
-- เข้า MySQL ในเซิร์ฟเวอร์
mysql -u root -p

-- อนุญาตให้ user เข้าถึงจาก IP ภายนอก
GRANT ALL PRIVILEGES ON thth_thaish_Data.* TO 'thth_thaish_Data'@'223.204.171.235' IDENTIFIED BY '1314Ninja';

-- หรือสร้าง user ใหม่สำหรับ remote access
CREATE USER 'thth_thaish_Data'@'%' IDENTIFIED BY '1314Ninja';
GRANT ALL PRIVILEGES ON thth_thaish_Data.* TO 'thth_thaish_Data'@'%';

-- รีเฟรช privileges
FLUSH PRIVILEGES;

-- ตรวจสอบ user ที่มี
SELECT User, Host FROM mysql.user WHERE User = 'thth_thaish_Data';
```

### 3. แก้ไข my.cnf (ในเซิร์ฟเวอร์)
```ini
# ใน /etc/mysql/my.cnf หรือ /etc/my.cnf
[mysqld]
bind-address = 0.0.0.0  # อนุญาตการเชื่อมต่อจากทุก IP
# แทนที่ bind-address = 127.0.0.1
```

### 4. วิธีง่าย ๆ - ใช้ SSH Tunnel
```bash
# สร้าง SSH tunnel ไปยังเซิร์ฟเวอร์
ssh -L 3306:localhost:3306 user@th-thai.shop

# จากนั้นใช้ localhost ใน connection string
DATABASE_URL="mysql://thth_thaish_Data:1314Ninja@localhost:3306/thth_thaish_Data"
```

### 5. ใช้ phpMyAdmin เพื่อจัดการ
- เข้า https://th-thai.shop/phpmyadmin (ถ้ามี)
- ไปที่ User accounts
- แก้ไข user `thth_thaish_Data`
- เปลี่ยน Host จาก `localhost` เป็น `%` หรือ `223.204.171.235`

## วิธีทดสอบหลังแก้ไข

```bash
# ทดสอบด้วยสคริปต์
node scripts/test-db-connection.js

# หรือทดสอบด้วย Prisma
npm run db:push
```

## ทางเลือกอื่น

### 1. ใช้ฐานข้อมูล Local
```bash
# ติดตั้ง XAMPP
# สร้างฐานข้อมูลใหม่ใน localhost
DATABASE_URL="mysql://root:@localhost:3306/signshop_local"
```

### 2. ใช้ฐานข้อมูล Cloud
```bash
# PlanetScale (ฟรี)
DATABASE_URL="mysql://username:password@aws.connect.psdb.cloud/database?sslaccept=strict"

# Railway (ฟรี)
DATABASE_URL="mysql://root:password@containers-us-west-xxx.railway.app:6543/railway"
```

### 3. Export/Import ข้อมูล
```bash
# Export จากเซิร์ฟเวอร์ (ผ่าน SSH)
mysqldump -u thth_thaish_Data -p thth_thaish_Data > backup.sql

# Import ไปยัง local database
mysql -u root -p signshop_local < backup.sql
```

## คำแนะนำเพิ่มเติม

1. **ติดต่อผู้ดูแลเซิร์ฟเวอร์** ให้เพิ่ม IP หรือเปิด remote access
2. **ใช้ VPN** ที่มี IP อยู่ในช่วงที่อนุญาต
3. **ใช้ SSH tunnel** เป็นวิธีที่ปลอดภัยที่สุด
4. **สร้างฐานข้อมูลใหม่** บน cloud service
