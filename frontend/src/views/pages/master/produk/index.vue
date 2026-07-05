<script setup>
import {reactive, ref, watch} from 'vue'
import { Api } from '@/composable/useApi.ts'

// import component
import componentModalProduk from './modal/modal-produk.vue'
import componentModalProdukMultiple from './modal/modal-produk-multiple.vue'
import {swalConfirm, getErrorMessage, swalSuccess, swalError} from '@/utilities/helperSwal'

// state
const tableProduk = reactive({
  fields: [
    { key: 'no', label: 'No.', class: 'text-center' },
    { key: 'deskripsi', label: 'Produk', class: '' },
    { key: 'harga', label: 'Harga', class: '' },
    { key: 'id', label: 'ID', class: 'text-center' },
    { key: 'status_aktif', label: 'Status', class: 'text-center' },
    { key: 'aksi', label: 'Aksi', class: 'text-center' },
  ],
  loading: false,
  // error: null,
  items: [],
  total: 0,
  perPage: 10,
  currentPage: 1,
  optPerPage: [
    { value: 10, text: '10' },
    { value: 20, text: '20' },
    { value: 30, text: '30' },
    { value: 50, text: '50' },
    { value: 100, text: '100' }
  ],
  searchQuery: '',
  searchTimer: null,
})
const modalProduk = reactive({
  id: null,
  jenis_referensi_fk: null,
  modalTitle: '',
  isOpen: false,
  flagging: '',
})
const modalProdukMultiple = reactive({
  id: null,
  modalTitle: '',
  isOpen: false,
  flagging: '',
})

// fetching
const fetchProduk = async () => {
  try {
    tableProduk.loading = true
    let params = {
      page: tableProduk.currentPage,
      limit: tableProduk.perPage,
      search: tableProduk.searchQuery
    }
    const response = await Api.get('master/produk',  params)

    tableProduk.items = response.data || []
    tableProduk.total = response.meta?.totalData || 0

  } catch (err) {
    await swalError(getErrorMessage(err))
  } finally {
    tableProduk.loading = false
  }
}

// handler
const openModal = (param1, param2, param3) => {
  if (param1 === 'componentModalProduk') {
    if (param2 === 'create') {
      modalProduk.modalTitle = 'Tambah Produk'
    } else if (param2 === 'update') {
      modalProduk.id = param3.id
      modalProduk.modalTitle = `Update Produk ${param3.deskripsi}`
    }
    modalProduk.flagging = param2
    modalProduk.isOpen = true
  } else if (param1 === 'componentModalProdukMultiple') {
    modalProdukMultiple.modalTitle = 'Tambah Produk Sekaligus'
    modalProdukMultiple.flagging = param2
    modalProdukMultiple.isOpen = true
  }
}
const refreshTable = (param1) => {
  if (param1 === 'tableProduk') {
    fetchProduk()
    // jika refresh table jenis referensi di refresh. table referensi juga refresh
    tableProduk.searchQuery = ''
    tableProduk.currentPage = 1
  }
}
const deleteData = async (item) => {
  const result = await swalConfirm(
      `Apakah Anda yakin ingin menghapus "${item.deskripsi}"?`,
      'Hapus Data?'
  )
  if (result.isConfirmed) {
    let response
    try {

      response = await Api.delete('master/produk', item.id)
      await swalSuccess(response.message || 'Data berhasil dihapus')
      await fetchProduk()
    } catch (error) {
      await swalError(getErrorMessage(error))
    }
  }
}
const handlePerPageChange = (param1) => {
  if (param1 === 'tableProduk') {
    tableProduk.currentPage = 1
    fetchProduk()
    clearSearch('tableReferensi')
  }
}
const clearSearch = (param1) => {
  if (param1 === 'tableProduk') {
    tableProduk.searchQuery = ''
    tableProduk.currentPage = 1
  }
}

// ✅ Watch search dengan debounce (500ms)
watch(
    () => tableProduk.searchQuery,
    (newValue) => {
      // Clear timer sebelumnya
      if (tableProduk.searchTimer) clearTimeout(tableProduk.searchTimer)

      // Set timer baru
      tableProduk.searchTimer = setTimeout(() => {
        tableProduk.currentPage = 1 // Reset ke halaman 1
        fetchProduk()
      }, 500) // ⏱️ 500ms delay
    }
)

// load awal / watch
watch(
    () => tableProduk.currentPage,
    () => fetchProduk(),
    { immediate: true } // ← Jalankan sekali saat component mount
)
</script>

