# คำแนะนำการติดตั้งและตั้งค่า MySQL สำหรับ Windows

## วิธีที่ 1: ติดตั้ง XAMPP (แนะนำสำหรับ Development)

1. **ดาวน์โหลด XAMPP:**
   - ไปที่ https://www.apachefriends.org/download.html
   - ดาวน์โหลดเวอร์ชันล่าสุดสำหรับ Windows

2. **ติดตั้ง XAMPP:**
   - รันไฟล์ installer
   - เลือก Apache, MySQL, และ phpMyAdmin
   - ติดตั้งที่ C:\xampp (default)

3. **เปิด XAMPP Control Panel:**
   - เปิดโปรแกรม XAMPP Control Panel
   - คลิก "Start" ที่ Apache และ MySQL
   - MySQL จะรันที่ port 3306

4. **สร้างฐานข้อมูลและผู้ใช้:**
   - เปิด http://localhost/phpmyadmin
   - สร้างฐานข้อมูลใหม่ชื่อ `thth_thaish_Data`
   - สร้างผู้ใช้ใหม่:
     - Username: `thth_thaish_Data`
     - Password: `1314Ninja`
     - Host: `localhost`
     - ให้สิทธิ์ ALL PRIVILEGES บนฐานข้อมูล `thth_thaish_Data`

## วิธีที่ 2: ติดตั้ง MySQL Server โดยตรง

1. **ดาวน์โหลด MySQL:**
   - ไปที่ https://dev.mysql.com/downloads/mysql/
   - ดาวน์โหลด MySQL Community Server

2. **ติดตั้ง MySQL:**
   - รันไฟล์ installer
   - เลือก "Developer Default" setup
   - ตั้งรหัสผ่าน root

3. **สร้างฐานข้อมูลและผู้ใช้:**
   ```sql
   -- เข้า MySQL Command Line
   mysql -u root -p
   
   -- สร้างฐานข้อมูล
   CREATE DATABASE thth_thaish_Data CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   -- สร้างผู้ใช้
   CREATE USER 'thth_thaish_Data'@'localhost' IDENTIFIED BY '1314Ninja';
   
   -- ให้สิทธิ์
   GRANT ALL PRIVILEGES ON thth_thaish_Data.* TO 'thth_thaish_Data'@'localhost';
   FLUSH PRIVILEGES;
   
   -- ตรวจสอบ
   SHOW DATABASES;
   ```

## วิธีที่ 3: ใช้ Docker (สำหรับผู้ที่มี Docker)

1. **สร้างไฟล์ docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     mysql:
       image: mysql:8.0
       container_name: signshop_mysql
       environment:
         MYSQL_ROOT_PASSWORD: rootpassword
         MYSQL_DATABASE: thth_thaish_Data
         MYSQL_USER: thth_thaish_Data
         MYSQL_PASSWORD: 1314Ninja
       ports:
         - "3306:3306"
       volumes:
         - mysql_data:/var/lib/mysql

   volumes:
     mysql_data:
   ```

2. **รัน Docker:**
   ```bash
   docker-compose up -d
   ```

## หลังจากติดตั้ง MySQL เรียบร้อยแล้ว

1. **ตรวจสอบการเชื่อมต่อ:**
   ```bash
   # ใน terminal ของโปรเจกต์
   npm run db:push
   ```

2. **หากสำเร็จ จะสามารถเปิด Prisma Studio:**
   ```bash
   npm run db:studio
   ```

3. **ทดสอบสร้างข้อมูลตัวอย่าง:**
   ```bash
   node examples/prisma-usage.js
   ```

4. **ย้ายข้อมูลจาก MongoDB (ถ้ามี):**
   ```bash
   # ตั้งค่า MONGODB_URI ใน .env ก่อน
   npm run migrate:mongo-to-mysql
   ```

## การแก้ปัญหาที่พบบ่อย

### ปัญหา: Can't reach database server
- ตรวจสอบว่า MySQL server รันอยู่
- ตรวจสอบ port 3306 ว่าเปิดอยู่
- ตรวจสอบ firewall

### ปัญหา: Access denied
- ตรวจสอบ username/password
- ตรวจสอบสิทธิ์ของผู้ใช้
- ตรวจสอบ host ที่อนุญาต

### ปัญหา: Database doesn't exist
- สร้างฐานข้อมูลใน phpMyAdmin หรือ MySQL Command Line
- ตรวจสอบชื่อฐานข้อมูลให้ถูกต้อง

## การตั้งค่า PATH สำหรับ MySQL Command Line (Windows)

1. เปิด System Properties → Advanced → Environment Variables
2. เพิ่ม Path ใหม่: `C:\xampp\mysql\bin` (สำหรับ XAMPP)
3. หรือ: `C:\Program Files\MySQL\MySQL Server 8.0\bin` (สำหรับ MySQL Server)
4. Restart Command Prompt
5. ทดสอบ: `mysql --version`
