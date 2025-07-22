<script setup lang="ts">
import { computed, ref } from 'vue';
import { NodeTable, Plugin, PluginList, PluginPageData, Preference } from '../../interface';
import { BackendProxy } from '../../proxy';
import DialogBase from './DialogBase.vue';

interface PROPS {
    backend: BackendProxy
    item: NodeTable | undefined
    plugin: PluginPageData
    preference?: Preference
}

const modal = defineModel<boolean>({ required: true })
const props = defineProps<PROPS>()
const emit = defineEmits<{
    (e: 'download', k:Plugin): void
    (e: 'remove', k:Plugin): void
}>()
const selectID = ref('')
const filterPlugins = computed(() => {
    if(props.item == undefined) return props.plugin.plugins
    const buffer:Array<PluginList> = JSON.parse(JSON.stringify(props.plugin.plugins))
    return buffer.map(x => {
        x.plugins = x.plugins.filter(y => {
            const k = y.contents.find(z => z.platform == props.item?.system?.platform && z.arch == props.item?.system?.arch)
            return k != undefined
        })
        return x
    })
})
const nodeType = computed(() => {
    if(props.item?.state != 1) return "NONE"
    else return `${props.item.system?.platform }_${ props.item?.system?.arch }`
})

const InstalledState = (name:string, version?:string) => {
    if(props.item == undefined) return { code: -1 } // Cannot download
    const k = props.item.plugins?.find(x => x.name == name)
    if(k == undefined) return { code: 0 } // Cannot find download source match
    else if(k.version !== version) return { code: 1, version: k.version } // Can update
    else return { code: 2 } // Remove
}

const closePage = () => {
    modal.value = false
}

const download = (k:Plugin) => {
    emit('download', k)
}

const remove = (k:Plugin) => {
    emit('remove', k)
}

</script>

<template>
    <DialogBase persistent width="75vw" v-model="modal" class="text-white" :preference="props.preference">
        <template #title>
            <v-icon>mdi-console</v-icon>
            {{ item?.ID }} 
            <v-chip :color="props.item?.state == 1 ? 'success' : 'error'">({{ nodeType }})</v-chip>
        </template>
        <template #text>
            <v-row>
                <v-col cols="6">
                    <h2>{{ $t('plugin') }}</h2>
                    <v-list style="height: 60vh">
                        <v-list-group v-for="(p, index) in filterPlugins" :key="index">
                            <template v-slot:activator="{ props }">
                                <v-list-item v-bind="props" :title="p.title">
                                </v-list-item>
                            </template>
                            <v-list-item v-for="(k, index2) in p.plugins" :key="index2" 
                                :title="k.name" 
                                :subtitle="k.version"
                                :active="selectID == `${k.name}_${k.version}`"
                                @click="selectID = `${k.name}_${k.version}`">
                                <template #append >
                                    <v-btn v-if="InstalledState(k.name, k.version).code == 0" 
                                        :disabled="props.item?.state != 1"
                                        color="success" append-icon="mdi-download" 
                                        size="md" rounded variant="text"
                                        @click="download(k)">
                                        {{ k.version }}
                                    </v-btn>
                                    <v-btn v-else-if="InstalledState(k.name, k.version).code == 1" 
                                        :disabled="props.item?.state != 1"
                                        color="warning" append-icon="mdi-menu-up" 
                                        size="md" rounded variant="text"
                                        @click="download(k)">
                                        {{ k.version }} => {{ InstalledState(k.name, k.version).version }}
                                    </v-btn>
                                    <v-btn v-else-if="InstalledState(k.name, k.version).code == 2" 
                                        :disabled="props.item?.state != 1"
                                        color="error" append-icon="mdi-delete-sweep" 
                                        size="md" rounded variant="text"
                                        @click="remove(k)">
                                        {{ k.version }}
                                    </v-btn>
                                </template>
                            </v-list-item>
                        </v-list-group>
                    </v-list>
                </v-col>
                <v-col cols="6">
                    <h2>{{ $t('info') }}</h2>
                </v-col>
            </v-row>
        </template>
        <template #action>
            <v-btn color="error" @click="closePage">
                {{ $t('close') }}
            </v-btn>
        </template>
    </DialogBase>
</template>