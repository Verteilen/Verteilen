<script lang="ts" setup>
//#region Modules
import { Emitter } from 'mitt'
import { 
    BusType, 
} from 'verteilen-core/src/interface'
import { i18n } from '../../../plugins/i18n'
import { inject, Ref } from 'vue'
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

const confirm = () => {

}
const cancel = () => {
    modal.value = false
}
</script>

<template>
    <DialogBase v-model="modal">
        <template #title>
            <v-icon>mdi-tag-plus</v-icon>
            {{ $t('modal.new-condition') }}
        </template>
        <template #text>

        </template>
        <template #action>
            <v-btn class="mt-3" color="primary" @click="confirm">{{ $t('create') }}</v-btn>
            <v-btn class="mt-3" color="error" @click="cancel">{{ $t('cancel') }}</v-btn>
        </template>
    </DialogBase>
</template>