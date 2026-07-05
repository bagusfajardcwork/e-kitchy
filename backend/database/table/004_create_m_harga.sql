CREATE TABLE `m_harga` (
  `id` int NOT NULL AUTO_INCREMENT,
  `produk_fk` int DEFAULT NULL,
  `harga` decimal(10,2) DEFAULT NULL,
  `status_aktif` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci