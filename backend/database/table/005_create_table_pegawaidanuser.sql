CREATE TABLE `m_grup_akses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_grup` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Contoh: Admin, Kasir, Gudang',
  `keterangan` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status_aktif` tinyint DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `m_pegawai` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `status_aktif` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `m_pegawai_grup_akses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pegawai_fk` int NOT NULL,
  `grup_akses_fk` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pegawai_fk` (`pegawai_fk`),
  KEY `grup_akses_fk` (`grup_akses_fk`),
  -- Mencegah 1 pegawai memiliki grup yang sama 2 kali
  UNIQUE KEY `unique_pegawai_grup` (`pegawai_fk`, `grup_akses_fk`),
  CONSTRAINT `fk_pegawai` FOREIGN KEY (`pegawai_fk`) REFERENCES `m_pegawai` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_grup_akses` FOREIGN KEY (`grup_akses_fk`) REFERENCES `m_grup_akses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;