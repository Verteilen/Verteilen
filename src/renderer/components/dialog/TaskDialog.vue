<script setup lang="ts">
import { ref, Ref, watch } from 'vue';
import { CreateField, DialogDATA } from '../../util/Task';

const data = defineModel<boolean>()
const props = defineProps<DialogDATA>()
    const emits = defineEmits<{
    (e: 'submit', d:CreateField): void
}>()
const buffer:Ref<CreateField> = ref({cronjob: false, cronjobKey: "", title: "", description: "", setupjob: false, multi: false, multiKey: ""})

watch(() => data.value, () => {
    if(props.isEdit) buffer.value = props.editData
    else buffer.value = {cronjob: false, cronjobKey: "", title: "", description: "", setupjob: false, multi: false, multiKey: ""}
})

const confirm = () => emits('submit', buffer.value)
</script>

<template>
    <v-dialog width="500" v-model="data" class="text-white">
        <v-card>
            <v-card-title v-if="!props.isEdit">
                <v-icon>mdi-hammer</v-icon>
                {{ $t('modal.new-task') }}
            </v-card-title>
            <v-card-title v-else>
                <v-icon>mdi-pencil</v-icon>
                {{ $t('modal.modify-task') }}
            </v-card-title>
            <v-card-text>
                <v-text-field :error="titleError" v-model="buffer.title" required :label="$t('modal.enter-task-name')" hide-details></v-text-field>
                <v-text-field class="mt-3" v-model="buffer.description" :label="$t('modal.enter-task-description')" hide-details></v-text-field>
                <br />
                <v-checkbox v-model="buffer.setupjob" :label="$t('setupjob')" hide_details></v-checkbox>
                <v-checkbox v-if="!buffer.setupjob" v-model="buffer.cronjob" :label="$t('cronjob')" hide_details></v-checkbox>
                <v-select v-if="!buffer.setupjob && buffer.cronjob" v-model="buffer.cronjobKey" :items="para_keys" hide-details></v-select>
                <br />
                <v-checkbox v-if="!buffer.setupjob && buffer.cronjob" v-model="buffer.multi" :label="$t('multicore')" hide_details></v-checkbox>
                <v-select v-if="!buffer.setupjob && buffer.cronjob && buffer.multi" v-model="buffer.multiKey" :items="props.para_keys" hide-details></v-select>
                <p v-if="errorMessage.length > 0" class="mt-3 text-red">{{ errorMessage }}</p>
            </v-card-text>
            <template v-slot:actions>
                <v-btn class="mt-3" color="primary" @click="confirm">{{ $t(props.isEdit ? 'modify' : 'create') }}</v-btn>
            </template>
        </v-card>
    </v-dialog>
</template>