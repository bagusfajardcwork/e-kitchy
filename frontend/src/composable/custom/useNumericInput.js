import { ref } from 'vue'

export function useNumericInput(initialValue = null) {
  // State Reactive
  const numericValue = ref(initialValue)

  /**
   * Mencegah input karakter selain angka saat mengetik
   */
  const allowOnlyNumbers = (event) => {
    // Izinkan kombinasi tombol (Ctrl+C, Ctrl+V, Ctrl+A, dll)
    if (event.ctrlKey || event.altKey || event.metaKey) return

    // Izinkan tombol navigasi & editing (Backspace, Delete, Arrow, Tab, dll)
    if (event.key.length > 1) return

    // Blokir jika bukan angka 0-9
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault()
    }
  }

  /**
   * Memfilter teks yang di-paste agar hanya angka
   */
  const handlePaste = (event) => {
    event.preventDefault()

    const pastedText = event.clipboardData?.getData('text') || ''
    const numericOnly = pastedText.replace(/[^0-9]/g, '')

    // Insert teks yang sudah difilter ke posisi kursor
    if (numericOnly) {
      document.execCommand('insertText', false, numericOnly)
    }
  }

  /**
   * Helper untuk memformat angka menjadi string dengan titik (150000 -> 150.000)
   */
  const formatHarga = (value) => {
    if (value === null || value === undefined || value === '') return ''
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  /**
   * Helper untuk mengupdate nilai dari event input
   */
  const updateValue = (target) => {
    const rawValue = target.value.replace(/[^0-9]/g, '')
    numericValue.value = rawValue ? Number(rawValue) : null
  }

  return {
    numericValue,
    allowOnlyNumbers,
    handlePaste,
    formatHarga,
    updateValue
  }
}