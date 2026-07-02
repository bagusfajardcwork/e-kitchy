import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError
} from 'axios'

// 🚀 Gunakan logika DEV/Production untuk baseURL
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 30000, // ⏱️ Tambahkan timeout 30 detik (best practice)
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// Response Interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // 🚨 Handle error global
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Token expired atau tidak valid
          console.error('Unauthorized - Token mungkin expired')
          localStorage.removeItem('token')
          // window.location.href = '/login' // Redirect ke login
          break
        case 403:
          console.error('Forbidden - Tidak punya akses')
          break
        case 404:
          console.error('Endpoint tidak ditemukan')
          break
        case 500:
          console.error('Server error')
          break
      }
    } else if (error.request) {
      // Request terkirim tapi tidak ada response (network error)
      console.error('Network error - Backend tidak merespons')
    }

    return Promise.reject(error)
  }
)

export default api