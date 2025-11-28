<script setup lang="ts">
//#region Modules
import { computed, inject, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { BusType, PluginContainer } from '../../interface';
import DialogBase from '../dialog/DialogBase.vue';
import { i18n } from '../../plugins/i18n';
import { Emitter } from 'mitt';
import { DATA, EmitType, PROP, Util_Plugin } from './Plugin';
import ContextFrame from '../components/layout/ContextFrame.vue';
import PluginBuildInDialog from '../dialog/plugin/PluginBuildInDialog.vue';
import PluginInfoDialog from '../dialog/plugin/PluginInfoDialog.vue';
//#endregion

//#region Data
const emitter:Emitter<BusType> = inject('emitter')!
const $t = i18n.global.t
const propss = defineProps<PROP>()
const emits = defineEmits<EmitType>()
const data:Ref<DATA> = ref({
    pluginBuildinModal: false,
    templateBuildinModal: false,
    pluginModal: false,
    templateModal: false,
    pluginDeleteModal: false,
    templateDeleteModal: false,
    pluginInfoModal: false,
    pluginDeleteData: '',
    templateDeleteData: '',
    buildin_select_template: -1,
    pluginData: { name: '', url: '' },
    templateData: { name: '', url: '' },
    errorMessage: '',
    loading_plugin: [],
    available_update: [],
    buildIn_plugin: { data: [] },
    buildin_url: "https://raw.githubusercontent.com/Verteilen/Buildin-Assets/refs/heads/main/default_plugin.json",
    default_plugin_thumbnail: "https://picsum.photos/500/300?image=232",
    selection: undefined,
})
const updateTick = ref()
//#endregion

//#region Computed
const plugins = computed(() => propss.plugin.plugins)
const is_updating = computed(() => data.value.loading_plugin.length > 0)
//#endregion

//#region Watch
watch(() => propss.plugin.plugins, () => {
    data.value.loading_plugin = []
})
const util = new Util_Plugin(data, emits, plugins)
//#endregion

const is_loading = (str:string) => {
    return data.value.loading_plugin.includes(str)
}

const importPluginBuildinConfirm = (select:Array<number>) => {
    data.value.pluginBuildinModal = false
    select.forEach(index => {
        if(index < 0 || data.value.buildIn_plugin == undefined) return
        const target = data.value.buildIn_plugin.data[index]
        data.value.pluginData.name = target.name
        data.value.pluginData.url = target.url
        importPluginConfirm()
    })
}

const importPluginConfirm = () => {
    if(data.value.pluginData.name.length == 0){
        data.value.errorMessage = i18n.global.t('error.title-needed');
        return
    }
    if(data.value.pluginData.url.length == 0){
        data.value.errorMessage = i18n.global.t('error.url-needed');
        return
    }
    data.value.pluginModal = false
    emits('added-plugin', data.value.pluginData.name, data.value.pluginData.url);
}

const deletePlugin = (name:string) => {
    data.value.pluginDeleteModal = true;
    data.value.pluginDeleteData = name;
}

const deletePluginConfirm = (name:string) => {
    data.value.pluginDeleteModal = false;
    emits('delete-plugin', data.value.pluginDeleteData);
}

const checkPlugin = (pl:PluginContainer) => {
    data.value.pluginInfoModal = true
    data.value.selection = pl
}

const updatePlugin = (pl:PluginContainer) => {
    data.value.loading_plugin.push(pl.title!)
    emits('added-plugin', pl.title!, pl.url!);
}

const updateLocate = () => {
    util.pull_buildin()
}

const onHotkey = (value:string) => {
    if(value == 'create_plugin'){
        util.importPlugin()
    }
}

onMounted(() => {
    util.pull_buildin()
    updateTick.value = setInterval(util.update_tick, 10000);
    emitter.on('updateLocate', updateLocate)
    emitter.on('hotkey', onHotkey)
})

onUnmounted(() => {
    clearInterval(updateTick.value);
    emitter.off('updateLocate', updateLocate)
    emitter.off('hotkey', onHotkey)
})
</script>

<template>
    <ContextFrame>
        <template #toolbar>
            <v-toolbar density="compact" class="pr-3">
                <v-spacer></v-spacer>
                <v-btn prepend-icon="mdi-puzzle-plus" @click="util.importPluginBuildin" color="primary">
                    {{ $t('import-plugin-buildin') }}
                </v-btn>
                <v-btn prepend-icon="mdi-puzzle-plus" @click="util.importPlugin">
                    {{ $t('import-plugin') }}
                </v-btn>
            </v-toolbar>
        </template>
        <template #dialog>        
            <PluginBuildInDialog v-model="data.pluginBuildinModal" 
                :current="plugins"
                :build-in_plugin="data.buildIn_plugin" 
                @confirm="importPluginBuildinConfirm"/>
            <PluginInfoDialog v-model="data.pluginInfoModal" 
                :default_plugin_thumbnail="data.default_plugin_thumbnail"
                :plugin="data.selection"/>
            <DialogBase v-model="data.pluginModal">
                <template #title>
                    <v-icon>mdi-import</v-icon>
                    {{ $t('import-plugin') }}
                </template>
                <template #text>
                    <v-text-field class="my-1" v-model="data.pluginData.name" hide-details label="name" :autofocus="true" />
                    <v-text-field class="my-1" v-model="data.pluginData.url" hide-details label="url" />
                    <span style="color:red">{{ data.errorMessage }}</span>
                </template>
                <template #action>
                    <v-btn color="primary" @click="importPluginConfirm">{{ $t('confirm') }}</v-btn>
                </template>
            </DialogBase>
            <DialogBase v-model="data.pluginDeleteModal">
                <template #title>
                    <v-icon>mdi-delete</v-icon>
                    {{ $t('modal.delete-plugin') }}
                </template>
                <template #text>
                    <p>{{ $t('modal.delete-plugin-confirm') }}</p>
                    <br />
                    <p>{{ data.pluginDeleteData }}</p>
                </template>
                <template #action>
                    <v-btn class="mt-3" color="primary" @click="data.pluginDeleteModal = false">{{ $t('cancel') }}</v-btn>
                    <v-btn class="mt-3" color="error" @click="deletePluginConfirm">{{ $t('delete') }}</v-btn>
                </template>
            </DialogBase>
        </template>
        <v-row class="px-6" style="height: calc(100vh - 130px)">
            <v-col cols="3" v-for="(container, index) in plugin.plugins" :key="`plugin-${index}`">
                <v-card class="text-left" :loading="is_loading(container.title!)">
                    <v-img cover height="120" :src="container.thumbnail ? container.thumbnail : data.default_plugin_thumbnail">
                        <template v-slot:error>
                            <v-img cover height="120"
                                :src="data.default_plugin_thumbnail"
                            ></v-img>
                        </template>
                    </v-img>
                    <v-card-title>
                        <div class="d-inline-flex align-start">
                            <v-img v-if="container.icon" cover width="30" height="30" :src="container.icon">
                            </v-img>
                            <span>{{ container.title }}</span>
                        </div>
                    </v-card-title>
                    <v-card-subtitle>
                        {{ container.owner }} {{ container.version }} 
                        <span class="ml-1" v-if="!data.available_update.includes(container.title!)">
                            <v-icon class="text-green">mdi-circle</v-icon>
                        </span>
                    </v-card-subtitle>
                    <v-card-text>
                        <p>{{ container.description }}</p>
                        <p v-if="container.createDate">create date: {{ new Date(container.createDate).toISOString().slice(0, 10) }}</p>
                        <p v-if="container.updateDate">update date: {{ new Date(container.updateDate).toISOString().slice(0, 10) }}</p>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn icon="mdi-book" color="info" @click="checkPlugin(container)"></v-btn>
                        <v-btn icon="mdi-update" color="warning" :disabled="is_updating || !data.available_update.includes(container.title!)" @click="updatePlugin(container)"></v-btn>
                        <v-spacer />
                        <v-btn icon="mdi-delete" color="error" @click="deletePlugin(container.title!)"></v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </ContextFrame>
</template>