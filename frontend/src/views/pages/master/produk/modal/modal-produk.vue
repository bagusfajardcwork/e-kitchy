<script setup>
import {computed, reactive, ref, watch} from 'vue'
import {Api} from "@/composable/useApi.ts"
import {BButton, BForm, BFormCheckbox, BFormGroup, BFormInput, BModal} from "bootstrap-vue-next";
import { swalSuccess, swalError, swalConfirm, getErrorMessage } from '@/utilities/helperSwal'
import multiselect from 'vue-multiselect'

// initilize
const isOpen = defineModel({ type: Boolean, default: false })

// props dari parent
const props = defineProps({
  propsParams: { type: Object, required: true }
})

// emit
const emit = defineEmits(['simpan'])

// state
const formData = reactive({
  id: null,
  jenisbarang_fk: null,
  deskripsi: '',
  keterangan: '',
  distributor_fk: null,
  gambar: '',
  harga: null,
  status_aktif: 1,
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
  try {
    loading.loadingForm = true
    let response
    // jika null maka create, jika ada idnya maka update
    if (!formData.id) {
      response = await Api.post('master/produk',  formData)
    } else {
      response = await Api.put('master/produk', formData.id,  formData)
    }
    await swalSuccess(response.message)
    emit('simpan', 'tableProduk', formData) // emit untuk kirim ke parent
    modalClose()
  } catch (error) {
    await swalError(getErrorMessage(error))
  } finally {
    loading.loadingForm = false
  }
}
const resetForm = () => {
  Object.assign(formData, {
    id: null,
    jenisbarang_fk: null,
    deskripsi: '',
    keterangan: '',
    distributor_fk: null,
    gambar: '',
    harga: null,
    status_aktif: 1
  })

  Object.assign(selected, {
    jenisbarang_fk: null,
    distributor_fk: null
  })
}
const fetchById = async (param1) => {
  try {
    let response = await Api.getById('master/produk', param1)
    const res = response.data

    Object.assign(formData, {
      id: res.id,
      jenisbarang_fk: res.jenisbarang_fk,
      deskripsi: res.deskripsi,
      keterangan: res.keterangan,
      distributor_fk: res.distributor_fk,
      gambar: res.gambar,
      harga: res.harga,
      status_aktif: res.status_aktif
    })

    if (res.jenisbarang_fk && res.jenisbarang_label) {
      selected.jenisbarang_fk = [{ value: res.jenisbarang_fk, label: res.jenisbarang_label }]
    }

    if (res.distributor_fk && res.distributor_label) {
      selected.distributor_fk = [{ value: res.distributor_fk, label: res.distributor_label }]
    }

  } catch (error) {
    await swalError(getErrorMessage(error))
  }
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
const displayHarga = computed({
  // GET: Mengubah angka murni menjadi format 150.000 untuk ditampilkan
  get() {
    if (!formData.harga) return ''
    // Regex untuk menambahkan titik setiap 3 digit
    return formData.harga.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  },

  // SET: Mengubah input user (150.000) kembali menjadi angka murni (150000)
  set(value) {
    // Hapus semua karakter kecuali angka (0-9)
    const rawValue = value.replace(/[^0-9]/g, '')

    // Simpan ke formData.harga sebagai Number
    formData.harga = rawValue ? Number(rawValue) : null
  }
})

// load awal/ watch
watch(isOpen, async (val) => {
  if (val) { // Jika modal terbuka
    if (props.propsParams.flagging === 'update' && props.propsParams.id) {
      // // Fetch data dari backend berdasarkan ID
      await fetchById(props.propsParams.id)
    } else {
      resetForm()
    }
  }
})
</script>

<template>
  <b-modal
      v-model="isOpen"
      :title="props.propsParams.modalTitle"
      scrollable
      @hidden="modalClose"
      fullscreen
  >
    <b-form>
      <b-row>
        <b-col sm="12" md="12" lg="12">
          <b-form-group label="Deskripsi">
            <b-form-input class="form-control form-control-sm mb-1" v-model="formData.deskripsi" />
          </b-form-group>
        </b-col>
        <b-col sm="12" md="12" lg="4">
          <b-form-group label="Jenis Barang">
            <multiselect placeholder="" v-model="selected.jenisbarang_fk" :options="options.jenisbarang_fk"
                         :loading="loading.jenisbarang_fk"
                         @open="fetchSelectize($event, 'jenisbarang_fk')"
                         @update:model-value="(item) => formData.jenisbarang_fk = item?.value || null"
                         trackBy="value" label="label" :allowEmpty="false" openDirection="top" :showLabels="false"
            />
          </b-form-group>
        </b-col>
        <b-col sm="12" md="12" lg="4">
          <b-form-group label="Distributor">
            <multiselect placeholder="" v-model="selected.distributor_fk" :options="options.distributor_fk"
                         :loading="loading.distributor_fk"
                         @open="fetchSelectize($event, 'distributor_fk')"
                         @update:model-value="(item) => formData.distributor_fk = item?.value || null"
                         trackBy="value" label="label" :allowEmpty="true" openDirection="top" :showLabels="false"
            />
          </b-form-group>
        </b-col>
        <b-col sm="12" md="12" lg="4">
          <b-form-group label="Harga">
            <b-form-input
                v-model="displayHarga"
                type="text"
                inputmode="numeric"
                placeholder="0"
                class="form-control form-control-sm"
            />
          </b-form-group>
        </b-col>
        <b-col sm="12" md="12" lg="12">
          <div class="form-group">
            <label for="keterangan">Keterangan</label>
            <textarea class="form-control my-2" id="keterangan" rows="3"
                      v-model="formData.keterangan"
            />
          </div>
        </b-col>
        <b-col sm="12" md="12" lg="12">
          <b-form-checkbox
              v-if="props.propsParams.flagging === 'update'"
              id="status_aktif"
              v-model="formData.status_aktif"
              name="status_aktif"
              :value="1"
              :unchecked-value="0"
          >
            {{ formData.status_aktif === 1 ? 'Aktif' : 'Nonaktif' }}
          </b-form-checkbox>
        </b-col>
      </b-row>

    </b-form>

    <template #footer>
      <b-button size="sm" variant="danger-subtle" @click="modalClose">Batal</b-button>
      <b-button size="sm" variant="primary-subtle" @click="handleSave">{{ props.propsParams.flagging === 'update' ? 'Ubah' : 'Simpan' }}</b-button>
    </template>
  </b-modal>
</template>