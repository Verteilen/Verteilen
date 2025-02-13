<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { ExecuteRecord, ExecuteStateText } from '../../../interface';

const data = defineModel<ExecuteRecord>()
const fields = ref(["title", "description", "state"])

onMounted(() => {
    
})

onUnmounted(() => {
    
})

</script>

<template>
    <b-container v-if="data != undefined" class="pt-4" style="max-height: 90vh; overflow-y: auto;">
        <b-table dark striped hover :items="data.projects" :fields="fields">
            <template #cell(title)="d">
                <span v-if="data.project_index == d.index" class="mr-2"><v-icon icon="mdi-arrow-right"></v-icon></span>
                <span>{{ d.item.title }}</span>
            </template>
            <template #cell(state)="d">
                {{ ExecuteStateText[data.project_state[d.index].state] }}
            </template>
        </b-table>
    </b-container>
</template>

<style scoped>

</style>
