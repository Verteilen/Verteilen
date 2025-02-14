<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, Log } from '../../interface';
import { isElectron } from '../../main';

const emitter:Emitter<BusType> | undefined = inject('emitter');
const leftSize = ref(3)
const rightSize = ref(9)
const selection:Ref<Array<number>> = ref([])

interface PROPS {
    logs: Log
}
const props = defineProps<PROPS>()

const updateLog = (log:Log) => {
    if(!isElectron) return
    window.electronAPI.send('save_log', JSON.stringify(log, null, 4))
}

const clean = () => {

}

onMounted(() => {
    emitter?.on('updateLog', updateLog)
})

onUnmounted(() => {
    emitter?.off('updateLog', updateLog)
})

</script>

<template>
    <b-container fluid>
        <b-row style="height: calc(100vh - 55px)" class="w-100">
            <b-col :cols="leftSize" style="border-right: brown 1px solid;">
                <b-button-group class="my-3 w-100">
                    <b-button @click="clean" variant="success">{{ $t('clear') }}</b-button>
                </b-button-group>
                {{ selection }}
                <v-list v-model:selected="selection">
                    <v-list-item v-for="(item, i) in props.logs.logs" :key="i" :value="i">
                        {{ item.project.title }}
                    </v-list-item>
                </v-list>
            </b-col>
            <b-col :cols="rightSize">
                
            </b-col>
        </b-row>
    </b-container>
</template>

<style scoped>

</style>
