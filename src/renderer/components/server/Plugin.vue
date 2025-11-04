<script setup lang="ts">
//#region Modules
import { inject, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { BusType, PluginContainer } from '../../interface';
import DialogBase from '../dialog/DialogBase.vue';
import { i18n } from '../../plugins/i18n';
import { Emitter } from 'mitt';
import { DATA, EmitType, PROP, Util_Plugin } from './Plugin';
import ContextFrame from '../components/layout/ContextFrame.vue';
//#endregion

//#region Data
const emitter:Emitter<BusType> | undefined = inject('emitter');
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
    pluginDeleteData: '',
    templateDeleteData: '',
    buildin_select_plugin: -1,
    buildin_select_template: -1,
    pluginData: { name: '', url: '' },
    templateData: { name: '', url: '' },
    errorMessage: '',
    loading_plugin: [],
    buildIn_plugin: undefined,
    buildin_url: "https://raw.githubusercontent.com/Verteilen/Buildin-Assets/refs/heads/main/default_plugin.json",
    default_plugin_thumbnail: "https://picsum.photos/500/300?image=232",
})
//#endregion

//#region 
watch(() => propss.plugin.plugins, () => {
    data.value.loading_plugin = []
})
const util = new Util_Plugin(data, emits)
//#endregion

const is_loading = (str:string) => {
    return data.value.loading_plugin.includes(str)
}

const importPluginBuildinConfirm = () => {
    const index = data.value.buildin_select_plugin
    if(index < 0 || data.value.buildIn_plugin == undefined) return
    const target = data.value.buildIn_plugin.data[index]
    data.value.pluginData.name = target.name
    data.value.pluginData.url = target.url
    importPluginConfirm()
    data.value.pluginBuildinModal = false
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

}

const updatePlugin = (pl:PluginContainer) => {
    data.value.loading_plugin.push(pl.title)
    emits('added-plugin', pl.title!, pl.url!);
}

const onHotkey = (value:string) => {
    if(value == 'create_plugin'){
        util.importPlugin()
    }
}

const pull_buildin = () => {
    fetch(data.value.buildin_url).then(x => {
        x.text().then(x2 => {
            data.value.buildIn_plugin = JSON.parse(x2)
            console.log("Update buildin plugin", data.value.buildIn_plugin)
        })
    })
}

onMounted(() => {
    pull_buildin()
    console.log("Plugin Mounted")
    emitter?.on('hotkey', onHotkey)
})

onUnmounted(() => {
    emitter?.off('hotkey', onHotkey)
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
            <DialogBase v-model="data.pluginBuildinModal">
                <template #title>
                    <v-icon>mdi-import</v-icon>
                    {{ $t('import-plugin') }}
                </template>
                <template #text>
                    <v-list v-model="data.buildin_select_plugin" style="background-color: transparent;">
                        <v-list-item v-for="(item, index) in data.buildIn_plugin?.data" :key="index" :value="index" @click="data.buildin_select_plugin = index">
                            <v-list-item-title>{{ item.name }}</v-list-item-title>
                            <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
                        </v-list-item>
                    </v-list>
                </template>
                <template #action>
                    <v-btn color="primary" @click="importPluginBuildinConfirm">{{ $t('confirm') }}</v-btn>
                </template>
            </DialogBase>
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
                        {{ container.owner }}
                    </v-card-subtitle>
                    <v-card-text>
                        <p>{{ container.description }}</p>
                        <p v-if="container.createDate">create date: {{ new Date(container.createDate).toISOString().slice(0, 10) }}</p>
                        <p v-if="container.updateDate">update date: {{ new Date(container.updateDate).toISOString().slice(0, 10) }}</p>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn icon="mdi-book" color="info" @click="checkPlugin(container)"></v-btn>
                        <v-btn icon="mdi-update" color="warning" @click="updatePlugin(container)"></v-btn>
                        <v-spacer />
                        <v-btn icon="mdi-delete" color="error" @click="deletePlugin(container.title!)"></v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </ContextFrame>
</template>