<script setup lang="ts">
import { onMounted, onUnmounted, Ref, ref } from 'vue';
import colors from 'vuetify/lib/util/colors.mjs';
import { ExecuteRecord, ExecuteState } from '../../../interface';

const data = defineModel<ExecuteRecord>()
const totalLength = ref(4)
const panelValue:Ref<Array<number>> = ref([])

const getStateColor = (state:number):string => {
    if (state == ExecuteState.NONE) return colors.teal.base
    else if (state == ExecuteState.RUNNING) return colors.indigo.lighten1
    else if (state == ExecuteState.FINISH) return colors.green.base
    else return colors.red.darken4
}

const page = (r:number):number => {
    const length = Math.ceil(data.value!.task_state.length / totalLength.value)
    if(r != length) return totalLength.value
    else return data.value!.task_state.length % totalLength.value
}

const getindex = (r:number, i:number):number => {
    return (r - 1) * totalLength.value + (i - 1)
}

const getselect = (r:number):Array<number> => {
    const select = data.value!.task_index
    if (r - 1 >= select && (r - 1) * totalLength.value - 1 <= select) return [select % data.value!.task_state.length]
    else return []
}

onMounted(() => {
    
})

onUnmounted(() => {
    
})

</script>

<template>
    <b-container v-if="data != undefined" class="pt-4" style="max-height: 90vh; overflow-y: auto;">
        <v-card v-if="data.project_index >= 0">
            <v-card-title>
                {{ $t('project') }}: {{ data.projects[data.project_index]?.title }}
            </v-card-title>
            <v-card-text>
                <p>{{ $t('is-running') }}: 
                    <v-icon v-if="data.running" color="success" icon="mdi-checkbox-marked-circle" end ></v-icon>
                    <v-icon v-else color="danger" icon="mdi-cancel" end ></v-icon>
                </p>
                <p>{{ $t('is-stop') }}:
                    <v-icon v-if="data.stop" color="success" icon="mdi-checkbox-marked-circle" end ></v-icon>
                    <v-icon v-else color="danger" icon="mdi-cancel" end ></v-icon>
                </p>
            </v-card-text>
        </v-card>
        <v-stepper v-if="data.project_index >= 0" :value="getselect(r)" v-for="r in Math.ceil(data.task_state.length / totalLength)" :key="r" :mandatory="false" multiple>
            <v-stepper-header>
                <template v-for="i in page(r)" :key="i">
                    <v-divider v-if="i - 1" />
                    <v-stepper-item 
                        class="px-4 py-3 my-1"
                        style="background-color: transparent;"
                        :style="{ 'color': getStateColor(data.task_state[getindex(r, i)]?.state ?? 0) }"
                        :value="getindex(r, i)"
                        :title="data.projects[data.project_index]?.task[getindex(r, i)]?.title ?? ''"
                        :complete="data.task_state[getindex(r, i)]?.state == 2">
                    </v-stepper-item>
                </template>
                
            </v-stepper-header>
        </v-stepper>
        <br /> <br />
        <v-expansion-panels v-if="data.project_index >= 0" v-model="panelValue">
            <v-expansion-panel v-for="(task, i) in data.task_detail" :key="i"
                class="w-100 text-white mb-3 px-4">
                <v-expansion-panel-title :style="{ 'color': getStateColor(task.state) }" style="background-color: transparent;">
                    Index: {{ task.index }}
                </v-expansion-panel-title>
                <v-expansion-panel-text class="py-3" style="min-height: 50px;">
                    <p style="line-height: 15px; margin: 3px; text-align: left;" v-for="(text, j) in task.message" :key="j"> {{ text }} </p>    
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
        <br /> <br />
    </b-container>
</template>

<style scoped>

</style>
