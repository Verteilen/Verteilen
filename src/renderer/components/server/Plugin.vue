<script setup lang="ts">
import { inject, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { BusType, PluginPageData, PluginPageTemplate } from '../../interface';
import DialogBase from '../dialog/DialogBase.vue';
import { i18n } from '../../plugins/i18n';
import { Emitter } from 'mitt';
import { DATA } from './Plugin';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROP {
    plugin: PluginPageData
}
const $t = i18n.global.t
const propss = defineProps<PROP>()
const emits = defineEmits<{
    (e: 'added-template', name:string, url:string): void
    (e: 'added-plugin', name:string, url:string): void
    (e: 'delete-template', name:string): void
    (e: 'delete-plugin', name:string): void
}>()
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
    loading_plugin: false,
    loading_template: false,
    buildIn_plugin: undefined,
    buildIn_template: undefined,
    buildin_url: "https://raw.githubusercontent.com/Verteilen/Buildin-Assets/refs/heads/main/default_plugin.json"
})

watch(() => propss.plugin.plugins, () => {
    data.value.loading_plugin = false
})
watch(() => propss.plugin.templates, () => {
    data.value.loading_template = false
})

const importPlugin = () => {
    data.value.pluginModal = true
    data.value.errorMessage = ''
    data.value.pluginData = { name: '', url: '' }
}

const importTemplate = () => {
    data.value.templateModal = true
    data.value.errorMessage = ''
    data.value.templateData = { name: '', url: '' }
}

const importPluginBuildin = () => {
    data.value.pluginBuildinModal = true
    data.value.errorMessage = ''
    data.value.pluginData = { name: '', url: '' }
}

const importTemplateBuildin = () => {
    data.value.templateBuildinModal = true
    data.value.errorMessage = ''
    data.value.templateData = { name: '', url: '' }
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

const importTemplateBuildinConfirm = () => {
    const index = data.value.buildin_select_template
    if(index < 0 || data.value.buildIn_template == undefined) return
    const target = data.value.buildIn_template.data[index]
    data.value.templateData.name = target.name
    data.value.templateData.url = target.url
    importTemplateConfirm()
    data.value.templateBuildinModal = false
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

const importTemplateConfirm = () => {
    if(data.value.templateData.name.length == 0){
        data.value.errorMessage = i18n.global.t('error.title-needed');
        return
    }
    if(data.value.templateData.url.length == 0){
        data.value.errorMessage = i18n.global.t('error.url-needed');
        return
    }
    data.value.templateModal = false
    emits('added-template', data.value.templateData.name, data.value.templateData.url);
}

const deletePlugin = (name:string) => {
    data.value.pluginDeleteModal = true;
    data.value.pluginDeleteData = name;
}

const deleteTemplate = (name:string) => {
    data.value.templateDeleteModal = true;
    data.value.templateDeleteData = name;
}

const deletePluginConfirm = (name:string) => {
    data.value.pluginDeleteModal = false;
    emits('delete-plugin', data.value.pluginDeleteData);
}

const deleteTemplateConfirm = (name:string) => {
    data.value.templateDeleteModal = false;
    emits('delete-template', data.value.templateDeleteData);
}

const updatePlugin = (pl:PluginList) => {
    data.value.loading_plugin = true
    emits('added-plugin', pl.title!, pl.url!);
}

const updateTemplate = (pl:PluginPageTemplate) => {
    data.value.loading_template = true
    emits('added-template', pl.name!, pl.url!);
}

const onHotkey = (value:string) => {
    if(value == 'create_plugin'){
        importPlugin()
    }
    if(value == 'create_template'){
        importTemplate()
    }
}

const pull_buildin = () => {
    const f1 = fetch(data.value.buildin_url).then(x => {
        x.text().then(x2 => {
            data.value.buildIn_template = JSON.parse(x2)
            console.log("Update buildin template", data.value.buildIn_template)
        })
    })
    const f2 = fetch(data.value.buildin_url.plugin).then(x => {
        x.text().then(x2 => {
            data.value.buildIn_plugin = JSON.parse(x2)
            console.log("Update buildin plugin", data.value.buildIn_plugin)
        })
    })
    Promise.allSettled([f1, f2])
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
    <div>
        <div class="py-3">
            <v-toolbar density="compact" class="pr-3">
                <v-spacer></v-spacer>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="importPluginBuildin" color="primary">
                            <v-icon>mdi-puzzle-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('import-plugin-buildin') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="importTemplateBuildin" color="primary">
                            <v-icon>mdi-tag-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('import-template-buildin') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="importPlugin">
                            <v-icon>mdi-puzzle-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('import-plugin') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="importTemplate">
                            <v-icon>mdi-tag-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('import-template') }}
                </v-tooltip>
            </v-toolbar>
        </div>
        <div class="pt-3 px-5 text-left">
            <v-row style="height: calc(100vh - 130px)">
                <v-col cols="6">
                    <v-card :loading="data.loading_plugin" class="pt-4">
                        <h2 class="pl-6">{{ $t('plugin') }}</h2>
                        <br />
                        <v-list style="height: calc(100vh - 220px);">
                            <v-list-group v-for="(container, index) in plugin.plugins" >
                                <v-toolbar density="compact" class="mr-3">
                                    <v-btn icon color="error" @click="deletePlugin(container.title!)" :disabled="data.loading_plugin">
                                        <v-icon>mdi-delete</v-icon>
                                    </v-btn>
                                    <v-btn icon color="info" @click="updatePlugin(container)" :disabled="data.loading_plugin">
                                        <v-icon>mdi-update</v-icon>
                                    </v-btn>
                                </v-toolbar>
                                <template v-slot:activator="{ props }">
                                    <v-list-item v-bind="props" :key="index">
                                        <v-list-item-title>{{ container.title }}</v-list-item-title>
                                    </v-list-item>
                                </template>
                                <v-list-group v-for="(group, index) in container.plugins" >
                                    <template v-slot:activator="{ props }">
                                        <v-list-item v-bind="props" :key="index">
                                            <v-list-item-title>{{ group.name }} {{ group.version }}</v-list-item-title>
                                            <v-list-item-subtitle>{{ group.description }}</v-list-item-subtitle>
                                        </v-list-item>
                                    </template>
                                    <v-list-item v-for="(item, index2) in group.contents"  :key="index2">
                                        <v-list-item-title>{{ item.filename }}</v-list-item-title>
                                        <v-list-item-subtitle>"{{ item.platform }}_{{ item.arch }}"</v-list-item-subtitle>
                                    </v-list-item>
                                </v-list-group>
                            </v-list-group>
                        </v-list>
                    </v-card>
                </v-col>
                <v-col cols="6">
                    <v-card :loading="data.loading_template" class="pt-4">
                        <h2 class="pl-6">{{ $t('template') }}</h2>
                        <br />
                        <v-list style="height: calc(100vh - 220px);">
                            <v-list-group v-for="(group, index) in plugin.templates">
                                <v-toolbar density="compact" class="mr-3">
                                    <v-btn icon color="error" @click="deleteTemplate(group.name)" :disabled="data.loading_template">
                                        <v-icon>mdi-delete</v-icon>
                                    </v-btn>
                                    <v-btn icon color="info" @click="updateTemplate(group)" :disabled="data.loading_template">
                                        <v-icon>mdi-update</v-icon>
                                    </v-btn>
                                </v-toolbar>
                                <template v-slot:activator="{ props }">
                                    <v-list-item v-bind="props" :key="index">
                                        <v-list-item-title>{{ group.name }}</v-list-item-title>
                                    </v-list-item>
                                </template>
                                <v-list-group>
                                    <template v-slot:activator="{ props }">
                                        <v-list-item v-bind="props" :key="index">
                                            <v-list-item-title>{{ $t('project') }}</v-list-item-title>
                                        </v-list-item>
                                    </template>
                                    <v-list-item v-for="(project, index2) in group.project" :key="index2">
                                        <v-list-item-title>{{ project.title }}</v-list-item-title>
                                        <v-list-item-subtitle>Group: {{ project.group }}</v-list-item-subtitle>
                                    </v-list-item>
                                </v-list-group>
                                <v-list-group>
                                    <template v-slot:activator="{ props }">
                                        <v-list-item v-bind="props" :key="index">
                                            <v-list-item-title>{{ $t('database') }}</v-list-item-title>
                                        </v-list-item>
                                    </template>
                                    <v-list-item v-for="(database, index3) in group.database" :key="index3">
                                        <v-list-item-title>{{ database.title }}</v-list-item-title>
                                        <v-list-item-subtitle>Group: {{ database.group }}</v-list-item-subtitle>
                                    </v-list-item>
                                </v-list-group>
                            </v-list-group>
                        </v-list>
                    </v-card>
                </v-col>
            </v-row>
        </div>
        <DialogBase v-model="data.pluginBuildinModal">
            <template #title>
                <v-icon>mdi-import</v-icon>
                {{ $t('import-plugin') }}
            </template>
            <template #text>
                <v-list v-model="data.buildin_select_plugin">
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
        <DialogBase v-model="data.templateBuildinModal">
            <template #title>
                <v-icon>mdi-import</v-icon>
                {{ $t('import-template') }}
            </template>
            <template #text>
                <v-list v-model="data.buildin_select_template">
                    <v-list-item v-for="(item, index) in data.buildIn_template?.data" :key="index" :value="index" @click="data.buildin_select_template = index">
                        <v-list-item-title>{{ item.name }}</v-list-item-title>
                        <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
                    </v-list-item>
                </v-list>
            </template>
            <template #action>
                <v-btn color="primary" @click="importTemplateBuildinConfirm">{{ $t('confirm') }}</v-btn>
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
        <DialogBase v-model="data.templateModal">
            <template #title>
                <v-icon>mdi-import</v-icon>
                {{ $t('import-template') }}
            </template>
            <template #text>
                <v-text-field class="my-1" v-model="data.templateData.name" hide-details label="name" :autofocus="true" />
                <v-text-field class="my-1" v-model="data.templateData.url" hide-details label="url" />
                <span style="color:red">{{ data.errorMessage }}</span>
            </template>
            <template #action>
                <v-btn color="primary" @click="importTemplateConfirm">{{ $t('confirm') }}</v-btn>
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
        <DialogBase v-model="data.templateDeleteModal">
            <template #title>
                <v-icon>mdi-delete</v-icon>
                {{ $t('modal.delete-template') }}
            </template>
            <template #text>
                <p>{{ $t('modal.delete-template-confirm') }}</p>
                <br />
                <p>{{ data.templateDeleteData }}</p>
            </template>
            <template #action>
                <v-btn class="mt-3" color="primary" @click="data.templateDeleteModal = false">{{ $t('cancel') }}</v-btn>
                <v-btn class="mt-3" color="error" @click="deleteTemplateConfirm">{{ $t('delete') }}</v-btn>
            </template>
        </DialogBase>
    </div>
</template>