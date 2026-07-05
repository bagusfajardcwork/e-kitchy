CREATE TABLE `m_produk` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jenisbarang_fk` int DEFAULT NULL,
  `deskripsi` text COLLATE utf8mb4_general_ci NOT NULL,
  `keterangan` text COLLATE utf8mb4_general_ci,
  `distributor_fk` int DEFAULT NULL,
  `gambar` text COLLATE utf8mb4_general_ci,
  `status_aktif` tinyint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci