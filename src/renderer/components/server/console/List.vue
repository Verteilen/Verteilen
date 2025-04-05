<script setup lang="ts">
import { onMounted, onUnmounted, Ref, ref } from 'vue';
import { ExecuteRecord, ExecuteStateText, Preference } from '../../../interface';

interface PROPS {
    preference: Preference
}

const data = defineModel<ExecuteRecord>()
    const props = defineProps<PROPS>()
const fields:Ref<Array<any>> = ref([
    { title: 'Title', align: 'center', key: 'title' },
    { title: 'Description', align: 'center', key: 'description' },
    { title: 'State', align: 'center', key: 'state' },
])

onMounted(() => {
    
})

onUnmounted(() => {
    
})

</script>

<template>
    <v-container v-if="data != undefined" class="pt-4" style="max-height: 90vh; overflow-y: auto;">
        <v-data-table :items="data.projects" :headers="fields" :style="{ 'fontSize': props.preference.font + 'px' }">
            <template v-slot:item.title="{ index, item }">
                <span v-if="data.project_index == index" class="mr-2"><v-icon icon="mdi-arrow-right"></v-icon></span>
                <span>{{ item.title }}</span>
            </template>
            <template v-slot:item.state="{ index }">
                <v-chip>
                    {{ $t(ExecuteStateText[data.project_state[index].state]) }}
                </v-chip>
            </template>
        </v-data-table>
    </v-container>
</template>

<style scoped>

</style>
