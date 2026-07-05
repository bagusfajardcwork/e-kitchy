<script setup>
import {computed, reactive, ref, watch} from 'vue'
import { Api } from '@/composable/useApi.ts'
import {BButton, BForm, BFormCheckbox, BFormGroup, BFormInput, BModal} from "bootstrap-vue-next";
import { swalSuccess, swalError, swalConfirm, getErrorMessage } from '@/utilities/helperSwal'
import Multiselect from "vue-multiselect";
import { useNumericInput } from '@/composable/custom/useNumericInput.js'
const { allowOnlyNumbers, handlePaste, formatHarga } = useNumericInput()

// initilize
const isOpen = defineModel({ type: Boolean, default: false })

// props dari parent
const props = defineProps({
  propsParams: { type: Object, required: true }
})

// emit
const emit = defineEmits(['simpan'])

// state
const tableAddProduk = reactive({
  fields: [
    { key: 'no', label: 'No.', class: 'text-center col-1' },
    { key: 'deskripsi', label: 'Deskripsi', class: '3' },
    { key: 'jenisbarang_fk', label: 'Jenis Barang', class: 'col-3 text-center' },
    { key: 'distributor_fk', label: 'Distributor', class: 'col-3 text-center' },
    { key: 'harga', label: 'Harga', class: 'col-2' },
    { key: 'aksi', label: '', class: 'text-center col-1' },
  ],
  loading: false,
  // error: null,
  items: [],
})
const options = reactive({
  jenisbarang_fk: [],
  distributor_fk: [],
})
const selected = reactive({
  jenisbarang_fk: [],
  distributor_fk: [],
})
const loading = reactive({
  loadingForm: false,
  jenisbarang_fk: false,
  distributor_fk: false
})

// handler
const modalClose = () => {
  isOpen.value = false
  resetForm()
}
const handleSave = async () => {
  // Validasi
  const validasi_deskripsi = tableAddProduk.items.filter(
      item => !item.deskripsi || item.deskripsi.trim().length < 2
  )

  if (validasi_deskripsi.length > 0) {
    await swalError('Semua deskripsi harus diisi dan minimal 2 karakter!')
    return
  }

  if (tableAddProduk.items.length === 0) {
    await swalError('Tambahkan minimal 1 data referensi!')
    return
  }

  try {
    loading.value = true
    let response

    if (props.propsParams.flagging === 'create') {
      response = await Api.post(
          'master/produk/multiple_send', { items: tableAddProduk.items }  // ← Bungkus dalam object!
      )
    }

    if (response) {
      // Handle partial success
      if (response.meta?.totalFailed > 0 && response.meta?.totalSuccess > 0) {
        await swalSuccess(
            `${response.meta.totalSuccess} berhasil, ${response.meta.totalFailed} gagal`
        )
        // Hapus yang sukses saja
        const successIndexes = new Set(response.data.success.map(s => s.index))
        tableAddProduk.items = tableAddProduk.items.filter(
            (_, index) => !successIndexes.has(index)
        )
        emit('simpan', 'tableProduk', tableAddProduk.items)
      } else {
        // Semua sukses
        await swalSuccess(response.message)
        emit('simpan', 'tableProduk', tableAddProduk.items)
        modalClose()
      }
    }

  } catch (error) {
    await swalError(getErrorMessage(error))
    modalClose()
  } finally {
    loading.value = false
  }
}
const resetForm = () => {
  tableAddProduk.items = []
  selected.jenisbarang_fk = []
  selected.distributor_fk = []
}
const fetchSelectize = async (param1, param2) => {
  let response
  try {
    loading[param2] = true
    response = await Api.get(`selectize/${param2}`)
    if (response.meta.totalData > 0) {
      options[param2] = response.data
    } else {
      options[param2] = []
    }
  } catch (err) {
    options[param2] = []
  }  finally {
    loading[param2] = false
  }
}
const handlerAddRow = (index) => {
  tableAddProduk.items.push({
    id: null,
    deskripsi: '',
    jenisbarang_fk: null,
    distributor_fk: null,
    harga: null,
    status_aktif: 1,
  })
}
const handlerRemoveRow = (index) => {
  tableAddProduk.items.splice(index, 1)
}
// Update harga spesifik untuk tabel batch
const updateHarga = (index, val) => {
  const stringValue = String(val || '')
  const rawValue = stringValue.replace(/[^0-9]/g, '')
  tableAddProduk.items[index].harga = rawValue ? Number(rawValue) : null
}