<template>
  <div>
    <b-row>
      <!-- Table Produk-->
      <b-col sm="12" md="12" lg="12">
        <b-card no-body>
          <b-card-header class="p-3">
            <div class="row align-items-center">
              <div class="col-sm-12 col-lg-1">
                <div class="header-title align-content-center">
                  <b-card-title>Produk</b-card-title>
                </div>
              </div>
              <div class="col-sm-12 col-lg-11">
                <div class="d-flex flex-row justify-content-end text-end gap-2">
                  <div class="w-50">
                    <b-input-group size="sm">
                      <b-form-input
                          v-model="tableProduk.searchQuery"
                          type="text"
                          placeholder="Cari deskripsi..."
                          :disabled="tableProduk.loading"
                      >
                      </b-form-input>

                      <b-input-group-text>
                        <i class="ri-search-line text-primary"></i>
                      </b-input-group-text>

                      <!-- Tombol Clear (muncul saat ada text) -->
                      <b-input-group-text v-if="tableProduk.searchQuery">
                        <i
                            class="ri-close-line text-danger"
                            style="cursor: pointer;"
                            @click="clearSearch('tableProduk')"
                        ></i>
                      </b-input-group-text>
                    </b-input-group>
                  </div>
                  <div>
                    <b-button variant="primary" @click="openModal('componentModalProduk','create')" class="btn-sm">
                      <i class="ri-add-large-fill pe-0 me-2"></i>Tambah Satuan (Detail)
                    </b-button>
                  </div>
                  <div>
                    <b-button variant="primary" @click="openModal('componentModalProdukMultiple','create')" class="btn-sm">
                      <i class="ri-add-large-fill pe-0 me-2"></i>Tambah Sekaligus
                    </b-button>
                  </div>
                </div>
              </div>
            </div>
          </b-card-header>

          <b-card-body class="p-1">
            <b-table
                :items="tableProduk.items"
                :fields="tableProduk.fields"
                :busy="tableProduk.loading"
                small responsive show-empty hover striped head-variant="info"
                empty-text="Tidak ada data untuk ditampilkan!"
            >
              <template #cell(no)="data">
                {{ (tableProduk.currentPage - 1) * tableProduk.perPage + data.index + 1 }}
              </template>
              <template #cell(status_aktif)="data">
                <div class="text-center">
                  <h6>
                    <i :class="data.value === 1 ? 'ri-checkbox-circle-line text-primary' : 'ri-checkbox-blank-circle-line text-danger'"></i>
                  </h6>
                </div>
              </template>
              <template #cell(aksi)="data">
                <b-button variant="outline-primary" class="btn-sm mx-1" @click.stop="openModal('componentModalProduk','update', data.item)">
                  <i class="ri-edit-line"></i>
                </b-button>
                <b-button variant="outline-danger" class="btn-sm" @click.stop="deleteData(data.item)">
                  <i class="ri-delete-bin-line"></i>
                </b-button>
              </template>
              <template #empty>
                <div class="text-center py-5">
                  <!-- Jika sedang mencari -->
                  <template v-if="tableProduk.searchQuery">
                    <i class="ri-search-line text-warning" style="font-size: 2rem;"></i>
                    <h5 class="mt-2 text-muted">Tidak Ada Hasil</h5>
                    <p class="text-muted small mb-3">
                      Tidak ada data yang cocok dengan "<strong>{{ tableProduk.searchQuery }}</strong>"
                    </p>
                    <b-button variant="outline-secondary" size="sm" @click="clearSearch('tableProduk')">
                      <i class="ri-refresh-line me-1"></i> Reset Pencarian
                    </b-button>
                  </template>

                  <!-- Jika data memang kosong -->
                  <template v-else>
                    <i class="ri-inbox-line text-muted" style="font-size: 2rem;"></i>
                    <h5 class="mt-2 text-muted">Data Kosong</h5>
                    <p class="text-muted small mb-3">
                      Belum ada data. Silakan tambahkan data baru.
                    </p>
                    <b-button variant="primary" size="sm" @click="openModal('componentModalProduk', 'create')">
                      <i class="ri-add-line me-1"></i> Tambah Data
                    </b-button>
                  </template>
                </div>
              </template>
              <template #table-busy>
                <div class="text-center my-3">
                  <b-spinner variant="primary"></b-spinner>
                  <p class="mt-2">Memuat data...</p>
                </div>
              </template>
            </b-table>
          </b-card-body>

          <b-card-footer class="p-1 d-flex justify-content-between align-items-center">
            <div class="text-muted small">
              Menampilkan {{ tableProduk.items.length }} dari {{ tableProduk.total }} data
            </div>
            <div class="d-flex justify-content-between">
              <b-pagination
                  v-model="tableProduk.currentPage"
                  :total-rows="tableProduk.total"
                  :per-page="tableProduk.perPage"
                  :disabled="tableProduk.loading"
                  first-text="Awal"
                  last-text="Akhir"
                  prev-text="‹"
                  next-text="›"
              />
              <div class="px-2">
                <b-button variant="primary" class="btn-sm" @click="refreshTable('tableProduk')">
                  <i class="ri-refresh-line fw-bold fs-6"></i>
                </b-button>
              </div>
              <BFormSelect
                  v-model="tableProduk.perPage"
                  :options="tableProduk.optPerPage"
                  size="sm" class="mb-3"
                  @change="handlePerPageChange('tableProduk')"
              />
            </div>
          </b-card-footer>
        </b-card>
      </b-col>
    </b-row>

    <componentModalProduk
        v-model="modalProduk.isOpen"
        :propsParams="modalProduk"
        @simpan="refreshTable('tableProduk')"
    />
    <componentModalProdukMultiple
        v-model="modalProdukMultiple.isOpen"
        :propsParams="modalProdukMultiple"
        @simpan="refreshTable('tableProduk')"
    />

  </div>
</template>

<style scoped>
</style>