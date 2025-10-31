<script lang="ts" setup>
import { i18n } from 'verteilen-core/src/plugins/i18n';
import DialogBase from './DialogBase.vue';

//#region Data
const $t = i18n.global.t
const data = defineModel<boolean>({ required: true })
const props = defineProps<{
    title?: string
    text?: string
    width?: string
    height?: string
    persistent?:boolean
    color?:string
    nocard?: boolean
    data?:Array<string>
}>()
const emits = defineEmits<{
    (e: 'cancel'):void
    (e: 'delete'):void
}>()
//#endregion
</script>

<template>
    <DialogBase width="800" v-model="data" class="text-white">
        <template #title>
            <v-icon>mdi-delete</v-icon>
            {{ props.title }}
        </template>
        <template #text>
            <p>{{ props.text }}</p>
            <br />
            <p v-for="(p, i) in props.data">
                {{ i }}. {{ p }}
            </p>
            <slot></slot>
        </template>
        <template #action>
            <v-btn class="mt-3" color="primary" @click="emits('cancel')">{{ $t('cancel') }}</v-btn>
            <v-btn class="mt-3" color="error" @click="emits('delete')">{{ $t('delete') }}</v-btn>
        </template>
    </DialogBase>
</template>