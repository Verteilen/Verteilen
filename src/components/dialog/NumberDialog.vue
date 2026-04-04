<script setup lang="ts">
//#region Modules
import { inject, ref, watch } from 'vue';
import { Preference } from '../../interface';
import DialogBase from './DialogBase.vue';
import { i18n } from '../../plugins/i18n';
//#endregion

//#region Data
interface PROPS {
    defaultValue?: number
    title?: string
    label?: string
    icon?: string
}
const $t = i18n.global.t
const preference:Preference = inject("preference")!
const props = defineProps<PROPS>()
const data = defineModel<boolean>()
const emit = defineEmits<{
    (e: 'submit', data:number): void
}>()
const buffer = ref(0)
//#endregion

//#region Watch
watch(() => data.value, () => {
    buffer.value = props.defaultValue ? props.defaultValue : 0
})
//#endregion

//#region Methods
const confirm = () => {
    data.value = false
    emit('submit', buffer.value)
}
//#endregion
</script>
<template>
    <DialogBase v-model="data!" width="500" :preference="preference">
        <template #title>
            <v-icon>{{ props.icon }}</v-icon>
            {{ props.title }}
        </template>
        <template #text>
            <v-text-field type="number" v-model="buffer" hide-details :label="props.label"></v-text-field>
        </template>
        <template #action>
            <v-btn class="mt-3" color="primary" @click="confirm">{{ $t('confirm') }}</v-btn>
        </template>
    </DialogBase>
</template>