<script setup lang="ts">
import { ref, watch } from 'vue';

interface PROPS {
    defaultValue?: number
    title?: string
    label?: string
    icon?: string
}

const props = defineProps<PROPS>()
const data = defineModel<boolean>()
const emit = defineEmits<{
    (e: 'submit', data:number): void
}>()
const buffer = ref(0)

const confirm = () => {
    data.value = false
    emit('submit', buffer.value)
}
watch(() => data.value, () => {
    buffer.value = props.defaultValue ? props.defaultValue : 0
})

</script>
<template>
    <v-dialog v-model="data" width="500">
        <v-card>
            <v-card-title>
                <v-icon>{{ props.icon }}</v-icon>
                {{ props.title }}
            </v-card-title>
            <v-card-title>
                <v-text-field type="number" v-model="buffer" hide-details :label="props.label"></v-text-field>
            </v-card-title>
            <template v-slot:actions>
                <v-btn class="mt-3" color="primary" @click="confirm">{{ $t('confirm') }}</v-btn>
            </template>
        </v-card>
    </v-dialog>
</template>