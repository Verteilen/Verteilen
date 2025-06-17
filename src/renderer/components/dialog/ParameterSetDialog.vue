<script setup lang="ts">
import { computed } from 'vue'

const data = defineModel<boolean>()
const 

const temp_name = computed(() => {
    if(data.value.editData.temp == undefined) return ''
    return data.value.temps.find(x => x.value == data.value.editData.temp)?.text
})
</script>

<template>
    <DialogBase width="500" v-model="data.createParameterModal">
        <template #title v-if="!data.editMode">
            <v-icon>mdi-hammer</v-icon>
            {{ $t('modal.new-parameter-set') }}
        </template>
        <template #title v-else>
            <v-icon>mdi-pencil</v-icon>
            {{ $t('modal.edit-parameter-set') }}
        </template>
        <template #text>
            <v-text-field :error="data.titleError" v-model="data.editData.name" required :label="$t('modal.enter-parameter-set-name')" hide-details></v-text-field>
            <v-btn class="mt-3 w-100" color="primary" variant="outlined" @click="openSelectTemp">
                <span v-if="temp_name">
                    {{ temp_name }}
                </span>
                <span v-else>
                    {{ $t('useTemplate') }}
                </span>
            </v-btn>
        </template>
        <template #action>
            <v-btn class="mt-3" color="primary" v-if="!data.editMode" @click="confirmCreateSet">{{ $t('create') }}</v-btn>
            <v-btn class="mt-3" color="primary" v-else @click="confirmEditSet">{{ $t('modify') }}</v-btn>
        </template>
    </DialogBase>
</template>