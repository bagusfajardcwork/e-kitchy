CREATE TABLE `m_referensi` (
  `jenis_referensi_fk` int NOT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `deskripsi` text COLLATE utf8mb4_general_ci,
  `status_aktif` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci