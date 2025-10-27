<script setup lang="ts">
import { computed, ref, Ref, watch } from 'vue';
import { CreateField, DialogDATA } from '../server/Task';
import DialogBase from './DialogBase.vue';
import { i18n } from '../../plugins/i18n';

const data = defineModel<boolean>()
const props = defineProps<DialogDATA>()
const emits = defineEmits<{
    (e: 'submit', d:CreateField): void
}>()
const buffer:Ref<CreateField> = ref({cronjob: false, cronjobKey: "", title: "", description: "", setupjob: false, multi: false, multiKey: ""})
const types = ref([
    "singlejob",
    "setupjob",
    "cronjob",
    "multicore",
])
const select_type = ref(0)

const types_items = computed(() => {
    return types.value.map((x, i) => ({title: i18n.global.t(x), value: i}))
})

const get_type = (cf:CreateField) => {
    if(cf.setupjob) return 1
    else if(cf.cronjob && cf.multi) return 3
    else if(cf.cronjob) return 2
    else return 0
}

watch(() => data.value, () => {
    if(props.isEdit) buffer.value = props.editData
    else buffer.value = {cronjob: false, cronjobKey: "", title: "", description: "", setupjob: false, multi: false, multiKey: ""}
    if (!data.value) select_type.value = 0
    else select_type.value = get_type(props.editData)
})

const type_change = () => {
    if(select_type.value == 0) {
        buffer.value.setupjob = false
        buffer.value.cronjob = false
        buffer.value.multi = false
    } else if(select_type.value == 1) {
        buffer.value.setupjob = true
        buffer.value.cronjob = false
        buffer.value.multi = false
    } else if(select_type.value == 2) {
        buffer.value.setupjob = false
        buffer.value.cronjob = true
        buffer.value.multi = false
    } else if(select_type.value == 3) {
        buffer.value.setupjob = false
        buffer.value.cronjob = true
        buffer.value.multi = true
    }
}

const confirm = () => emits('submit', buffer.value)
</script>

<template>
    <DialogBase width="500" v-model="data!" class="text-white" :preference="props.preference">
        <template #title v-if="!props.isEdit">
            <v-icon>mdi-hammer</v-icon>
            {{ $t('modal.new-task') }}
        </template>
        <template #title v-else>
            <v-icon>mdi-pencil</v-icon>
            {{ $t('modal.modify-task') }}
        </template>
        <template #text>
            <v-text-field :error="titleError" v-model="buffer.title" :autofocus="true" required :label="$t('modal.enter-task-name')" hide-details></v-text-field>
            <v-text-field class="mt-3" v-model="buffer.description" :label="$t('modal.enter-task-description')" hide-details></v-text-field>
            <br />
            <v-select class="mb-2" :label="$t('headers.type')" v-model.number="select_type" :items="types_items" :item-props="true" hide-details @update:modelValue="type_change"></v-select>
            <v-select class="mb-2" :label="$t('headers.cronjob')" v-if="!buffer.setupjob && buffer.cronjob" v-model="buffer.cronjobKey" :items="para_keys" :item-props="true" hide-details></v-select>
            <v-select class="mb-2" :label="$t('headers.multi')" v-if="!buffer.setupjob && buffer.cronjob && buffer.multi" v-model="buffer.multiKey" :items="props.para_keys" :item-props="true" hide-details></v-select>
        </template>
        <template #action>
            <v-btn class="mt-3" color="primary" @click="confirm">{{ $t(props.isEdit ? 'modify' : 'create') }}</v-btn>
        </template>
    </DialogBase>
</template>