<script setup lang="ts">
//#region Modules
import { v6 as uuidv6 } from 'uuid';
import { Emitter } from 'mitt';
import { computed, inject, nextTick, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { BusType, Preference, ProjectTemplateText, ProjectTable, CreateRootLocalPermission } from '../../interface';
import { i18n } from '../../plugins/i18n';
import { CreateField, DATA, EmitType, PROPS, Util_Project } from './Project';
import { BackendProxy } from '../../proxy';
//#endregion

//#region Views
import ProjectDialog from '../dialog/project/ProjectDialog.vue';
import ProjectImportDialog from '../dialog/project/ProjectImportDialog.vue';
import DeleteDialog from '../dialog/DeleteDialog.vue';
import ContextFrame from '../components/layout/ContextFrame.vue';
//#endregion

//#region Data
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const backend:Ref<BackendProxy> = inject("backend")!
const preference:Ref<Preference> = inject("preference")!
const props = defineProps<PROPS>()
const emits = defineEmits<EmitType>()
const data:Ref<DATA> = ref({
    itemPrePage: -1,
    fields: [],
    importModal: false,
    importData: [],
    dialogModal: false,
    isEdit: false,
    editData: {title: "", description: "", useTemp: false, temp: null, database: null, usePara: false},
    editUUID: '',
    deleteModal: false,
    deleteBind: false,
    deleteData: [],
    errorMessage: '',
    titleError: false,
    search: '',
    selection: [],
    sort: undefined,
    order: undefined,
})
//#endregion

//#region Computed
const config = computed(() => backend.value.config)
const realSearch = computed(() => data.value.search.trimStart().trimEnd())
const items_final = computed(() => { 
    let a = realSearch.value == null || 
        realSearch.value.length == 0 ? props.projects : 
            props.projects.filter(x => 
                x.title.includes(realSearch.value) || 
                x.uuid.slice(x.uuid.length - 12, x.uuid.length).includes(realSearch.value)
            ) 
    a = JSON.parse(JSON.stringify(a))
    if(util.isSort()){
        a = a.sort((a:any, b:any) => {
            return a[data.value.sort!] - b[data.value.sort!]
        })
        if(data.value.order != 'asc') a = a.reverse()
        return a
    }
    else return a
})
const hasSelect = computed(() => data.value.selection.length > 0)
const selected_project_ids = computed(() => props.projects.filter(x => data.value.selection.includes(x.uuid)).map(x => x.uuid))
const projects = computed(() => props.projects)
const databases = computed(() => props.databases)
const plugin = computed(() => props.plugin)
const canViewDetail = computed(() => backend.value.config.isExpress ? (backend.value.user.permission?.task.view ?? false) : true)
const permission = computed(() => backend.value.config.isExpress ? backend.value.user.permission?.project : CreateRootLocalPermission() )
const util:Util_Project = new Util_Project(data, backend, emits, plugin, projects, databases, selected_project_ids)
//#endregion

//#region Watch
watch(() => props.plugin, () => {
    //updateTemps()
})
//#endregion

//#region Methods

//#region Import Expert Related
const dataImport = () => {
    data.value.importModal = true
}
const dataExport = async (uuid:string) => {
    const p = props.projects.find(x => x.uuid == uuid)
    if(p == undefined) return
    if(config.value.haveBackend){
        backend.value.invoke("project_module:populate_project", uuid).then(x => {
            backend.value.send('export_project', JSON.stringify(x, null ,4))
        })
    }else{
        const handle = await window.showSaveFilePicker({ suggestedName: p.uuid + '.json' });
        const writer = await handle.createWritable();
        await writer.write(new Blob([JSON.stringify(p, null, 2)]))
        await writer.close()
    }
}
const importConfirm = async () => {
    data.value.importModal = false
    Promise.all(data.value.importData.map(x => x.text())).then(texts => {
        const a = texts.map(x => {
            try {
                const buffer:ProjectTable = JSON.parse(x)
                buffer.uuid = uuidv6()
                buffer.database_uuid = ""
                buffer.database = undefined
                return buffer
            }catch(err){
                console.error("Convert text to project json format error")
                return undefined
            }
        }).filter(x => x != undefined)
        emits('added', a)
    })
}
//#endregion

//#region Create Edit Related
const dialogSubmit = (p:CreateField) => {
    data.value.editData = p
    nextTick(() => {
        if(data.value.isEdit) confirmEdit()
        else confirmCreate()
    }) 
}
const confirmCreate = async () => {
    const buffer = await util.confirmCreate()
    if(buffer == undefined) return
    data.value.dialogModal = false
    emits('added', 
        [buffer]
    )
}
const confirmEdit = () => {
    const selectp = util.confirmEdit()
    if(selectp == undefined) return
    data.value.dialogModal = false
    emits('edit', 
    data.value.editUUID,
        { 
            ...selectp,
            uuid: data.value.editUUID,
            title: data.value.editData.title, 
            description: data.value.editData.description,
        }
    )
}
//#endregion

const deleteSelect = () => {
    data.value.deleteData = selected_project_ids.value
    data.value.deleteModal = true
}

const deleteConfirm = () => {
    data.value.deleteModal = false
    data.value.selection = []
    emits('delete', data.value.deleteData, data.value.deleteBind)
    nextTick(() => {
        data.value.deleteBind = false
    })
}

const selectAll = () => {
    data.value.selection = props.projects.map(x => x.uuid)
}

const ProjectTemplateTranslate = (t:number):string => {
    return ProjectTemplateText.hasOwnProperty(t) ? i18n.global.t(ProjectTemplateText[t]) : ""
}

const updateLocate = () => {
    updateFields()
}
const updateFields = () => {
    data.value.fields = [
        { title: 'ID', align: 'center', key: 'ID', maxWidth: "20%" },
        { title: i18n.global.t('headers.title'), align: 'center', key: 'title', width: "20%" },
        { title: i18n.global.t('headers.description'), align: 'center', key: 'description' },
        { title: i18n.global.t('headers.task-count'), align: 'center', key: 'taskCount', minWidth: "150px" },
        { title: i18n.global.t('headers.detail'), align: 'center', key: 'detail', minWidth: "200px" },
    ]
}
const onHotkey = (value:string) => {
    if(value == 'create_project'){
        util.createProject()
    }
}
//#endregion

onMounted(() => {
    updateLocate()
    updateFields()
    emitter.on('hotkey', onHotkey)
    emitter.on('updateLocate', updateLocate)
    if(config.value.isElectron) {
        window.electronAPI.eventOn('createProject', util.createProject)
    }
})

onUnmounted(() => {
    emitter.off('hotkey', onHotkey)
    emitter.off('updateLocate', updateLocate)
    if(config.value.isElectron) {
        window.electronAPI.eventOff('createProject', util.createProject)
    }
})
</script>

<template>
    <ContextFrame>
        <template #toolbar>
            <v-toolbar density="compact" class="px-3">
                <v-spacer></v-spacer>
                <v-btn prepend-icon="mdi-plus" v-bind="props" @click="util.createProject" :disabled="!permission?.create">
                    {{ $t('create') }}
                </v-btn>
                <v-btn prepend-icon="mdi-import" v-bind="props" @click="dataImport" :disabled="!permission?.create">
                    {{ $t('import') }}
                </v-btn>
                <v-btn prepend-icon="mdi-content-paste" v-bind="props" @click="util.cloneSelect" :disabled="!hasSelect || !permission?.create">
                    {{ $t('clone') }}
                </v-btn>
                <v-btn prepend-icon="mdi-delete" color='error' v-bind="props" @click="deleteSelect" :disabled="!hasSelect || !permission?.delete">
                    {{ $t('delete') }}
                </v-btn> 
            </v-toolbar>
        </template>
        <template #dialog>
            <ProjectDialog v-model="data.dialogModal" 
                :preference="preference"
                :plugin="props.plugin"
                :databases="props.databases"
                :is-edit="data.isEdit" 
                :error-message="data.errorMessage"
                :title-error="data.titleError"
                :edit-data="data.editData" 
                @submit="dialogSubmit" />
            <ProjectImportDialog v-model="data.importModal"
                v-model:files="data.importData"
                @confirm="importConfirm"/>
            <DeleteDialog v-model="data.deleteModal" 
                :title="$t('modal.delete-project')"
                :text="$t('modal.delete-project-confirm')"
                :data="data.deleteData"
                width="500"
                @cancel="data.deleteModal = false"
                @delete="deleteConfirm">
                <v-checkbox v-model="data.deleteBind" :label="$t('modal.delete-project-binding')"></v-checkbox>
            </DeleteDialog>
        </template>
        <v-card flat style="background: transparent">
            <v-card-text class="my-0 py-0">
                <v-text-field v-model="data.search" class="mb-2" :style="{ 'fontSize': preference.font + 'px' }" :placeholder="$t('search')" clearable prepend-icon="mdi-magnify" hide-details single-line></v-text-field>
                <v-data-table v-model="data.selection" style="background: transparent" :items-per-page="data.itemPrePage" :headers="data.fields" :items="items_final" show-select item-value="uuid" :style="{ 'fontSize': preference.font + 'px' }">
                    <template v-slot:item.ID="{ item }">
                        <a v-if="canViewDetail" href="#" @click="util.dataChoose(item.uuid)">{{ item.uuid.slice(item.uuid.length - 12, item.uuid.length) }}</a>
                        <span v-else>{{ item.uuid.slice(item.uuid.length - 12, item.uuid.length) }}</span>
                    </template>
                    <template v-slot:item.detail="{ item }">
                        <v-tooltip location="bottom">
                            <template v-slot:activator="{ props }">
                                <v-btn variant="text" v-bind="props" flat icon @click="util.dataEdit(item.uuid)" :disabled="!permission?.edit" size="small">
                                    <v-icon>mdi-pencil</v-icon>
                                </v-btn>
                            </template>
                            {{ $t('edit') }}
                        </v-tooltip>
                        <v-tooltip location="bottom">
                            <template v-slot:activator="{ props }">
                                <v-btn variant="text" v-bind="props" flat icon @click="dataExport(item.uuid)" :disabled="!permission?.view" size="small">
                                    <v-icon>mdi-export</v-icon>
                                </v-btn>
                            </template>
                            {{ $t('export') }}
                        </v-tooltip>
                        <v-tooltip location="bottom">
                            <template v-slot:activator="{ props }">
                                <v-btn variant="text" v-bind="props" flat icon @click="dataExport(item.uuid)" :disabled="!permission?.edit || !backend.config.isExpress" size="small">
                                    <v-icon>mdi-lock</v-icon>
                                </v-btn>
                            </template>
                            {{ $t('export') }}
                        </v-tooltip>
                    </template>
                </v-data-table>
            </v-card-text>
        </v-card>
    </ContextFrame>
</template>
