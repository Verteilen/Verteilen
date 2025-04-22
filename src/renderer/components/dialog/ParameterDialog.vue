<script setup lang="ts">
import { Ref, ref, watch } from 'vue';
import { CreateField, DialogDATA } from '../../util/parameter';

const data = defineModel<boolean>()
const props = defineProps<DialogDATA>()
const emits = defineEmits<{
    (e: 'submit', d:CreateField): void
}>()
const buffer:Ref<CreateField> = ref({title: ""})

watch(() => data.value, () => {
    if(props.isEdit) buffer.value = props.editData
    else buffer.value = {title: ""}
})

const confirm = () => {
    emits('submit', buffer.value)
}

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
                <p v-if="props.errorMessage.length > 0" class="mt-3 text-red">{{ props.errorMessage }}</p>
            </v-card-text>
            <template v-slot:actions>
                <v-btn class="mt-3" color="primary" @click="confirm">{{ $t(props.isEdit ? 'modify' : 'create') }}</v-btn>
            </template>
        </v-card>
    </v-dialog>
</template>