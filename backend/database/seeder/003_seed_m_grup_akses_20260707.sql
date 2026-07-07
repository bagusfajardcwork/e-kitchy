-- -- 1. Hapus data di tabel anak (penghubung) terlebih dahulu
-- DELETE FROM m_pegawai_grup_akses;
--
-- -- 2. Hapus data di tabel induk
-- DELETE FROM m_grup_akses;
--
-- -- 3. Reset Auto Increment agar ID kembali mulai dari 1
-- ALTER TABLE m_pegawai_grup_akses AUTO_INCREMENT = 1;
-- ALTER TABLE m_grup_akses AUTO_INCREMENT = 1;

-- 4. Masukkan kembali data master grup akses
INSERT INTO m_grup_akses (nama_grup, keterangan, status_aktif) VALUES
('Super Admin', 'Akses penuh ke semua fitur', 1),
('Kasir', 'Akses untuk transaksi dan kasir', 1),
('Gudang', 'Akses untuk manajemen stok', 1),
('Manajer', 'Akses untuk laporan dan monitoring', 1);