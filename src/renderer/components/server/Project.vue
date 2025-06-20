<script setup lang="ts">
import { Emitter } from 'mitt';
import { v6 as uuidv6 } from 'uuid';
import { computed, inject, nextTick, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { AppConfig, BusType, Parameter, PluginPageData, Preference, Project, ProjectTemplate, ProjectTemplateText } from '../../interface';
import { i18n } from '../../plugins/i18n';
import { CreateField, DATA, IndexToValue, Temp, Util_Project, ValueToGroupName } from '../../util/project';
import ProjectDialog from '../dialog/ProjectDialog.vue';
import { BackendProxy } from '../../proxy';

interface PROPS {
    preference: Preference
    backend: BackendProxy
    projects: Array<Project>
    parameters: Array<Parameter>
    config: AppConfig
    plugin: PluginPageData
}

const emitter:Emitter<BusType> | undefined = inject('emitter');
const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'added', project:Project[]): void
    (e: 'edit', uuid:string, project:Project): void
    (e: 'delete', uuids:Array<string>, bind:boolean): void
    (e: 'select', uuids:string): void
    (e: 'moveup', uuids:string): void
    (e: 'movedown', uuids:string): void
}>()
const data:Ref<DATA> = ref({
    items: [],
    fields: [],
    importModal: false,
    importData: [],
    dialogModal: false,
    isEdit: false,
    editData: {title: "", description: "", useTemp: false, temp: 0, parameter: null, usePara: false},
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

const util:Util_Project = new Util_Project(props.backend, () => props.plugin, data, () => props.projects, () => props.parameters)

const realSearch = computed(() => data.value.search.trimStart().trimEnd())
const items_final = computed(() => { return realSearch.value == null || realSearch.value.length == 0 ? data.value.items : data.value.items.filter(x => x.title.includes(realSearch.value) || x.ID.includes(realSearch.value)) })
const hasSelect = computed(() => data.value.selection.length > 0)
const selected_project_ids = computed(() => data.value.items.filter(x => data.value.selection.includes(x.ID)).map(x => x.ID))

watch(() => props.plugin, () => {
    updateTemps()
})

const updateProject = () => util.updateProject()
const recoverProject = (p:Project) => emits('added', [p])
const createProject = () => util.createProject()
const datachoose = (uuid:string) => emits('select', uuid)
const dataedit = (uuid:string) => util.dataedit(uuid)
const dataimport = () => {
    data.value.importModal = true
}

const dataexport = async (uuid:string) => {
    const p = props.projects.find(x => x.uuid == uuid)
    if(p == undefined) return
    if(props.config.isElectron){
        window.electronAPI.send('export_project', JSON.stringify(p))
    }else if(props.config.isExpress){
        const handle = await window.showSaveFilePicker({ suggestedName: p.uuid + '.json' });
        const writer = await handle.createWritable();
        await writer.write(new Blob([JSON.stringify(p, null, 2)]))
        await writer.close()
    }
}

const deleteSelect = () => {
    data.value.deleteData = selected_project_ids.value
    data.value.deleteModal = true
}

const deleteConfirm = () => {
    data.value.deleteModal = false
    emits('delete', data.value.deleteData, data.value.deleteBind)
    nextTick(() => {
        updateProject()
    })
}

const cloneSelect = () => {
    const ps:Array<Project> = props.projects.filter(x => selected_project_ids.value.includes(x.uuid)).map(y => JSON.parse(JSON.stringify(y)))
    ps.forEach(x => {
        x.uuid = uuidv6()
        x.title = x.title + ` (${i18n.global.t('clone')})`
        x.task.forEach(y => {
            y.uuid = uuidv6()
            y.jobs.forEach(z => {
                z.uuid = uuidv6()
            })
        })
    })
    emits('added', ps)
    nextTick(() => {
        updateProject();
    })
}

const selectall = () => {
    data.value.selection = data.value.items.map(x => x.ID)
}

const DialogSubmit = (p:CreateField) => {
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
    nextTick(() => {
        updateProject();
    })
}

const confirmEdit = () => {
    const selectp = util.confirmEdit()
    if(selectp == undefined) return
    data.value.dialogModal = false
    emits('edit', 
    data.value.editUUID,
        { 
            uuid: data.value.editUUID,
            title: data.value.editData.title, 
            description: data.value.editData.description,
            parameter_uuid: selectp.parameter_uuid,
            parameter: selectp.parameter,
            task: selectp.task
        }
    )
    nextTick(() => {
        updateProject();
    })
}

const ImportConfirm = async () => {
    data.value.importModal = false
    if(props.config.haveBackend) {
        Promise.all(data.value.importData.map(x => x.text())).then(texts => {
            const a = texts.map(x => {
                try {
                    const buffer:Project = JSON.parse(x)
                    buffer.uuid = uuidv6()
                    return buffer
                }catch(err){
                    console.error("Convert text to project json format error")
                    return undefined
                }
            }).filter(x => x != undefined)
            emits('added', a)
        })
    }
}

const moveup = (uuid:string) => {
    emits('moveup', uuid)
    nextTick(() => {
        updateProject();
    })
}

const ProjectTemplateTranslate = (t:number):string => i18n.global.t(ProjectTemplateText[t])

const movedown = (uuid:string) => {
    emits('movedown', uuid)
    nextTick(() => {
        updateProject();
    })
}

const isFirst = (uuid:string) => util.isFirst(uuid)
const isLast = (uuid:string) => util.isLast(uuid)

const updateFields = () => {
    data.value.fields = [
        { title: 'ID', align: 'center', key: 'ID' },
        { title: i18n.global.t('headers.title'), align: 'center', key: 'title' },
        { title: i18n.global.t('headers.description'), align: 'center', key: 'description' },
        { title: i18n.global.t('headers.task-count'), align: 'center', key: 'taskCount' },
        { title: i18n.global.t('headers.detail'), align: 'center', key: 'detail' },
    ]
}

const updateTemps = () => {
    data.value.temps = Object.keys(ProjectTemplate).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            text: ProjectTemplateTranslate(IndexToValue(index)),
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

onMounted(() => {
    updateLocate()
    updateFields()
    emitter?.on('updateProject', updateProject)
    emitter?.on('recoverProject', recoverProject)
    emitter?.on('createProject', createProject)
    emitter?.on('updateLocate', updateLocate)
    if(props.config.isElectron) {
        window.electronAPI.eventOn('createProject', createProject)
    }
})

onUnmounted(() => {
    emitter?.off('updateProject', updateProject)
    emitter?.off('recoverProject', recoverProject)
    emitter?.off('createProject', createProject)
    emitter?.off('updateLocate', updateLocate)
    if(props.config.isElectron) {
        window.electronAPI.eventOff('createProject', createProject)
    }
})
</script>

<template>
    <div>
        <div class="py-3">
            <v-toolbar density="compact" class="pr-3">
                <v-text-field :style="{ 'fontSize': props.preference.font + 'px' }" max-width="400px" class="pl-5" :placeholder="$t('search')" clearable density="compact" prepend-icon="mdi-magnify" hide-details single-line v-model="data.search"></v-text-field>
                <v-spacer></v-spacer>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="createProject">
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('create') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="dataimport">
                            <v-icon>mdi-import</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('import') }}
                </v-tooltip>   
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="selectall">
                            <v-icon>mdi-check-all</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('selectall') }}
                </v-tooltip>    
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="cloneSelect" :disabled="!hasSelect">
                            <v-icon>mdi-content-paste</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('clone') }}
                </v-tooltip>         
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon color='error' v-bind="props" @click="deleteSelect" :disabled="!hasSelect">
                            <v-icon>mdi-delete</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('delete') }}
                </v-tooltip> 
            </v-toolbar>
        </div>
        <div class="pt-3">
            <v-data-table style="background: transparent" :headers="data.fields" :items="items_final" show-select v-model="data.selection" item-value="ID" :style="{ 'fontSize': props.preference.font + 'px' }">
                <template v-slot:item.ID="{ item }">
                    <a href="#" @click="datachoose(item.ID)">{{ item.ID }}</a>
                </template>
                <template v-slot:item.detail="{ item }">
                    <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-btn variant="text" v-bind="props" flat icon @click="datachoose(item.ID)" size="small">
                                <v-icon>mdi-location-enter</v-icon>
                            </v-btn>
                        </template>
                        {{ $t('enter') }}
                    </v-tooltip>
                    <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-btn variant="text" v-bind="props" flat icon @click="dataedit(item.ID)" size="small">
                                <v-icon>mdi-pencil</v-icon>
                            </v-btn>
                        </template>
                        {{ $t('edit') }}
                    </v-tooltip>
                    <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-btn variant="text" v-bind="props" flat icon @click="dataexport(item.ID)" size="small">
                                <v-icon>mdi-export</v-icon>
                            </v-btn>
                        </template>
                        {{ $t('export') }}
                    </v-tooltip>
                    <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-btn variant="text" v-bind="props" flat icon :disabled="isFirst(item.ID)" @click="moveup(item.ID)" size="small">
                                <v-icon>mdi-arrow-up</v-icon>
                            </v-btn>
                        </template>
                        {{ $t('moveup') }}
                    </v-tooltip>
                    <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-btn variant="text" v-bind="props" flat icon :disabled="isLast(item.ID)" @click="movedown(item.ID)" size="small">
                                <v-icon>mdi-arrow-down</v-icon>
                            </v-btn>
                        </template>
                        {{ $t('movedown') }}
                    </v-tooltip>
                </template>
            </v-data-table>
        </div>
        <ProjectDialog v-model="data.dialogModal" 
            :temps="data.temps"
            :plugin="props.plugin"
            :parameters="props.parameters"
            :is-edit="data.isEdit" 
            :error-message="data.errorMessage"
            :title-error="data.titleError"
            :edit-data="data.editData" 
            @submit="DialogSubmit" />
        <v-dialog width="500" v-model="data.deleteModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-pencil</v-icon>
                    {{ $t('modal.delete-project') }}
                </v-card-title>
                <v-card-text>
                    <p>{{ $t('modal.delete-project-confirm') }}</p>
                    <br />
                    <p v-for="(p, i) in data.deleteData">
                        {{ i }}. {{ p }}
                    </p>
                    <v-checkbox v-model="data.deleteBind" :label="$t('modal.delete-project-binding')"></v-checkbox>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" color="primary" @click="data.deleteModal = false">{{ $t('cancel') }}</v-btn>
                    <v-btn class="mt-3" color="error" @click="deleteConfirm">{{ $t('delete') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
        <v-dialog width="800" v-model="data.importModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-import</v-icon>
                    {{ $t('modal.import-project') }}
                </v-card-title>
                <v-card-text>
                    <v-file-upload v-model="data.importData" show-size clearable multiple density="default"></v-file-upload>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" :disabled="data.importData.length == 0" color="primary" @click="ImportConfirm">{{ $t('import') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
    </div>
</template>
