<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted } from 'vue';
import { BusType, Log } from '../../interface';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    logs: Log
}
const props = defineProps<PROPS>()

const updateLog = (log:Log) => {
    
}

onMounted(() => {
    emitter?.on('updateLog', updateLog)
})

onUnmounted(() => {
    emitter?.off('updateLog', updateLog)
})

</script>

<template>
    <div>
        
    </div>
</template>

<style scoped>

</style>
