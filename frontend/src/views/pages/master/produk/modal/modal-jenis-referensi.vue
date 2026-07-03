<script setup>
import {ref, watch} from 'vue'
import {Api} from "@/composable/useApi.ts"
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

// service
// const { data: response, getById, create, update, loading, error } = Service('master/jenis_referensi')

// state
const formData = ref({
  id: null,
  deskripsi: '',
  singkatan: '',
  status_aktif: 1,
})
const loading = ref(false);

// handler
const modalClose = () => {
  isOpen.value = false
  resetForm()
}
const handleSave = async () => {
  try {
    loading.value = true
    let response
    // jika null maka create, jika ada idnya maka update
    if (!formData.value.id) {
      response = await Api.post('master/jenis_referensi',  formData.value)
    } else {
      response = await Api.put('master/jenis_referensi', formData.value.id,  formData.value)
    }
    await swalSuccess(response.message)
    emit('simpan', 'tableJenisReferensi', formData.value) // emit untuk kirim ke parent
    modalClose()
  } catch (error) {
    await swalError(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}
const resetForm = () => {
  formData.value = { id: null, deskripsi: '', singkatan: '', status_aktif: 1 }
}
const fetchById = async (param1) => {
  try {
    let response = await Api.getById('master/jenis_referensi', param1)
    const res = response.data
    formData.value = {
      id: res.id,
      deskripsi: res.deskripsi,
      singkatan: res.singkatan,
      status_aktif: res.status_aktif
    }
  } catch (error) {
    await swalError(getErrorMessage(error))
  }
}

// load awal/ watch
watch(isOpen, async (val) => {
  if (val) { // Jika modal terbuka
    if (props.propsParams.flagging === 'update' && props.propsParams.id) {
      // // Fetch data dari backend berdasarkan ID
      await fetchById(props.propsParams.id)
    } else {
      resetForm()
      // Jika mode create, reset form
      // formData.value = { deskripsi: '', singkatan: '' }
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
  >
    <b-form>
      <b-form-group label="Deskripsi">
        <b-form-input v-model="formData.deskripsi" />
      </b-form-group>

      <b-form-group label="Singkatan">
        <b-form-input v-model="formData.singkatan" />
      </b-form-group>

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

    </b-form>

    <template #footer>
      <b-button size="sm" variant="danger-subtle" @click="modalClose">Batal</b-button>
      <b-button size="sm" variant="primary-subtle" @click="handleSave">{{ props.propsParams.flagging === 'update' ? 'Ubah' : 'Simpan' }}</b-button>
    </template>
  </b-modal>
</template>