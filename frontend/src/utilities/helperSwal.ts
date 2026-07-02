import Swal from 'sweetalert2'

// ✅ Tipe data untuk opsi notifikasi
interface SwalOptions {
  title?: string
  text?: string
  icon?: 'success' | 'error' | 'warning' | 'info' | 'question'
  confirmButtonText?: string
  timer?: number
  showConfirmButton?: boolean
}

// ✅ Helper untuk notifikasi sukses
export const swalSuccess = (message: string, title = 'Berhasil!') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'success',
    confirmButtonText: 'OK',
    timer: 2000,
    showConfirmButton: false
  })
}

// ✅ Helper untuk notifikasi error
export const swalError = (message: string, title = 'Gagal!') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'error',
    confirmButtonText: 'OK'
  })
}

// ✅ Helper untuk notifikasi warning
export const swalWarning = (message: string, title = 'Perhatian!') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'warning',
    confirmButtonText: 'OK'
  })
}

// ✅ Helper untuk notifikasi info
export const swalInfo = (message: string, title = 'Informasi') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'info',
    confirmButtonText: 'OK'
  })
}

// ✅ Helper untuk konfirmasi (dengan tombol Ya/Tidak)
export const swalConfirm = (message: string, title = 'Yakin?') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya, lanjutkan!',
    cancelButtonText: 'Batal'
  })
}

// ✅ Helper untuk extract pesan error dari API response
export const getErrorMessage = (error: any): string => {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    'Terjadi kesalahan pada server'
  )
}