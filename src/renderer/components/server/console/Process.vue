<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import colors from 'vuetify/lib/util/colors.mjs';
import { ExecuteRecord, ExecuteState } from '../../../interface';

const data = defineModel<ExecuteRecord>()

const getStateColor = (state:number):string => {
    if (state == ExecuteState.NONE) return colors.teal.base
    else if (state == ExecuteState.RUNNING) return colors.indigo.darken3
    else if (state == ExecuteState.FINISH) return colors.green.darken3
    else return colors.red.darken4
}

onMounted(() => {
    
})

onUnmounted(() => {
    
})

</script>

<template>
    <b-container v-if="data != undefined" class="pt-4" style="max-height: 90vh; overflow-y: auto;">
        <v-stepper v-model="data.task_index">
            <v-stepper-header>
                <div v-for="(c, i) in data.task_state" :key="i">
                    <v-stepper-item 
                        :style="{ 'backgroundColor': getStateColor(c.state) }"
                        :value="i"
                        :title="data.projects[data.project_index].task[i].title"
                        :complete="c.state == 2">
                    </v-stepper-item>
                    <v-divider color="white" v-if="i < data.task_state.length"></v-divider>
                </div>
            </v-stepper-header>
        </v-stepper>
        <br /> <br />
        <b-card no-body v-for="(task, i) in data.task_detail" :key="i" bg-variant="dark" :style="{ 'border-color': getStateColor(task.state) }" class="w-100 text-white mb-3 px-4">
            <b-card-header>
                <span style="margin-right: 10px;">Index: {{ task.index }}</span> <b-spinner small v-if="task.node.length > 0"></b-spinner>
            </b-card-header>
            <b-card-text v-if="task.node.length > 0">
                <p style="line-height: 15px; margin: 3px; text-align: left;" v-for="(text, j) in task.message" :key="j"> {{ text }} </p>
            </b-card-text>
        </b-card>
        <br /> <br />
    </b-container>
</template>

<style scoped>

</style>
