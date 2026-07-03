<script setup>
import {reactive, ref, watch} from 'vue'
import { Api } from '@/composable/useApi.ts'
import {BButton, BForm, BFormCheckbox, BFormGroup, BFormInput, BModal} from "bootstrap-vue-next";
import { swalSuccess, swalError, swalConfirm, getErrorMessage } from '@/utilities/helperSwal'

// initilize
const isOpen = defineModel({ type: Boolean, default: false })

// props dari parent
const props = defineProps({
  propsParams: { type: Object, required: true }
})

// emit
const emit = defineEmits(['simpan'])

// state
const tableAddReferensi = reactive({
  fields: [
    { key: 'no', label: 'No.', class: 'text-center col-1' },
    { key: 'deskripsi', label: 'Deskripsi', class: 'col-10' },
    { key: 'aksi', label: '', class: 'text-center col-1' },
  ],
  loading: false,
  // error: null,
  items: [],
})
const loading = ref(false);

// handler
const modalClose = () => {
  isOpen.value = false
  resetForm()
}
const handleSave = async () => {
  // Validasi
  const validasi_deskripsi = tableAddReferensi.items.filter(
      item => !item.deskripsi || item.deskripsi.trim().length < 2
  )

  if (validasi_deskripsi.length > 0) {
    await swalError('Semua deskripsi harus diisi dan minimal 2 karakter!')
    return
  }

  if (tableAddReferensi.items.length === 0) {
    await swalError('Tambahkan minimal 1 data referensi!')
    return
  }

  try {
    loading.value = true
    let response

    if (props.propsParams.flagging === 'create') {
      response = await Api.post(
          'master/referensi/multiple_send', { items: tableAddReferensi.items }  // ← Bungkus dalam object!
      )
    } else if (props.propsParams.flagging === 'update') {
      response = await Api.put('master/referensi', props.propsParams.id, tableAddReferensi.items[0])
    }

    if (response) {
      // Handle partial success
      if (response.meta?.totalFailed > 0 && response.meta?.totalSuccess > 0) {
        await swalSuccess(
            `${response.meta.totalSuccess} berhasil, ${response.meta.totalFailed} gagal`
        )
        // Hapus yang sukses saja
        const successIndexes = new Set(response.data.success.map(s => s.index))
        tableAddReferensi.items = tableAddReferensi.items.filter(
            (_, index) => !successIndexes.has(index)
        )
        emit('simpan', 'tableReferensi', tableAddReferensi.items)
      } else {
        // Semua sukses
        await swalSuccess(response.message)
        emit('simpan', 'tableReferensi', tableAddReferensi.items)
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
  tableAddReferensi.items = []
}
const fetchById = async (param1) => {
  let response
  try {
    loading.value = true
    response = await  Api.getById('master/referensi', param1)
    const res = response.data
    tableAddReferensi.items.push({
      id: res.id,
      jenis_referensi_fk: res.jenis_referensi_fk,
      deskripsi: res.deskripsi,
      status_aktif: res.status_aktif,
    })
  } catch (error) {
    await swalError(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}
const handlerAddRow = () => {
  tableAddReferensi.items.push({
    id: null,
    jenis_referensi_fk: props.propsParams.jenis_referensi_fk,
    deskripsi: '',
    status_aktif: 1,
  })
}
const handlerRemoveRow = (index) => {
  tableAddReferensi.items.splice(index, 1)
}

// load awal/ watch
watch(isOpen, async (val) => {
  if (val) { // Jika modal terbuka
    if (props.propsParams.flagging === 'update' && props.propsParams.id) {
      // // Fetch data dari backend berdasarkan ID
      await fetchById(props.propsParams.id)
    } else {
      resetForm()
      tableAddReferensi.items.push({
        id: null,
        jenis_referensi_fk: props.propsParams.jenis_referensi_fk,
        deskripsi: '',
        status_aktif: 1,
      })
    }
  }
})

</script>

<template>
  <b-modal
      v-model="isOpen"
      :title="props.propsParams.modalTitle"
      scrollable
      @hidden="modalClose" size="lg"
  >
    <b-form>
      <b-table
          :items="tableAddReferensi.items"
          :fields="tableAddReferensi.fields"
          :busy="tableAddReferensi.loading"
          small responsive selectable show-empty hover striped head-variant="info"
          empty-text="Tidak ada data untuk ditampilkan!"
      >
        <template #head(aksi) v-if="props.propsParams.flagging === 'create'">
          <b-button variant="primary" class="btn-sm" @click="handlerAddRow">
            <i class="ri-add-large-fill"></i> Tambah Baris
          </b-button>
        </template>
        <template #cell(no)="data" v-if="props.propsParams.flagging === 'create'">
          {{data.index + 1}}
        </template>
        <template #cell(deskripsi)="data">
          <b-form-input v-model="data.item.deskripsi" @keydown.enter="handlerAddRow" v-if="props.propsParams.flagging === 'create'"/>
          <b-form-input v-model="data.item.deskripsi" v-else/>
        </template>
        <template #cell(aksi)="data">
          <b-button v-if="props.propsParams.flagging === 'create'" variant="outline-danger" class="btn-sm" @click="handlerRemoveRow(data.index)">
            <i class="ri-delete-bin-line"></i>
          </b-button>
          <b-form-checkbox
              v-if="props.propsParams.flagging === 'update'"
              id="status_aktif"
              v-model="data.item.status_aktif"
              name="status_aktif"
              :value="1"
              :unchecked-value="0"
          >
            {{ data.item.status_aktif === 1 ? 'Aktif' : 'Nonaktif' }}
          </b-form-checkbox>
        </template>
      </b-table>
    </b-form>

    <template #footer>
      <b-button size="sm" variant="danger-subtle" @click="modalClose">Batal</b-button>
      <b-button size="sm" variant="primary-subtle" @click="handleSave">{{ props.propsParams.flagging === 'update' ? 'Ubah' : 'Simpan' }}</b-button>
    </template>
  </b-modal>
</template>