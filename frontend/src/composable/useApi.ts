// src/composables/useApi.ts
import { ref, type Ref } from 'vue'
import api from '@/services/api'
import type { AxiosRequestConfig } from 'axios'

// Definisi tipe response backend
interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta: any
}

// ✅ API OBJECT - Static methods untuk one-time call
// CARA PAKAI DI COMPONENT / DIHALAMAN
// // GET
// const response = await Api.get('endpoint', params)
// // POST
// const response = await Api.post('endpoint', payload)
// // PUT
// const response = await Api.put('endpoint', id, payload)
// // DELETE
// const response = await Api.delete('endpoint', id)

export const Api = {
  // ✅ GET all dengan params
  async get<T = any>(endpoint: string, params?: any): Promise<ApiResponse<T>> {
    const response = await api.get(endpoint, { params })
    return response.data
  },

  // ✅ GET by ID
  async getById<T = any>(endpoint: string, id: string | number): Promise<ApiResponse<T>> {
    const response = await api.get(`${endpoint}/${id}`)
    return response.data
  },

  // ✅ POST (create)
  async post<T = any>(endpoint: string, payload: any): Promise<ApiResponse<T>> {
    const response = await api.post(endpoint, payload)
    return response.data
  },

  // ✅ PUT (update)
  async put<T = any>(endpoint: string, id: string | number, payload: any): Promise<ApiResponse<T>> {
    const response = await api.put(`${endpoint}/${id}`, payload)
    return response.data
  },

  // ✅ DELETE
  async delete<T = any>(endpoint: string, id: string | number): Promise<ApiResponse<T>> {
    const response = await api.delete(`${endpoint}/${id}`)
    return response.data
  },

  // ✅ PATCH (partial update)
  async patch<T = any>(endpoint: string, id: string | number, payload: any): Promise<ApiResponse<T>> {
    const response = await api.patch(`${endpoint}/${id}`, payload)
    return response.data
  },

  // ✅ Generic request (untuk kasus khusus)
  async request<T = any>(
    method: string,
    endpoint: string,
    payload?: any,
    params?: any
  ): Promise<ApiResponse<T>> {
    const response = await api({
      method,
      url: endpoint,
      data: payload,
      params
    })
    return response.data
  }
}

// ✅ SERVICE COMPOSABLE - Tetap ada untuk backward compatibility
export function Service<T = any>(endpoint: string) {
  const data = ref<T | null>(null) as Ref<T | null>
  const meta = ref<any>(null) as Ref<any>
  const message = ref<string>('')
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const request = async (
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    url: string,
    payload: any = null,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T> | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await api({
        method,
        url,
        data: payload,
        ...config
      })

      const apiResponse: ApiResponse<T> = response.data
      data.value = apiResponse.data
      meta.value = apiResponse.meta
      message.value = apiResponse.message

      return apiResponse
    } catch (err: any) {
      error.value =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan pada server'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    meta,
    message,
    loading,
    error,
    getAll: (params?: any) => request('get', endpoint, null, { params }),
    getById: (id: string | number) => request('get', `${endpoint}/${id}`),
    create: (payload: Partial<T>) => request('post', endpoint, payload),
    update: (id: string | number, payload: Partial<T>) =>
      request('put', `${endpoint}/${id}`, payload),
    remove: (id: string | number) => request('delete', `${endpoint}/${id}`),
  }
}