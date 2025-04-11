<script setup lang="ts">
import { computed, Ref, ref, watch } from 'vue';
import { CreateField, DialogDATA } from '../../util/project';

const data = defineModel<boolean>()
const props = defineProps<DialogDATA>()
const emits = defineEmits<{
    (e: 'submit', d:CreateField): void
}>()
const buffer:Ref<CreateField> = ref({title: "", description: "", useTemp: false, temp: null})

const convert = computed(() => {
    return {
        ...buffer.value,
        useTemp: buffer.value.temp != null
    }
})

watch(() => data.value, () => {
    if(props.isEdit) buffer.value = props.editData
    else buffer.value = {title: "", description: "", useTemp: false, temp: null}
})

const confirm = () => emits('submit', convert.value)

</script>

<template>
    <v-dialog width="500" v-model="data" class="text-white">
        <v-card>
            <v-card-title v-if="props.isEdit">
                <v-icon>mdi-pencil</v-icon>
                {{ $t('modal.modify-project') }}
            </v-card-title>
            <v-card-title v-else>
                <v-icon>mdi-hammer</v-icon>
                {{ $t('modal.new-project') }}
            </v-card-title>
            <v-card-text>
                <v-text-field :error="props.titleError" v-model="buffer.title" required :label="$t('modal.enter-project-name')" hide-details></v-text-field>
                <v-text-field class="mt-3" v-model="buffer.description" :label="$t('modal.enter-project-description')" hide-details></v-text-field>
                <div v-if="!props.isEdit">
                    <br />
                    <v-autocomplete clearable v-model="buffer.temp" :items="props.temps" item-title="text" :label="$t('useTemplate')" hide-details></v-autocomplete>
                </div>
                <p v-if="props.errorMessage.length > 0" class="mt-3 text-red">{{ props.errorMessage }}</p>
            </v-card-text>
            <template v-slot:actions>
                <v-btn class="mt-3" color="primary" @click="confirm">{{ $t(props.isEdit ? 'modify' : 'create') }}</v-btn>
            </template>
        </v-card>
    </v-dialog>
</template>