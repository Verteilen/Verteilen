<script setup lang="ts">
import { ref } from 'vue';
import { PluginPageData } from '../../interface';
import DialogBase from '../dialog/DialogBase.vue';
import { i18n } from '../../plugins/i18n';

interface PROP {
    plugin: PluginPageData
}

const propss = defineProps<PROP>()
const emits = defineEmits<{
    (e: 'added-template', name:string, url:string, token?:string): void
    (e: 'added-plugin', name:string, url:string, token?:string): void
    (e: 'delete-template', name:string): void
    (e: 'delete-plugin', name:string): void
}>()
const data = ref({
    pluginModal: false,
    templateModal: false,
    pluginDeleteModal: false,
    templateDeleteModal: false,
    pluginDeleteData: '',
    templateDeleteData: '',
    pluginData: { name: '', url: '', token: '' },
    templateData: { name: '', url: '', token: '' },
    errorMessage: ''
})

const importPlugin = () => {
    data.value.pluginModal = true
    data.value.errorMessage = ''
    data.value.pluginData = { name: '', url: '', token: '' }
}

const importTemplate = () => {
    data.value.templateModal = true
    data.value.errorMessage = ''
    data.value.templateData = { name: '', url: '', token: '' }
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
    emits('added-plugin', data.value.pluginData.name, data.value.pluginData.url, data.value.pluginData.token);
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
    emits('added-template', data.value.templateData.name, data.value.templateData.url, data.value.templateData.token);
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

</script>

<template>
    <div>
        <div class="py-3">
            <v-toolbar density="compact" class="pr-3">
                <v-spacer></v-spacer>
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
                    <h2 class="pl-6">{{ $t('plugin') }}</h2>
                    <br />
                    <v-list style="overflow-y: auto;" class="h-100">
                        <v-list-group v-for="(container, index) in plugin.plugins" >
                            <v-toolbar density="compact" class="mr-3">
                                <v-btn icon color="error" @click="deletePlugin(container.title!)">
                                    <v-icon>mdi-delete</v-icon>
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
                </v-col>
                <v-col cols="6">
                    <h2 class="pl-6">{{ $t('template') }}</h2>
                    <br />
                    <v-list style="overflow-y: auto;" class="h-100">
                        <v-list-group v-for="(group, index) in plugin.templates">
                            <v-toolbar density="compact" class="mr-3">
                                <v-btn icon color="error" @click="deleteTemplate(group.name)">
                                    <v-icon>mdi-delete</v-icon>
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
                                        <v-list-item-title>{{ $t('parameter') }}</v-list-item-title>
                                    </v-list-item>
                                </template>
                                <v-list-item v-for="(parameter, index3) in group.parameter" :key="index3">
                                    <v-list-item-title>{{ parameter.title }}</v-list-item-title>
                                    <v-list-item-subtitle>Group: {{ parameter.group }}</v-list-item-subtitle>
                                </v-list-item>
                            </v-list-group>
                        </v-list-group>
                    </v-list>
                </v-col>
            </v-row>
        </div>
        <DialogBase v-model="data.pluginModal">
            <template #title>
                <v-icon>mdi-import</v-icon>
                {{ $t('import-plugin') }}
            </template>
            <template #text>
                <v-text-field class="my-1" v-model="data.pluginData.name" hide-details label="name" />
                <v-text-field class="my-1" v-model="data.pluginData.url" hide-details label="url" />
                <v-text-field class="my-1" v-model="data.pluginData.token" hide-details label="token" />
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
                <v-text-field class="my-1" v-model="data.templateData.name" hide-details label="name" />
                <v-text-field class="my-1" v-model="data.templateData.url" hide-details label="url" />
                <v-text-field class="my-1" v-model="data.templateData.token" hide-details label="token" />
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