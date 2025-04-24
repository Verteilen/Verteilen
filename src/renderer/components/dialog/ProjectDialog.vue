<script setup lang="ts">
import { computed, Ref, ref, watch } from 'vue';
import { CreateField, DialogDATA } from '../../util/project';
import DialogBase from './DialogBase.vue';

const data = defineModel<boolean>({ required: true })
const props = defineProps<DialogDATA>()
const emits = defineEmits<{
    (e: 'submit', d:CreateField): void
}>()
const buffer:Ref<CreateField> = ref({title: "", description: "", usePara: false, useTemp: false, temp: null, parameter: null})

const paras = computed(() => {
    return props.parameters.map((x, index) => {
        return {
            value: x.uuid,
            title: x.title,
            uuid: x.uuid
        }
    })
})

const convert = computed(() => {
    return {
        ...buffer.value,
        useTemp: buffer.value.temp != null,
        usePara: buffer.value.parameter != null
    }
})

const itemProps = (item:any) => {
    return {
        title: item.title,
        subtitle: item.uuid
    }
}

watch(() => data.value, () => {
    if(props.isEdit) buffer.value = props.editData
    else buffer.value = {title: "", description: "", useTemp: false, usePara: false, temp: null, parameter: null}
})

const confirm = () => {
    emits('submit', convert.value)
}

</script>

<template>
    <DialogBase width="500" v-model="data">
        <template #title>
            <div v-if="props.isEdit">
                <v-icon>mdi-pencil</v-icon>
                {{ $t('modal.modify-project') }}
            </div>
            <div v-else>
                <v-icon>mdi-hammer</v-icon>
                {{ $t('modal.new-project') }}
            </div>
        </template>
        <template #text>
            <v-text-field :error="props.titleError" v-model="buffer.title" required :label="$t('modal.enter-project-name')" hide-details></v-text-field>
            <v-text-field class="mt-3" v-model="buffer.description" :label="$t('modal.enter-project-description')" hide-details></v-text-field>
            <div v-if="!props.isEdit">
                <br />
                <v-autocomplete clearable v-model="buffer.temp" :items="props.temps" item-title="text" :label="$t('useTemplate')" hide-details></v-autocomplete>
                <br />
                <v-checkbox v-model="buffer.usePara" :label="$t('useExistParameter')" hide-details></v-checkbox>
                <v-autocomplete v-if="buffer.usePara" :item-props="itemProps" v-model="buffer.parameter" clearable :items="paras" item-title="text" :label="$t('parameter')" hide-details></v-autocomplete>
            </div>
            <p v-if="props.errorMessage.length > 0" class="mt-3 text-red">{{ props.errorMessage }}</p>
        </template>
        <template #action>
            <v-btn class="mt-3" color="primary" @click="confirm">{{ $t(props.isEdit ? 'modify' : 'create') }}</v-btn>
        </template>
    </DialogBase>
</template>