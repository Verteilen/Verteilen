<script setup lang="ts">
import { computed } from 'vue'
import { DialogDATACreateSet } from '../../util/parameter';
import DialogBase from '../dialog/DialogBase.vue'

const data = defineModel<boolean>()
const props = defineProps<DialogDATACreateSet>()
const emits = defineEmits<{
    (e: 'confirm-create'): void
    (e: 'confirm-edit'): void
}>()

const temp_name = computed(() => {
    if(props.targetData.temp == undefined) return ''
    return props.temps.find(x => x.value == props.targetData.temp)?.text
})

const openSelectTemp = () => {

}

const confirm = () => {
    if(props.isEdit) emits('confirm-edit')
    else emits('confirm-create')
}
</script>

<template>
    <DialogBase width="500" v-model="data!">
        <template #title v-if="!props.isEdit">
            <v-icon>mdi-hammer</v-icon>
            {{ $t('modal.new-parameter-set') }}
        </template>
        <template #title v-else>
            <v-icon>mdi-pencil</v-icon>
            {{ $t('modal.edit-parameter-set') }}
        </template>
        <template #text>
            <v-text-field :error="props.titleError" v-model="props.targetData.name" required :label="$t('modal.enter-parameter-set-name')" hide-details></v-text-field>
            <v-btn v-if="!props.isEdit" class="mt-3 w-100" color="primary" variant="outlined" @click="openSelectTemp">
                <span v-if="temp_name">
                    {{ temp_name }}
                </span>
                <span v-else>
                    {{ $t('useTemplate') }}
                </span>
            </v-btn>
        </template>
        <template #action>
            <v-btn class="mt-3" color="primary" @click="confirm">{{ $t(props.isEdit ? 'modify' : 'create') }}</v-btn>
        </template>
    </DialogBase>
</template>