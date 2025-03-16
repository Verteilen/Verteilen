<script setup lang="ts">
import { onMounted, onUnmounted, Ref, ref } from 'vue';
import { Parameter } from '../../../interface';

const data = defineModel<Parameter>()
const fields:Ref<Array<any>> = ref([
    { title: 'Name', align: 'center', key: 'name' },
    { title: 'Type', align: 'center', key: 'type' },
    { title: 'Value', align: 'center', key: 'value' },
])

onMounted(() => {
    
})

onUnmounted(() => {
    
})

</script>

<template>
    <v-container v-if="data != undefined" class="pt-4" style="max-height: 90vh; overflow-y: auto;">
        <v-data-table :items="data.containers" :headers="fields">
            
        </v-data-table>
    </v-container>
</template>

<style scoped>

</style>
