<script setup>
import {reactive, ref, watch} from 'vue'
import { Api } from '@/composable/useApi.ts'

// import component
import componentModalJenisReferensi from './modal/modal-jenis-referensi.vue'
import componentModalReferensi from './modal/modal-referensi.vue'
import {swalConfirm, getErrorMessage, swalSuccess, swalError} from '@/utilities/helperSwal'

// state
const tableJenisReferensi = reactive({
  fields: [
    { key: 'no', label: 'No.', class: 'text-center' },
    { key: 'deskripsi', label: 'Deskripsi', class: '' },
    { key: 'singkatan', label: 'Singkatan', class: 'text-center' },
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
  selectedDataJenRef: null,
})
const modalJenisReferensi = reactive({
  id: null,
  jenis_referensi_fk: null,
  modalTitle: '',
  isOpen: false,
  flagging: '',
})
const tableReferensi = reactive({
  fields: [
    { key: 'no', label: 'No.', class: 'text-center' },
    { key: 'deskripsi', label: 'Deskripsi', class: '' },
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
const modalReferensi = reactive({
  id: null,
  modalTitle: '',
  isOpen: false,
  flagging: '',
})

// fetching
const fetchJenisReferensi = async () => {
  try {
    tableJenisReferensi.loading = true
    let params = {
      page: tableJenisReferensi.currentPage,
      limit: tableJenisReferensi.perPage,
      search: tableJenisReferensi.searchQuery
    }
    const response = await Api.get('master/jenis_referensi',  params)

    tableJenisReferensi.items = response.data || []
    tableJenisReferensi.total = response.meta?.totalData || 0

  } catch (err) {
    await swalError(getErrorMessage(err))
  } finally {
    tableJenisReferensi.loading = false
  }
}
const fetchReferensi = async (param1) => {
  try {
    tableReferensi.loading = true
    let params = {
      id: param1,
      page: tableReferensi.currentPage,
      limit: tableReferensi.perPage,
      search: tableReferensi.searchQuery
    }
    const response = await Api.get(
        `master/referensi/jenisref/${param1}`,
        {
          page: tableReferensi.currentPage,
          limit: tableReferensi.perPage,
          search: tableReferensi.searchQuery
        }
    )

    tableReferensi.items = response.data || []
    tableReferensi.total = response.meta?.totalData || 0

  } catch (err) {
    await swalError(getErrorMessage(err))
  } finally {
    tableReferensi.loading = false
  }
}

// handler
const openModal = (param1, param2, param3) => {
  if (param1 === 'componentModalJenisReferensi') {
    if (param2 === 'create') {
      modalJenisReferensi.modalTitle = 'Tambah Jenis Referensi'
    } else if (param2 === 'update') {
      modalJenisReferensi.id = param3.id
      modalJenisReferensi.modalTitle = `Update Jenis Referensi ${param3.deskripsi}`
    }
    modalJenisReferensi.flagging = param2
    modalJenisReferensi.isOpen = true
  } else if (param1 === 'componentModalReferensi') {
    if (param2 === 'create') {
      modalReferensi.modalTitle = 'Tambah Referensi'
    } else if (param2 === 'update') {
      modalReferensi.id = param3.id
      modalReferensi.modalTitle = `Update Referensi ${param3.deskripsi}`
    }
    modalReferensi.flagging = param2
    modalReferensi.isOpen = true
  }
}
const handleSelected = (items) => {
  tableJenisReferensi.selectedDataJenRef = items
  modalReferensi.jenis_referensi_fk = tableJenisReferensi.selectedDataJenRef.id
  fetchReferensi(tableJenisReferensi.selectedDataJenRef.id)
}
const refreshTable = (param1) => {
  if (param1 === 'tableJenisReferensi') {
    fetchJenisReferensi()
    // jika refresh table jenis referensi di refresh. table referensi juga refresh
    tableJenisReferensi.selectedDataJenRef = null
    tableReferensi.items = []
    tableReferensi.total = 0
    tableReferensi.searchQuery = ''
    tableReferensi.currentPage = 1
  } else if (param1 === 'tableReferensi') {
    fetchReferensi(tableJenisReferensi.selectedDataJenRef.id)
  }
  // jika tidak mau ke halaman pertama gunakan fetchJenisReferensi()
  // jika mau pindah ke halaman pertama tableJenisReferensi.currentPage = 1
  // tableJenisReferensi.currentPage = 1
}
const deleteData = async (item) => {
  const result = await swalConfirm(
      `Apakah Anda yakin ingin menghapus "${item.deskripsi}"?`,
      'Hapus Data?'
  )
  if (result.isConfirmed) {
    let response
    try {

      response = await Api.delete('master/referensi', item.id)
      await swalSuccess(response.message || 'Data berhasil dihapus')
      await fetchReferensi(tableJenisReferensi.selectedDataJenRef.id)
    } catch (error) {
      await swalError(getErrorMessage(error))
    }
  }
}
const handlePerPageChange = (param1) => {
  if (param1 === 'tableJenisReferensi') {
    tableJenisReferensi.currentPage = 1
    fetchJenisReferensi()
    tableJenisReferensi.selectedDataJenRef = null
    tableReferensi.items = []
    tableReferensi.total = 0
    clearSearch('tableReferensi')
  } else {
    fetchReferensi(tableJenisReferensi.selectedDataJenRef.id)
  }
}
const clearSearch = (param1) => {
  if (param1 === 'tableJenisReferensi') {
    tableJenisReferensi.searchQuery = ''
    tableJenisReferensi.currentPage = 1
    fetchJenisReferensi()
  } else if (param1 === 'tableReferensi') {
    tableReferensi.searchQuery = ''
    tableReferensi.currentPage = 1
    fetchReferensi(tableJenisReferensi.selectedDataJenRef.id)
  }
}

// ✅ Watch search dengan debounce (500ms)
watch(
    () => tableJenisReferensi.searchQuery,
    (newValue) => {
      // Clear timer sebelumnya
      if (tableJenisReferensi.searchTimer) clearTimeout(tableJenisReferensi.searchTimer)

      // Set timer baru
      tableJenisReferensi.searchTimer = setTimeout(() => {
        tableJenisReferensi.currentPage = 1 // Reset ke halaman 1
        fetchJenisReferensi()
      }, 500) // ⏱️ 500ms delay
    }
)
watch(
    () => tableReferensi.searchQuery,
    (newValue) => {
      // Clear timer sebelumnya
      if (tableReferensi.searchTimer) clearTimeout(tableReferensi.searchTimer)

      // Set timer baru
      tableReferensi.searchTimer = setTimeout(() => {
        tableReferensi.currentPage = 1 // Reset ke halaman 1
        fetchReferensi()
      }, 500) // ⏱️ 500ms delay
    }
)

// load awal / watch
watch(
    () => tableJenisReferensi.currentPage,
    () => fetchJenisReferensi(),
    { immediate: true } // ← Jalankan sekali saat component mount
)
</script>

<template>
  <div>
    <b-row>
      <!-- Table Jenis Referensi-->
      <b-col sm="12" md="12" lg="6">
        <b-card no-body>
          <b-card-header class="p-3 d-flex justify-content-between">
            <div class="header-title align-content-center">
              <b-card-title>Jenis Referensi</b-card-title>
            </div>
            <div class="d-flex flex-row align-items-center">
              <b-input-group class="mx-2" size="sm">
                <b-form-input
                    v-model="tableJenisReferensi.searchQuery"
                    type="text"
                    placeholder="Cari deskripsi..."
                    :disabled="tableJenisReferensi.loading"
                >
                </b-form-input>

                <b-input-group-text>
                  <i class="ri-search-line text-primary"></i>
                </b-input-group-text>

                <!-- Tombol Clear (muncul saat ada text) -->
                <b-input-group-text v-if="tableJenisReferensi.searchQuery">
                  <i
                      class="ri-close-line text-danger"
                      style="cursor: pointer;"
                      @click="clearSearch('tableJenisReferensi')"
                  ></i>
                </b-input-group-text>
              </b-input-group>
              <b-button variant="primary" @click="openModal('componentModalJenisReferensi','create')" class="btn-sm">
                <i class="ri-add-large-fill pe-0 me-2"></i>Tambah
              </b-button>
            </div>
          </b-card-header>

          <b-card-body class="p-1">
            <b-table
                :items="tableJenisReferensi.items"
                :fields="tableJenisReferensi.fields"
                :busy="tableJenisReferensi.loading"
                small responsive selectable show-empty hover head-variant="info"
                select-mode="single"
                empty-text="Tidak ada data untuk ditampilkan!"
                @row-selected="handleSelected"
            >
              <template #cell(no)="data">
                {{ (tableJenisReferensi.currentPage - 1) * tableJenisReferensi.perPage + data.index + 1 }}
              </template>
              <template #cell(status_aktif)="data">
                <div class="text-center">
                  <h6>
                    <i :class="data.value === 1 ? 'ri-checkbox-circle-line text-primary' : 'ri-checkbox-blank-circle-line text-danger'"></i>
                  </h6>
                </div>
              </template>
              <template #cell(aksi)="data">
                <b-button variant="outline-primary" class="btn-sm mx-1" @click.stop="openModal('componentModalJenisReferensi','update', data.item)">
                  <i class="ri-edit-line"></i>
                </b-button>
<!--                <b-button variant="outline-danger" class="btn-sm" @click.stop="deleteData(data.item)">-->
<!--                  <i class="ri-delete-bin-line"></i>-->
<!--                </b-button>-->
              </template>
              <template #empty>
                <div class="text-center py-5">
                  <!-- Jika sedang mencari -->
                  <template v-if="tableJenisReferensi.searchQuery">
                    <i class="ri-search-line text-warning" style="font-size: 2rem;"></i>
                    <h5 class="mt-2 text-muted">Tidak Ada Hasil</h5>
                    <p class="text-muted small mb-3">
                      Tidak ada data yang cocok dengan "<strong>{{ tableJenisReferensi.searchQuery }}</strong>"
                    </p>
                    <b-button variant="outline-secondary" size="sm" @click="clearSearch('tableJenisReferensi')">
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
                    <b-button variant="primary" size="sm" @click="openModal('componentModalJenisReferensi', 'create')">
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
              Menampilkan {{ tableJenisReferensi.items.length }} dari {{ tableJenisReferensi.total }} data
            </div>
            <div class="d-flex justify-content-between">
              <b-pagination
                  v-model="tableJenisReferensi.currentPage"
                  :total-rows="tableJenisReferensi.total"
                  :per-page="tableJenisReferensi.perPage"
                  :disabled="tableJenisReferensi.loading"
                  first-text="Awal"
                  last-text="Akhir"
                  prev-text="‹"
                  next-text="›"
              />
              <div class="px-2">
                <b-button variant="primary" class="btn-sm" @click="refreshTable('tableJenisReferensi')">
                  <i class="ri-refresh-line fw-bold fs-6"></i>
                </b-button>
              </div>
              <BFormSelect
                  v-model="tableJenisReferensi.perPage"
                  :options="tableJenisReferensi.optPerPage"
                  size="sm" class="mb-3"
                  @change="handlePerPageChange('tableJenisReferensi')"
              />
            </div>
          </b-card-footer>
        </b-card>
      </b-col>

      <!-- Table Referensi-->
      <b-col sm="12" md="12" lg="6">
        <b-card no-body>
          <b-card-header class="p-3 d-flex justify-content-between">
            <div class="header-title align-content-center">
              <b-card-title>Referensi
              <span v-if="tableJenisReferensi.selectedDataJenRef"> <i class="ri-arrow-right-line"></i> {{ tableJenisReferensi.selectedDataJenRef.deskripsi }}</span>
              </b-card-title>
            </div>
            <div v-if="tableJenisReferensi.selectedDataJenRef" class="d-flex flex-row align-items-center">
              <b-input-group class="mx-2" size="sm">
                <b-form-input
                    v-model="tableJenisReferensi.searchQuery"
                    type="text"
                    placeholder="Cari referensi..."
                    :disabled="tableReferensi.loading"
                >
                </b-form-input>

                <b-input-group-text>
                  <i class="ri-search-line text-primary"></i>
                </b-input-group-text>

                <!-- Tombol Clear (muncul saat ada text) -->
                <b-input-group-text v-if="tableReferensi.searchQuery">
                  <i
                      class="ri-close-line text-danger"
                      style="cursor: pointer;"
                      @click="clearSearch('tableReferensi')"
                  ></i>
                </b-input-group-text>
              </b-input-group>
              <b-button variant="primary" @click="openModal('componentModalReferensi', 'create')" class="btn-sm">
                <i class="ri-add-large-fill pe-0 me-2"></i>Tambah
              </b-button>
            </div>
          </b-card-header>

          <b-card-body class="p-1">
            <b-table
                :items="tableReferensi.items"
                :fields="tableReferensi.fields"
                :busy="tableReferensi.loading"
                small responsive show-empty striped head-variant="info"
                empty-text="Tidak ada data untuk ditampilkan!"
            >
              <template #cell(no)="data">
                {{ (tableReferensi.currentPage - 1) * tableReferensi.perPage + data.index + 1 }}
              </template>
              <template #cell(status_aktif)="data">
                <div class="text-center">
                  <h6>
                    <i :class="data.value === 1 ? 'ri-checkbox-circle-line text-primary' : 'ri-checkbox-blank-circle-line text-danger'"></i>
                  </h6>
                </div>
              </template>
              <template #cell(aksi)="data">
                <b-button variant="outline-primary" class="btn-sm mx-1" @click.stop="openModal('componentModalReferensi','update', data.item)">
                  <i class="ri-edit-line"></i>
                </b-button>
                <b-button variant="outline-danger" class="btn-sm" @click.stop="deleteData(data.item)">
                  <i class="ri-delete-bin-line"></i>
                </b-button>
              </template>
              <template #empty>
                <div class="text-center py-5">
                  <!-- Jika sedang mencari -->
                  <template v-if="tableReferensi.searchQuery">
                    <i class="ri-search-line text-warning" style="font-size: 2rem;"></i>
                    <h5 class="mt-2 text-muted">Tidak Ada Hasil</h5>
                    <p class="text-muted small mb-3">
                      Tidak ada data yang cocok dengan "<strong>{{ tableReferensi.searchQuery }}</strong>"
                    </p>
                    <b-button variant="outline-secondary" size="sm" @click="clearSearch('tableReferensi')">
                      <i class="ri-refresh-line me-1"></i> Reset Pencarian
                    </b-button>
                  </template>

                  <!-- Jika data memang kosong -->
                  <template v-else-if="tableJenisReferensi.selectedDataJenRef">
                    <i class="ri-inbox-line text-muted" style="font-size: 2rem;"></i>
                    <h5 class="mt-2 text-muted">Data Kosong</h5>
                    <p class="text-muted small mb-3">
                      Belum ada data. Silakan tambahkan data baru.
                    </p>
                    <b-button variant="primary" size="sm" @click="openModal('componentModalReferensi','create')">
                      <i class="ri-add-line me-1"></i> Tambah Data
                    </b-button>
                  </template>

                  <template v-else>
                    <i class="ri-question-line fw-bold h1"></i>
                    <h5 class="mt-2 text-muted">Tidak Ada Hasil</h5>
                    <p class="text-muted small mb-3">
                      Jenis referensi belum dipilih.
                    </p>
                  </template>
                </div>
              </template>
              <template #table-busy>
                <div class="text-center my-3">
                  <template v-if="tableReferensi.items.length === 0">
                    <i class="ri-question-line fw-bold h1"></i>
                    <h5 class="mt-2 text-muted">Tidak Ada Hasil</h5>
                    <p class="text-muted small mb-3">
                      Jenis referensi belum dipilih.
                    </p>
                  </template>
                  <template v-else>
                    <b-spinner variant="primary"></b-spinner>
                    <p class="mt-2">Memuat data...</p>
                  </template>
                </div>
              </template>
            </b-table>
          </b-card-body>

          <b-card-footer class="p-1 d-flex justify-content-between align-items-center">
            <div class="text-muted small">
              Menampilkan {{ tableReferensi.items.length }} dari {{ tableReferensi.total }} data
            </div>
            <div v-if="tableJenisReferensi.selectedDataJenRef" class="d-flex justify-content-between">
              <b-pagination
                  v-model="tableReferensi.currentPage"
                  :total-rows="tableReferensi.total"
                  :per-page="tableReferensi.perPage"
                  :disabled="tableReferensi.loading"
                  first-text="Awal"
                  last-text="Akhir"
                  prev-text="‹"
                  next-text="›"
              />
              <div class="px-2">
                <b-button variant="primary" class="btn-sm" @click="refreshTable('tableReferensi')">
                  <i class="ri-refresh-line fw-bold fs-6"></i>
                </b-button>
              </div>
              <BFormSelect
                  v-model="tableReferensi.perPage"
                  :options="tableReferensi.optPerPage"
                  size="sm" class="mb-3"
                  @change="handlePerPageChange('tableReferensi')"
              />
            </div>
          </b-card-footer>
        </b-card>
      </b-col>
    </b-row>

    <componentModalJenisReferensi
        v-model="modalJenisReferensi.isOpen"
        :propsParams="modalJenisReferensi"
        @simpan="refreshTable('tableJenisReferensi')"
    />
    <componentModalReferensi
        v-model="modalReferensi.isOpen"
        :propsParams="modalReferensi"
        @simpan="refreshTable('tableReferensi')"
    />
  </div>
</template>

<style scoped>
</style>