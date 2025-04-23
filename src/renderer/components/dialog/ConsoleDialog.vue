<script setup lang="ts">
import { Emitter } from 'mitt';
import { computed, inject, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { BusType, Node, Parameter, Preference, Project, Record } from '../../interface';
import DialogBase from './DialogBase.vue';

interface PROP {
    projects: Array<Project>
    nodes: Array<Node>
    parameters: Array<Parameter>
    preference: Preference
}

const emitter:Emitter<BusType> | undefined = inject('emitter');
    
const modal = defineModel<boolean>({ required: true })
const props = defineProps<PROP>()
const emits = defineEmits<{
    (e: 'confirm', name:string, record:Record):void
}>()

const name:Ref<string> = ref('')

const tabs:Ref<Array<[string, string, number]>> = ref([])
const page = ref(0)
const projects:Ref<Array<[string, string]>> = ref([])
const nodes:Ref<Array<string>> = ref([])

const ps = computed(() => {
    return props.projects.map(x => {
        return {
            title: x.title,
            uuid: x.uuid,
            value: x.uuid
        }
    })
})

const ns = computed(() => {
    return  props.nodes.map(x => {
        return {
            title: x.url,
            uuid: x.ID,
            value: x.ID
        }
    })
})

watch(() => modal.value, () => {
    name.value = ''
    projects.value = []
    nodes.value = []
})

const updateTab = () => {
    tabs.value = [
        ["mdi-cube", "toolbar.project", 0],
        ["mdi-network", "toolbar.node", 1],
    ]
}

const updateLocate = () => {
    updateTab()
}

const generateResult = ():Record => {
    const r:Record = { projects: [], nodes: [] }
    projects.value.forEach(x => {
        const _project_target = props.projects.find(y => y.uuid == x[0])
        const _para_target = props.parameters.find(y => y.uuid == x[1])
        if(_project_target == undefined || _para_target == undefined) return
        const project_target:Project = JSON.parse(JSON.stringify(_project_target))
        const para_target:Parameter = JSON.parse(JSON.stringify(_para_target))
        project_target.parameter_uuid = para_target.uuid
        project_target.parameter = para_target
        r.projects.push(project_target)
    })
    nodes.value.forEach(x => {
        const _node_target = props.nodes.find(y => y.ID == x[0])
        if(_node_target == undefined) return
        const node_target:Node = JSON.parse(JSON.stringify(_node_target))
        r.nodes.push(node_target)
    })
    return r
}

const confirm = () => {
    emits('confirm', name.value, generateResult())
}

const AddProject = () => {
    projects.value.push(['', ''])
}

const AddNode = () => {
    nodes.value.push('')
}

const itemProps = (item:any) => {
    return {
        title: item.title,
        subtitle: item.uuid
    }
}

onMounted(() => {
    updateTab()
    emitter?.on('updateLocate', updateLocate)
})

onUnmounted(() => {
    emitter?.on('updateLocate', updateLocate)
})
</script>

<template>
    <DialogBase v-model="modal" width="800">
        <template #title>
            <v-icon>mdi-console</v-icon>
            {{ $t('modal.console-create') }}
        </template>
        <template #text>
            <v-text-field v-model="name" :label="$t('modal.console-name')" hide-detail></v-text-field>
            <v-tabs v-model="page" tabs show-arrows class="bg-grey-darken-4">
                <v-tab v-for="(tab, index) in tabs" :style="{ 'fontSize': (props.preference.font - 2) + 'px' }" :value="tab[2]" :key="index">
                    <v-icon>{{ tab[0] }}</v-icon>
                    <span>{{ $t(tab[1]) }}</span>
                </v-tab>
            </v-tabs>
            <v-tabs-window v-model="page">
                <v-tabs-window-item :value="0">
                    <v-toolbar density="compact" class="pr-3">
                        <v-tooltip location="bottom">
                            <template v-slot:activator="{ props }">
                                <v-btn icon v-bind="props" @click="AddProject">
                                    <v-icon>mdi-plus</v-icon>
                                </v-btn>
                            </template>
                            {{ $t('create') }}
                        </v-tooltip>
                    </v-toolbar>
                    <v-row>
                        <v-col cols="6">
                            <p>{{ $t('project') }}</p>
                        </v-col>
                        <v-col cols="6">
                            <p>{{ $t('parameter') }}</p>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="6">
                            <v-autocomplete clearable hide-details v-for="(v, i) in projects" :key="i"
                                :item-props="itemProps" 
                                v-model="v[0]" :items="ps" item-title="text" :label="$t('parameter')" ></v-autocomplete>
                        </v-col>
                        <v-col cols="6">
                            <v-autocomplete clearable hide-details v-for="(v, i) in projects" :key="i"
                                :item-props="itemProps" 
                                v-model="v[1]" :items="ps" item-title="text" :label="$t('parameter')" ></v-autocomplete>
                        </v-col>
                    </v-row>
                </v-tabs-window-item>
                <v-tabs-window-item :value="1">
                    <v-toolbar density="compact" class="pr-3">
                        <v-tooltip location="bottom">
                            <template v-slot:activator="{ props }">
                                <v-btn icon v-bind="props" @click="AddNode">
                                    <v-icon>mdi-plus</v-icon>
                                </v-btn>
                            </template>
                            {{ $t('create') }}
                        </v-tooltip>
                    </v-toolbar>
                    <p>{{ $t('node') }}</p>
                    <v-autocomplete clearable hide-details v-for="(v, i) in nodes" :key="i"
                        :item-props="itemProps" 
                        v-model="v" :items="ns" item-title="text" :label="$t('node')" ></v-autocomplete>
                </v-tabs-window-item>
            </v-tabs-window>
        </template>
        <template #action>
            <v-btn class="mt-3" color="primary" @click="confirm">{{ $t('create') }}</v-btn>
        </template>
    </DialogBase>
</template>