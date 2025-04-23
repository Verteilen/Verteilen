<script setup lang="ts">
import { Ref, ref } from 'vue';
import { Node, Parameter, Project, Record } from '../../interface';
import DialogBase from './DialogBase.vue';

interface PROP {
    projects: Array<Project>
    nodes: Array<Node>
    parameters: Array<Parameter>
}

const modal = defineModel<boolean>({ required: true })
const props = defineProps<PROP>()
const emits = defineEmits<{
    (e: 'confirm', name:string, record:Record):void
}>()

const name:Ref<string> = ref('')
const buffer:Ref<Record> = ref({projects: [], nodes: []})

const confirm = () => {
    emits('confirm', name.value, buffer.value)
}
</script>

<template>
    <DialogBase v-model="modal" :width="800">
        <template #title>
            <v-icon>mdi-console</v-icon>
            {{ $t('modal.console-create') }}
        </template>
        <template #text>

        </template>
        <template #action>
            <v-btn class="mt-3" color="primary" @click="confirm">{{ $t('create') }}</v-btn>
        </template>
    </DialogBase>
</template>