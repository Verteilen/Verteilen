<script setup lang="ts">
import { computed, Ref, ref, watch } from 'vue';
import colors from 'vuetify/lib/util/colors.mjs';
import { ExecutePair, ExecuteState, Preference, SCROLL_LIMIT } from '../../../interface';
import { WebsocketManager } from '../../../script/socket_manager';

interface PROPS {
    preference: Preference
    socket: WebsocketManager | undefined
}

const data = defineModel<ExecutePair>()
const props = defineProps<PROPS>()
const totalLength = ref(4)
const panelValue:Ref<Array<number>> = ref([])
const myDiv:Ref<HTMLDivElement | null> = ref(null);
const start = ref(0)
const end = ref(0)
const gap = ref(0)

const current_range = computed(() => {
    if(data.value?.record == undefined) return
    return data.value.record.task_detail.slice(start.value, end.value)
})
watch(() => data.value?.record?.task_index, () => {
    start.value = 0
    end.value = 0
    gap.value = 0
})

const getStateColor = (state:number):string => {
    if (state == ExecuteState.NONE) return colors.teal.lighten1
    else if (state == ExecuteState.RUNNING) return colors.blue.lighten1
    else if (state == ExecuteState.FINISH) return colors.green.lighten2
    else return colors.red.lighten2
}

const getURL = (id: string) => {
    if(props.socket == undefined) return `unknowned id: ${id}`
    const t = props.socket.targets.find(x => x.uuid == id)
    if(t == undefined) return `unknowned id: ${id}`
    return t.websocket.url
}

const page = (r:number):number => {
    const length = Math.ceil(data.value!.record!.task_state.length / totalLength.value)
    if(r != length) return totalLength.value
    else return data.value!.record!.task_state.length % totalLength.value
}

const getindex = (r:number, i:number):number => {
    return (r - 1) * totalLength.value + (i - 1)
}

const getselect = (r:number):Array<number> => {
    const select = data.value!.record!.task_index
    if (r - 1 >= select && (r - 1) * totalLength.value - 1 <= select) return [select % data.value!.record!.task_state.length]
    else return []
}
const load = async (o:any) => {
    if(data.value?.record == undefined) return

    if(o.side == "start"){
        if(start.value == 0){
            o.done('ok')
        }else{
            start.value -= SCROLL_LIMIT
            gap.value += 1

            if(gap.value >= 3) {
                end.value -= SCROLL_LIMIT
                gap.value -= 1
            }
            if(start.value < 0) start.value = 0;
            myDiv.value?.scrollTo(0, myDiv.value?.scrollTop + SCROLL_LIMIT * 10);
            o.done('ok')
        }
    }
    else if (o.side == "end"){
        const size = data.value.record.task_detail.length
        if(end.value == size){
            o.done('ok')
        }else{
            end.value += SCROLL_LIMIT
            gap.value += 1

            if(gap.value >= 3) {
                start.value += SCROLL_LIMIT
                gap.value -= 1
            }
            if(end.value > size) end.value = size;
            myDiv.value?.scrollTo(0, myDiv.value?.scrollTop - SCROLL_LIMIT * 10);
            o.done('ok')
        }
    }
    else{
        o.done('error')
    }
}

</script>

<template>
    <v-container v-if="data != undefined" class="pt-4">
        <div ref="myDiv" style="max-height: calc(100vh - 150px); overflow-y: auto;">
            <v-card v-if="data.record!.project_index >= 0" style="background-color: transparent">
                <v-card-title :style="{ 'fontSize': (props.preference.font + 6) + 'px' }" @click="console.log(data)">
                    {{ $t('project') }}: {{ data.record!.projects[data.record!.project_index]?.title }}
                </v-card-title>
                <v-card-text>
                    <p :style="{ 'fontSize': props.preference.font + 'px' }">{{ $t('is-running') }}: 
                        <v-icon v-if="data.record!.running" color="success" icon="mdi-checkbox-marked-circle" end ></v-icon>
                        <v-icon v-else color="danger" icon="mdi-cancel" end ></v-icon>
                    </p>
                    <p :style="{ 'fontSize': props.preference.font + 'px' }">{{ $t('is-stop') }}:
                        <v-icon v-if="data.record!.stop" color="success" icon="mdi-checkbox-marked-circle" end ></v-icon>
                        <v-icon v-else color="danger" icon="mdi-cancel" end ></v-icon>
                    </p>
                </v-card-text>
            </v-card>
            <v-stepper style="background-color: transparent" class="my-1"
                v-if="data.record!.project_index >= 0" 
                :value="getselect(r)" 
                v-for="r in Math.ceil(data.record!.task_state.length / totalLength)" 
                :key="r" :mandatory="false" multiple>
                <v-stepper-header>
                    <template v-for="i in page(r - 1)" :key="i">
                        <v-divider v-if="i - 1" />
                        <v-stepper-item 
                            class="px-4 py-3 my-1"
                            :disabled="true"
                            style="background-color: transparent"
                            :style="{ 'color': getStateColor(data.record!.task_state[getindex(r, i)]?.state ?? 0), 'fontSize': props.preference.font + 'px' }"
                            :value="getindex(r, i)"
                            :title="data.record!.projects[data.record!.project_index]?.task[getindex(r, i)]?.title ?? ''"
                            :complete="data.record!.task_state[getindex(r, i)]?.state == 2">
                        </v-stepper-item>
                    </template>
                </v-stepper-header>
            </v-stepper>
            <br /> 
            <v-infinite-scroll v-if="current_range" :key="data.record!.project + data.record!.task_index" :items="current_range" style="overflow-y: hidden;" @load="load" class="w-100 h-100" side="both">
                <template v-slot:empty></template>
                <template v-slot:load-more></template>
                <template v-slot:loading></template>
                <template v-for="(item, index) in current_range" :key="index">
                    <details
                        :style="{ 'background-color': getStateColor(item.state) + '15'}"
                        class="w-100 text-white mb-3 px-4 text-left">
                        <summary :style="{ 'color': getStateColor(item.state), 'fontSize': props.preference.font + 'px' }" style="background-color: transparent">
                            Index: {{ item.index }}, node: {{ getURL(item.node) }}
                        </summary>
                        <div class="py-3" style="min-height: 50px;" :style="{ 'fontSize': props.preference.font + 'px', 'line-height': props.preference.font + 'px' }">
                            <p style="margin: 3px 1.5em; text-align: left;" v-for="(text, j) in item.message" :key="j"> {{ text }} </p>    
                        </div>
                    </details>
                </template>
            </v-infinite-scroll>
            <br /> <br />
        </div>
    </v-container>
</template>

<style scoped>

</style>
