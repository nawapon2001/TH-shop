-- SQL Script สำหรับสร้างตาราง MySQL ตามโครงสร้าง Prisma
-- คัดลอกและรันใน phpMyAdmin

-- สร้างตาราง products
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `price` double NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text,
  `image` varchar(500) DEFAULT NULL,
  `images` json DEFAULT NULL,
  `rating` double NOT NULL DEFAULT 0,
  `reviews` int(11) NOT NULL DEFAULT 0,
  `sold` int(11) NOT NULL DEFAULT 0,
  `discountPercent` int(11) NOT NULL DEFAULT 0,
  `deliveryInfo` varchar(255) DEFAULT NULL,
  `promotions` json DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 999,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สร้างตาราง product_options
CREATE TABLE `product_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `productId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_options_productId_fkey` (`productId`),
  CONSTRAINT `product_options_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สร้างตาราง product_option_values
CREATE TABLE `product_option_values` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  `price` double NOT NULL DEFAULT 0,
  `priceType` varchar(10) NOT NULL DEFAULT 'add',
  `stock` int(11) NOT NULL DEFAULT 0,
  `sku` varchar(50) DEFAULT NULL,
  `optionId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_option_values_optionId_fkey` (`optionId`),
  CONSTRAINT `product_option_values_optionId_fkey` FOREIGN KEY (`optionId`) REFERENCES `product_options` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สร้างตาราง categories
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สร้างตาราง sellers
CREATE TABLE `sellers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `shopName` varchar(100) DEFAULT NULL,
  `fullName` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `address` text,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sellers_username_key` (`username`),
  UNIQUE KEY `sellers_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สร้างตาราง orders
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderNumber` varchar(50) NOT NULL,
  `totalAmount` double NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `customerInfo` json NOT NULL,
  `shippingInfo` json DEFAULT NULL,
  `items` json NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_orderNumber_key` (`orderNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- เพิ่มข้อมูลตัวอย่าง categories
INSERT INTO `categories` (`name`, `description`) VALUES
('เสื้อผ้า', 'เสื้อผ้าแฟชั่นทุกประเภท'),
('อิเล็กทรอนิกส์', 'อุปกรณ์อิเล็กทรอนิกส์และแก็ดเจ็ต'),
('เครื่องใช้ในบ้าน', 'เครื่องใช้ไฟฟ้าและของใช้ในบ้าน'),
('กีฬาและสุขภาพ', 'อุปกรณ์กีฬาและผลิตภัณฑ์เพื่อสุขภาพ'),
('หนังสือและสื่อ', 'หนังสือ นิตยสาร และสื่อการเรียนรู้');

-- เพิ่มข้อมูลตัวอย่าง products
INSERT INTO `products` (`name`, `price`, `category`, `description`, `image`, `images`, `stock`) VALUES
('เสื้อยืดคอกลม', 299.00, 'เสื้อผ้า', 'เสื้อยืดคอกลมผ้าคอตตอน 100% นิ่มใส่สบาย', 'https://example.com/tshirt.jpg', '["https://example.com/tshirt1.jpg", "https://example.com/tshirt2.jpg"]', 50),
('หูฟังบลูทูธ', 1590.00, 'อิเล็กทรอนิกส์', 'หูฟังไร้สายคุณภาพเสียงใส เชื่อมต่อบลูทูธ 5.0', 'https://example.com/headphone.jpg', '["https://example.com/headphone1.jpg"]', 25);
