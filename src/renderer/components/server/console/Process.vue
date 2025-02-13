<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import colors from 'vuetify/lib/util/colors.mjs';
import { ExecuteRecord, ExecuteState } from '../../../interface';

const data = defineModel<ExecuteRecord>()
const totalLength = ref(4)
const test =ref([])

const getStateColor = (state:number):string => {
    if (state == ExecuteState.NONE) return colors.teal.base
    else if (state == ExecuteState.RUNNING) return colors.indigo.darken3
    else if (state == ExecuteState.FINISH) return colors.green.darken3
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
        <v-stepper :value="getselect(r)" v-for="r in Math.floor(data.task_state.length / 3)" :key="r" :mandatory="false" multiple>
            <v-stepper-header>
                <template v-for="i in page(r)" :key="i">
                    <v-divider v-if="i - 1" />
                    <v-stepper-item 
                        class="px-4 py-3 my-1"
                        style="background-color: transparent;"
                        :style="{ 'color': getStateColor(data.task_state[getindex(r, i)]?.state) }"
                        :value="getindex(r, i)"
                        :title="data.projects[data.project_index].task[getindex(r, i)]?.title"
                        :complete="data.task_state[getindex(r, i)]?.state == 2">
                    </v-stepper-item>
                </template>
                
            </v-stepper-header>
        </v-stepper>
        <br /> <br />
        <b-card no-body v-for="(task, i) in data.task_detail" :key="i" bg-variant="dark" :style="{ 'border-color': getStateColor(task.state) }" class="w-100 text-white mb-3 px-4">
            <b-card-header class="py-1">
                <span style="margin-right: 10px;">Index: {{ task.index }}</span> 
                <b-spinner small v-if="task.node.length > 0"></b-spinner>
            </b-card-header>
            <b-card-text v-if="task.node.length > 0" class="py-3" style="min-height: 50px;">
                <p style="line-height: 15px; margin: 3px; text-align: left;" v-for="(text, j) in task.message" :key="j"> {{ text }} </p>
            </b-card-text>
        </b-card>
        <br /> <br />
    </b-container>
</template>

<style scoped>

</style>
