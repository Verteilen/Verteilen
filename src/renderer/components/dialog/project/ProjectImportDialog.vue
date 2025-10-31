<script lang="ts" setup>
import { i18n } from 'verteilen-core/src/plugins/i18n';
import DialogBase from './../DialogBase.vue';

const $t = i18n.global.t
const data = defineModel<boolean>({ required: true })
const data2 = defineModel<File[]>("files", { required: true })
const emits = defineEmits<{
    (e: 'confirm'):void
}>()
</script>

<template>
    <DialogBase width="800" v-model="data" class="text-white">
        <template #title>
            <v-icon>mdi-import</v-icon>
            {{ $t('modal.import-project') }}
        </template>
        <template #text>
            <v-file-upload v-model="data2" show-size clearable multiple density="default"></v-file-upload>
        </template>
        <template #action>
            <v-btn class="mt-3" :disabled="data2.length == 0" color="primary" @click="emits('confirm')">{{ $t('import') }}</v-btn>
        </template>
    </DialogBase>
</template>