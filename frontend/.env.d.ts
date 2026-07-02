// src/env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_API: string
  // Tambahkan variabel VITE_ lainnya di sini
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}