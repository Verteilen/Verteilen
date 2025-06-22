<script setup lang="ts">
import { computed, ref } from 'vue';
import { NodeTable, PluginPageData } from '../../interface';
import { BackendProxy } from '../../proxy';


const modal = defineModel<boolean>({ required: true })
interface PROPS {
    backend: BackendProxy
    item: NodeTable | undefined
    plugin: PluginPageData
}

const props = defineProps<PROPS>()
const selectID = ref('')
const filterPlugins = computed(() => {
    if(props.item == undefined) return props.plugin.plugins
    return props.plugin.plugins.map(x => {
        x.plugins = x.plugins.filter(y => {
            const k = y.contents.find(z => z.platform == props.item?.system?.platform && z.arch == props.item.system.arch)
            return k != undefined
        })
        return x
    })
})

const InstalledState = (name:string, version?:string) => {
    if(props.item == undefined) return false
    const k = props.item.plugins?.find(x => x.name == name)
    if(k == undefined) return 0
    else if(k.version != version) return 1
    else return 2
}

const closePage = () => {
    modal.value = false
}

</script>

<template>
    <v-dialog persistent width="75vw" v-model="modal" class="text-white">
        <v-card>
            <v-card-title>
                <v-icon>mdi-console</v-icon>
                {{ item?.ID }} ({{ item?.system?.platform }}_{{ item?.system?.arch }})
            </v-card-title>
            <v-card-text>
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
                                    <template #append>
                                        <v-btn v-if="InstalledState(k.name, k.version) == 0" 
                                            color="success" append-icon="mdi-download" 
                                            size="md" rounded variant="text">
                                        </v-btn>
                                        <v-btn v-else-if="InstalledState(k.name, k.version) == 1" 
                                            color="warning" append-icon="mdi-menu-up" 
                                            size="md" rounded variant="text">
                                        </v-btn>
                                        <v-btn v-else-if="InstalledState(k.name, k.version) == 2" 
                                            color="error" append-icon="mdi-delete-sweep" 
                                            size="md" rounded variant="text">
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
            </v-card-text>
            <template v-slot:actions>
                <v-btn color="error" @click="closePage">
                    {{ $t('close') }}
                </v-btn>
            </template>
        </v-card>
    </v-dialog>
</template>