CREATE TABLE `m_jenis_referensi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `deskripsi` text COLLATE utf8mb4_general_ci NOT NULL,
  `singkatan` text COLLATE utf8mb4_general_ci,
  `status_aktif` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