// load awal/ watch
watch(isOpen, async (val) => {
  if (val) { // Jika modal terbuka
    resetForm()
    tableAddProduk.items.push({
      id: null,
      deskripsi: '',
      jenisbarang_fk: null,
      distributor_fk: null,
      harga: null,
      status_aktif: 1,
    })
  }
})

</script>

<template>
  <b-modal
      v-model="isOpen"
      :title="props.propsParams.modalTitle"
      scrollable fullscreen centered
      @hidden="modalClose"
  >
    <b-form>
      <b-table
          :items="tableAddProduk.items"
          :fields="tableAddProduk.fields"
          :busy="tableAddProduk.loading"
          small responsive selectable show-empty hover striped head-variant="info"
          empty-text="Tidak ada data untuk ditampilkan!"
      >
        <template #head(aksi)="data" v-if="props.propsParams.flagging === 'create'">
          <b-button variant="primary" class="btn-sm" @click="handlerAddRow(data.index)">
            <i class="ri-add-large-fill"></i> Tambah Baris
          </b-button>
        </template>
        <template #cell(no)="data" v-if="props.propsParams.flagging === 'create'">
          {{data.index + 1}}
        </template>
        <template #cell(deskripsi)="data">
          <b-form-input class="form-control form-control-sm" v-model="data.item.deskripsi" @keydown.enter="handlerAddRow"/>
        </template>
        <template #cell(jenisbarang_fk)="data">
          <multiselect placeholder="" v-model="selected.jenisbarang_fk[data.index]" :options="options.jenisbarang_fk"
                       :loading="loading.jenisbarang_fk"
                       @open="fetchSelectize($event, 'jenisbarang_fk')"
                       @update:model-value="(item) => data.item.jenisbarang_fk = item?.value || null"
                       trackBy="value" label="label" :allowEmpty="false" openDirection="top" :showLabels="false"
          />
        </template>
        <template #cell(distributor_fk)="data">
          <multiselect placeholder="" v-model="selected.distributor_fk" :options="options.distributor_fk"
                       :loading="loading.distributor_fk"
                       @open="fetchSelectize($event, 'distributor_fk')"
                       @update:model-value="(item) => data.item.distributor_fk = item?.value || null"
                       trackBy="value" label="label" :allowEmpty="false" openDirection="top" :showLabels="false"
          />
        </template>
        <template #cell(harga)="data">
          <b-form-input
            :model-value="formatHarga(data.item.harga)"
            @update:model-value="(val) => updateHarga(data.index, val)"
            @keypress="allowOnlyNumbers"
            @paste="handlePaste"
            type="text"
            inputmode="numeric"
            placeholder="0"
            size="sm"
          />
        </template>
        <template #cell(aksi)="data">
          <b-button v-if="props.propsParams.flagging === 'create' && data.index !== 0" variant="outline-danger" class="btn-sm" @click="handlerRemoveRow(data.index)">
            <i class="ri-delete-bin-line"></i>
          </b-button>
        </template>
      </b-table>
    </b-form>

    <template #footer>
      <b-button size="sm" variant="danger-subtle" @click="modalClose">Batal</b-button>
      <b-button size="sm" variant="primary-subtle" @click="handleSave">Simpan</b-button>
    </template>
  </b-modal>
</template>