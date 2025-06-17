<script setup lang="ts">
import { computed } from 'vue';
import { DialogDATACreate } from '../../util/parameter';
import DialogBase from './DialogBase.vue';

const data = defineModel<boolean>()
const props = defineProps<DialogDATACreate>()
const emits = defineEmits<{
    (e: 'confirm-create'): void
    (e: 'confirm-edit'): void
}>()

const only_options = computed(() => {
    return props.options.filter(x => x.title != "All")
})

const confirm = () => {
    if(props.isEdit) emits('confirm-edit')
    else emits('confirm-create')
}

</script>

<template>
    <DialogBase width="500" v-model="data!" class="text-white">
        <template #title v-if="props.isEdit">
            <v-icon>mdi-pencil</v-icon>
            {{ $t('modal.edit-parameter') }}
        </template>
        <template #title v-else>
            <v-icon>mdi-hammer</v-icon>
            {{ $t('modal.new-parameter') }}
        </template>
        <template #text>
            <v-text-field :error="props.titleError" v-model="props.targetData.name" required :label="$t('modal.enter-parameter-name')" hide-details></v-text-field>
            <v-select class="mt-3" v-model="props.targetData.type" :items="only_options" :label="$t('modal.parameter-datatype')" hide-details></v-select>
            <v-checkbox :label="$t('filter.show-hidden')" v-model="props.targetData.hidden" hide-details></v-checkbox>
            <v-checkbox :label="$t('filter.show-runtime')" v-model="props.targetData.runtimeOnly" hide-details></v-checkbox>
            <p v-if="props.errorMessage.length > 0" class="mt-3 text-red">{{ props.errorMessage }}</p>
        </template>
        <template #action>
            <v-btn class="mt-3" color="primary" @click="confirm">{{ $t(props.isEdit ? 'modify' : 'create') }}</v-btn>
        </template>
    </DialogBase>
</template>