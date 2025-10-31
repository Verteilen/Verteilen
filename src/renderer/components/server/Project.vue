<script setup lang="ts">
//#region Modules
import { v6 as uuidv6 } from 'uuid';
import { Emitter } from 'mitt';
import { computed, inject, nextTick, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { BusType, Preference, ProjectTemplate, ProjectTemplateText, ProjectTable, CreateRootLocalPermission } from '../../interface';
import { i18n } from '../../plugins/i18n';
import { CreateField, DATA, EmitType, IndexToValue, PROPS, Temp, Util_Project, ValueToGroupName } from './Project';
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
    editData: {title: "", description: "", useTemp: false, temp: 0, database: null, usePara: false},
    temps: [],
    editUUID: '',
    deleteModal: false,
    deleteBind: false,
    deleteData: [],
    errorMessage: '',
    titleError: false,
    search: '',
    selection: []
})
//#endregion

//#region Computed
const config = computed(() => backend.value.config)
const realSearch = computed(() => data.value.search.trimStart().trimEnd())
const items_final = computed(() => { return realSearch.value == null || realSearch.value.length == 0 ? props.projects : props.projects.filter(x => x.title.includes(realSearch.value) || x.uuid.includes(realSearch.value)) })
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
    updateTemps()
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
    if(config.value.isElectron){
        window.electronAPI.send('export_project', JSON.stringify(p))
    }else if(config.value.isExpress){
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
const updateTemps = () => {
    data.value.temps = Object.keys(ProjectTemplate).filter(key => isNaN(Number(key))).map((x, index) => {
        const text = ProjectTemplateTranslate(IndexToValue(index))
        return {
            text: text.length > 0 ? text : x,
            group: ValueToGroupName(IndexToValue(index)) ?? '',
            value: IndexToValue(index)
        }
    })
    let adder = 0
    props.plugin.templates.forEach(x => {
        x.project.forEach(y => {
            const buffer:Temp = {
                text: y.title ? y.title : "Null",
                group: y.group,
                value: 1000 + adder
            }
            adder += 1
            data.value.temps.push(buffer)
        })
    })
}

const updateLocate = () => {
    updateTemps()
    updateFields()
}
const updateFields = () => {
    data.value.fields = [
        { title: 'ID', align: 'center', key: 'ID', width: "25%" },
        { title: i18n.global.t('headers.title'), align: 'center', key: 'title', width: "20%" },
        { title: i18n.global.t('headers.description'), align: 'center', key: 'description' },
        { title: i18n.global.t('headers.task-count'), align: 'center', key: 'taskCount', width: "150px" },
        { title: i18n.global.t('headers.detail'), align: 'center', key: 'detail', width: "20%" },
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
            <v-toolbar density="compact" class="pr-3">
                <v-text-field :style="{ 'fontSize': preference.font + 'px' }" max-width="400px" class="pl-5" :placeholder="$t('search')" clearable density="compact" prepend-icon="mdi-magnify" hide-details single-line v-model="data.search"></v-text-field>
                <v-spacer></v-spacer>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="util.createProject" :disabled="!permission?.create">
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('create') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="dataImport" :disabled="!permission?.create">
                            <v-icon>mdi-import</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('import') }}
                </v-tooltip>   
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="selectAll">
                            <v-icon>mdi-check-all</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('selectall') }}
                </v-tooltip>    
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="util.cloneSelect" :disabled="!hasSelect || !permission?.create">
                            <v-icon>mdi-content-paste</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('clone') }}
                </v-tooltip>         
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon color='error' v-bind="props" @click="deleteSelect" :disabled="!hasSelect || !permission?.delete">
                            <v-icon>mdi-delete</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('delete') }}
                </v-tooltip> 
            </v-toolbar>
        </template>
        <template #dialog>
            <ProjectDialog v-model="data.dialogModal" 
                :temps="data.temps"
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
        <v-data-table style="background: transparent" :items-per-page="data.itemPrePage" :headers="data.fields" :items="items_final" show-select v-model="data.selection" item-value="uuid" :style="{ 'fontSize': preference.font + 'px' }">
            <template v-slot:item.ID="{ item }">
                <a v-if="canViewDetail" href="#" @click="util.dataChoose(item.uuid)">{{ item.uuid }}</a>
                <span v-else>{{ item.uuid }}</span>
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
                        <v-btn variant="text" v-bind="props" flat icon :disabled="util.isFirst(item.uuid) || !permission?.edit" @click="util.moveUp(item.uuid)" size="small">
                            <v-icon>mdi-arrow-up</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('moveup') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn variant="text" v-bind="props" flat icon :disabled="util.isLast(item.uuid) || !permission?.edit" @click="util.moveDown(item.uuid)" size="small">
                            <v-icon>mdi-arrow-down</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('movedown') }}
                </v-tooltip>
            </template>
        </v-data-table>
    </ContextFrame>
</template>
