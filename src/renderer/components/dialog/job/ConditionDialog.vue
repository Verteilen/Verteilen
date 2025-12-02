<script lang="ts" setup>
//#region Modules
import { Emitter } from 'mitt'
import { 
    BusType,
    KeyValue,
    TaskLogicType, 
} from 'verteilen-core/dist/interface'
import { i18n } from '../../../plugins/i18n'
import { inject, onMounted, ref, Ref } from 'vue'
import { BackendProxy } from '../../../proxy'
//#endregion

//#region Views
import DialogBase from './../DialogBase.vue'
//#endregion

//#region Data
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const backend:Ref<BackendProxy> = inject('backend')!
const modal = defineModel<boolean>({ required: true })
const emits = defineEmits<{
    (e: 'confirm', index:number):void
}>()
const items:Ref<Array<KeyValue>> = ref([])
const selected = ref(0)

const updateLocate = () => {
    items.value = Object.keys(TaskLogicType).filter(key => isNaN(Number(key))).map((x, index):KeyValue => {
        return {
            key: $t(`condition.${x.toLowerCase()}`),
            value: index
        }
    })
}

const confirm = () => {
    emits('confirm', selected.value)
}
const cancel = () => {
    modal.value = false
}

onMounted(() => {
    updateLocate()
})
</script>

<template>
    <DialogBase v-model="modal">
        <template #title>
            <v-icon>mdi-tag-plus</v-icon>
            {{ $t('modal.new-condition') }}
        </template>
        <template #text>
            <v-select v-model="selected" :items="items" item-title="key" item-value="value">
                
            </v-select>
        </template>
        <template #action>
            <v-btn class="mt-3" color="primary" @click="confirm">{{ $t('create') }}</v-btn>
            <v-btn class="mt-3" color="error" @click="cancel">{{ $t('cancel') }}</v-btn>
        </template>
    </DialogBase>
</template>