<script lang="ts" setup>
//#region Modules
import { Emitter } from 'mitt'
import { BusType, JobTable, Preference } from 'verteilen-core/src/interface'
import { i18n } from 'verteilen-core/src/plugins/i18n'
import { inject, ref, Ref } from 'vue'
import { BackendProxy } from '../../proxy'
//#endregion

//#region Views
import DialogBase from './DialogBase.vue'
//#endregion

//#region Data
interface PROPS {
    select: JobTable
}
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const backend:Ref<BackendProxy> = inject('backend')!
const preference:Ref<Preference> = inject('preference')!
const modal = defineModel<boolean>({ required: true })
const item:Ref<JobTable | undefined> = ref(undefined)
//#endregion
</script>

<template>
    <DialogBase persistent width="90vw" v-model="modal" class="text-white" :preference="preference">
        <template #title>
            <v-icon>mdi-briefcase</v-icon>
            {{ item?.uuid }}
        </template>
    </DialogBase>
</template>