<script setup lang="ts">
import { IpcRendererEvent } from 'electron'
import { Emitter } from 'mitt'
import { computed, inject, onMounted, onUnmounted, Ref, ref, watch } from 'vue'
import {
    BusType, 
    DataType,
    DataTypeBase, 
    DataTypeText, 
    Database, 
    DatabaseContainer, 
    DatabaseTable, 
    DatabaseTemplateText, 
    PluginPageData, 
    Preference, 
    ToastData 
} from 'verteilen-core/dist/interface'
import { i18n } from '../../plugins/i18n'
import { CreateField, DATA, EmitType, Util_Database } from './Database'
import { v6 as uuidv6 } from 'uuid'
import { BackendProxy } from '../../proxy'

//#region Views
import { VueDraggableNext } from 'vue-draggable-next'
import DialogBase from '../dialog/DialogBase.vue'
import DatabaseDialog from '../dialog/database/DatabaseDialog.vue'
import DatabaseValueDialog from '../dialog/database/DatabaseValueDialog.vue'
import DatabaseSelectionDialog from '../dialog/database/DatabaseSelectionDialog.vue'
import ContextFrame from '../components/layout/ContextFrame.vue'
//#endregion

//#region Data
interface PROPS {
    select: DatabaseTable | undefined
    databases: Array<DatabaseTable>
    plugin: PluginPageData
}
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const backend:Ref<BackendProxy> = inject("backend")!
const preference:Ref<Preference> = inject("preference")!
const props = defineProps<PROPS>()
const emits = defineEmits<EmitType>()
const data:Ref<DATA> = ref({
    fields: [],
    importModal: false,
    importData: [],
    selectTempModel: false,
    itemPrePage: -1,
    cloneModal: false,
    cloneName: "",
    objectModal: false,
    selecterModal: false,
    selecterModal1: false,
    textareaModal: false,
    listModal: false,
    objectTarget: undefined,
    selecterTarget: undefined,
    textareaTarget: undefined,
    listTarget: undefined,
    selectModal: false,
    selectSearch: '',
    createModal: false,
    createDatabaseModal: false,
    editMode: false,
    filterModal: false,
    deleteModal: false,
    createData: { name: '', value: 0, hidden: false, runtimeOnly: false, type: DataType.Number },
    editData: { name: '', type: 0, useTemp: false, temp: null, canWrite: true },
    filter: { showhidden: false, showruntime: false, type: -1 },
    buffer_filter: { showhidden: false, showruntime: false, type: -1 },
    options: [],
    options1: [],
    dirty: false,
    buffer: { uuid: '', title: '', canWrite: true, containers: [] },
    errorMessage: '',
    titleError: false,
    search: '',
    search_para: '',
    temps: [],
    object_temp: ''
})
//#endregion

//#region Watch
watch(() => props.select, () => {
    data.value.buffer = props.select != undefined ? JSON.parse(JSON.stringify(props.select)) : { uuid: '', title: '', canWrite: true, containers: [] }
})
//#endregion

//#region Compute
const config = computed(() => backend.value.config)
const items_final = computed(() => data.value.buffer.containers
    .filter(x => {
        if (!data.value.filter.showruntime && x.runtimeOnly) return false
        return true
    })
    .filter(x => {
        if (!data.value.filter.showhidden && x.hidden) return false
        return true
    })
    .filter(x => {
        return data.value.search == null || data.value.search.length == 0 ? true : x.name.includes(data.value.search)
    })
    .filter(x => {
        if(data.value.filter.type == -1) return true
        return data.value.filter.type == x.type
    })
)
const select_option = computed(() => {
    if(data.value.selecterTarget == undefined) return []
    const a:Array<any> = data.value.selecterTarget.meta
    const c = data.value.selecterTarget.config!.types
    return a.map((x, index) => {
        let str = String(index) + ":  "
        switch(c[index]){
            case DataTypeBase.Boolean:
                str += x ? "True" : "False"
                break;
            case DataTypeBase.Number:
                str += String(x)
                break;
            case DataTypeBase.String:
                str += "\"" + String(x) + "\""
                break;
        }
        return {
            title: str,
            value: index,
        }
    })
})
const plugin = computed(() => props.plugin)
const database = computed(() => props.databases)
const select = computed(() => props.select)
const util:Util_Database = new Util_Database(backend, data, emits, plugin, database, select)
//#endregion

//#region Methods
const selectDatabase = (uuid:string) => { emits('select', uuid) }
const recoverDatabase = (p:Database) => { emits('added', p) }
const createDatabase = () => util.createDatabase()
const editDatabase = (oldname:string) => util.editDatabase(oldname)

const setdirty = () => data.value.dirty = true
const filterOpen = () => util.filterOpen()

const selectSearchF = computed(() => {
    if(data.value.selectSearch == undefined || data.value.selectSearch.length == 0) return props.databases
    return props.databases.filter(x => x.title.includes(data.value.selectSearch!) || x.uuid.includes(data.value.selectSearch!))
})

const importPara = () => {
    data.value.importModal = true
}

const ImportConfirm = () => {
    data.value.importModal = false
    Promise.all(data.value.importData.map(x => x.text())).then(texts => {
        const a = texts.map(x => {
            try {
                const buffer:Database = JSON.parse(x)
                buffer.uuid = uuidv6()
                return buffer
            }catch(err){
                console.error("Convert text to project json format error")
                return undefined
            }
        }).filter(x => x != undefined)
        a.forEach(aa => emits('added', aa))
    })
}

const exportPara = async () => {
    if(config.value.isElectron) {
        backend.value.send("export_database", JSON.stringify(data.value.buffer))
    }else if(config.value.isExpress){
        const handle = await window.showSaveFilePicker({ suggestedName: data.value.buffer.uuid + '.json' });
        const writer = await handle.createWritable();
        await writer.write(new Blob([JSON.stringify(JSON.stringify(data.value.buffer), null, 2)]))
        await writer.close()
    }
}

const confirmSubmitSet = (v:CreateField) => {
    data.value.editData.name = v.name
    data.value.editData.temp = v.temp
    data.value.editData.useTemp = v.temp != null
    if(!data.value.editMode) confirmCreateSet(v);
    else confirmEditSet(v);
}
const confirmCreateSet = async (v:CreateField) => {
    const d = await util.confirmCreateSet()
    if(d == undefined) return
    emits('added', d)
    data.value.createDatabaseModal = false
    setTimeout(() => {
        selectDatabase(d.uuid)
    }, 500);
}
const confirmEditSet = async (v:CreateField) => {
    const d = await util.confirmEditSet()
    if(d == undefined) return
    emits('edit', d)
    data.value.createDatabaseModal = false
}

const deleteSelect = () => {
    data.value.errorMessage = ""
    data.value.deleteModal = true
}

const deleteConfirm = () => {
    data.value.errorMessage = ""
    data.value.deleteModal = false
    emits('delete', data.value.buffer.uuid)
}

const cloneSelect = () => {
    data.value.errorMessage = ""
    data.value.cloneModal = true
    data.value.cloneName = props.select?.title + " Clone"
}

const cloneSelectConfirm = () => {
    const p:Database = JSON.parse(JSON.stringify(props.select))
    p.title = data.value.cloneName
    p.uuid = uuidv6()
    data.value.cloneModal = false
    emits('added', p)
}

const deleteitem = (name:string) => {
    data.value.buffer.containers = data.value.buffer.containers.filter(x => x.name != name)
    data.value.dirty = true
}

const DataTypeTranslate = (t:number):string => {
    return i18n.global.t(DataTypeText[t])
}

const import_database_feedback = (e:IpcRendererEvent, v:string) => {
    const d = JSON.parse(v)
    data.value.buffer = d
    setdirty()
}

const paraSelect = () => { data.value.selectModal = true }

const paraCreate = () => {
    data.value.createDatabaseModal = true
    data.value.editMode = false
    data.value.editData.name = ''
}

const paraEdit = () => {
    if(props.select == undefined) return
    data.value.createDatabaseModal = true
    data.value.editMode = true
    data.value.editData.name = props.select.title
}

const specialPopupClose = () => {
    data.value.objectModal = false
    data.value.selecterModal = false
    data.value.selecterModal1 = false
    data.value.textareaModal = false
    data.value.listModal = false
}

const confirmSpecialModify = () => {
    specialPopupClose()
    data.value.dirty = true
}

const confirmSpecialModify_O = () => {
    if(data.value.objectTarget == undefined) return
    try{
        data.value.objectTarget.value = JSON.parse(data.value.object_temp)
    }catch(err:any){
        const t:ToastData = {
            title: "Parse Error",
            type: "error",
            message: err.message,
        }
        emitter.emit('makeToast', t)
        console.error(err)
        return
    }
    specialPopupClose()
    data.value.dirty = true
}

const selectAdd = () => {
    if(data.value.selecterTarget == undefined) return
    if(data.value.selecterTarget.config == undefined) data.value.selecterTarget.config = { types: [DataTypeBase.Number] }
    const config = data.value.selecterTarget.config
    const type = config.types[config.types.length - 1]
    config.types.push(type)
    switch(type){
        case DataTypeBase.Boolean:
            data.value.selecterTarget.meta.push(false)
            break;
        case DataTypeBase.Number:
            data.value.selecterTarget.meta.push(0)
            break;
        case DataTypeBase.String:
            data.value.selecterTarget.meta.push("")
            break;
    }
}

const modifyContent = (d:DatabaseContainer) => {
    specialPopupClose()
    data.value.objectModal = true
    data.value.objectTarget = d
    data.value.object_temp = JSON.stringify(d.value, null, 4)
}

const modifyContent_T = (d:DatabaseContainer) => {
    specialPopupClose()
    data.value.textareaModal = true
    data.value.textareaTarget = d
}

const modifyContent_S = (d:DatabaseContainer) => {
    specialPopupClose()
    data.value.selecterModal = true
    data.value.selecterTarget = d
}

const modifyContent_S1 = (d:DatabaseContainer) => {
    specialPopupClose()
    data.value.selecterModal1 = true
    data.value.selecterTarget = d
}

const modifyContent_L = (d:DatabaseContainer) => {
    specialPopupClose()
    data.value.listModal = true
    data.value.listTarget = d
}

const goreturn = () => {
    emits('return')
}

const onHotkey = (value:string) => {
    if(value == 'create_database'){
        createDatabase()
    }
    else if(value == 'database_save'){
        if(data.value.objectModal) confirmSpecialModify_O()
        else util.save()
    }
}
const updateLocate = () => {
    updateTemps()
    updateFields()
    data.value.options = Object.keys(DataType).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            title: DataTypeTranslate(index),
            value: index
        }
    })
    data.value.options.push({ title: "All", value: -1 })
    data.value.options1 = Object.keys(DataTypeBase).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            title: DataTypeTranslate(index),
            value: index
        }
    })
}
const updateTemps = () => {
    /**
    data.value.temps = Object.keys(DatabaseTemplate).filter(key => isNaN(Number(key))).map((x, index) => {
        const text = databaseTemplateTranslate(IndexToValue(index))
        return {
            text: text.length > 0 ? text : x,
            group: ValueToGroupName(IndexToValue(index)) ?? '',
            value: IndexToValue(index)
        }
    })
    let adder = 0
    
    props.plugin.templates.forEach(x => {
        x.database.forEach(y => {
            const buffer:Temp = {
                text: y.title ? y.title : "Null",
                group: y.group,
                value: 1000 + adder
            }
            adder += 1
            data.value.temps.push(buffer)
        })
    })
     */
}
const updateFields = () => {
    data.value.fields = [
        { title: $t('headers.title'), align: 'center', key: 'name', minWidth: "80px", sortable: false },
        { title: $t('headers.type'), align: 'center', key: 'type', maxWidth: "60px", sortable: false },
        { title: $t('headers.hidden'), align: 'center', key: 'hidden', maxWidth: "60px", sortable: false },
        { title: $t('headers.runtime'), align: 'center', key: 'runtimeOnly', maxWidth: "60px", sortable: false },
        { title: $t('headers.value'), align: 'center', key: 'value', sortable: false },
        { title: $t('headers.detail'), align: 'center', key: 'detail', maxWidth: "80px", sortable: false },
    ]
}
//#endregion

onMounted(() => {
    updateLocate()
    emitter.on('hotkey', onHotkey)
    emitter.on('updateLocate', updateLocate)
    emitter.on('recoverDatabase', recoverDatabase)
    emitter.on('selectDatabase', selectDatabase)
    if(config.value.haveBackend){
        backend.value.eventOn("import_database_feedback", import_database_feedback)
    }
})

onUnmounted(() => {
    emitter.off('hotkey', onHotkey)
    emitter.off('updateLocate', updateLocate)
    emitter.off('recoverDatabase', recoverDatabase)
    emitter.off('selectDatabase', selectDatabase)
    if(config.value.haveBackend){
        backend.value.eventOff("import_database_feedback", import_database_feedback)
    }
})
</script>

<template>
    <ContextFrame>
        <template #toolbar>
            <v-toolbar density="compact" class="px-3">
                <v-btn size="sm" variant="text" icon="mdi-chevron-left" @click="goreturn"></v-btn>
                <v-chip class="mx-3" v-if="select == undefined" prepend-icon="mdi-paperclip" @click="paraSelect" color="warning">
                    {{ $t('database-select') }}
                </v-chip>
                <v-chip class="ml-3" v-else prepend-icon="mdi-paperclip" @click="paraSelect" color="success">
                    {{ select.title }}: {{ data.buffer.uuid.slice(data.buffer.uuid.length - 12, data.buffer.uuid.length) }}
                </v-chip>
                <v-btn variant="text" density="comfortable" prepend-icon="mdi-database-plus" @click="paraCreate">
                    {{ $t('create') }}
                </v-btn>
                <v-btn prepend-icon="mdi-content-paste" v-bind="props" :disabled="select == undefined" @click="cloneSelect">
                    {{ $t('clone') }}
                </v-btn>
                <v-btn variant="text" density="comfortable" :disabled="props.select == undefined" prepend-icon="mdi-pencil" @click="paraEdit">
                    {{ $t('edit') }}
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn prepend-icon="mdi-tag-plus" v-bind="props" @click="createDatabase" :disabled="select == undefined">
                    {{ $t('create') }}
                </v-btn>
                <v-btn prepend-icon="mdi-content-save" v-bind="props" color="success" @click="util.save" :disabled="select == undefined || !data.dirty">
                    {{ $t('save') }}
                </v-btn>
                <v-btn prepend-icon="mdi-import" v-bind="props" @click="importPara">
                    {{ $t('import') }}
                </v-btn>
                <v-btn prepend-icon="mdi-export" v-bind="props" :disabled="select == undefined" @click="exportPara">
                    {{ $t('export') }}
                </v-btn>
                <v-btn prepend-icon="mdi-delete" color='error' v-bind="props" @click="deleteSelect" :disabled="select == undefined">
                    {{ $t('delete') }}
                </v-btn>   
                <v-btn prepend-icon="mdi-filter" v-bind="props" @click="filterOpen">
                    {{ $t('filters') }}
                </v-btn>      
            </v-toolbar>
        </template>
        <template #dialog>
            <DatabaseValueDialog width="500" v-model="data.createModal"
                :is-edit="data.editMode"
                :error-message="data.errorMessage"
                :title-error="data.titleError"
                :target-data="data.createData"
                :options="data.options"
                :plugin="props.plugin"
                @confirm-create="util.confirmCreate"
                @confirm-edit="util.confirmEdit" />
            <DatabaseDialog width="500" v-model="data.createDatabaseModal"
                :is-edit="data.editMode"
                :error-message="data.errorMessage"
                :title-error="data.titleError"
                :target-data="data.editData"
                :plugin="props.plugin"
                @submit="confirmSubmitSet" />
            <DatabaseSelectionDialog v-model="data.selectModal" 
                :items="selectSearchF" 
                @select_uuid="e => emits('select', e)" />
            <DialogBase width="500" v-model="data.cloneModal" :preference="preference">
                <template #title>
                    <v-icon>mdi-content-paste</v-icon>
                    {{ $t('modal.clone-database-set') }}
                </template>
                <template #text>
                    <v-text-field :error="data.titleError" v-model="data.cloneName" required :label="$t('modal.enter-database-set-name')" hide-details></v-text-field>
                    <p v-if="data.errorMessage.length > 0" class="mt-3 text-red">{{ data.errorMessage }}</p>
                </template>
                <template #action>
                    <v-btn class="mt-3" color="primary" v-if="!data.editMode" @click="cloneSelectConfirm">{{ $t('create') }}</v-btn>
                </template>
            </DialogBase>
            <DialogBase width="500" v-model="data.filterModal" class="text-white" :preference="preference">
                <template #title>
                    <v-icon>mdi-pen</v-icon>
                    {{ $t('search') }}
                </template>
                <template #text>
                    <v-checkbox class="pl-3" :label="$t('filter.show-hidden')" v-model="data.buffer_filter.showhidden" hide-details></v-checkbox>
                    <v-checkbox class="pl-3" :label="$t('filter.show-runtime')" v-model="data.buffer_filter.showruntime" hide-details></v-checkbox>
                    <v-select class="pl-3" :label="$t('filter.type')" v-model="data.buffer_filter.type" :items="data.options" item-text="text" hide-details></v-select>
                </template>
                <template #action>
                    <v-btn class="mt-3" color="primary" @click="util.confirmFilter">{{ $t('confirm') }}</v-btn>
                </template>
            </DialogBase>
            <DialogBase :persistent="true" width="800" v-model="data.objectModal" class="text-white" :preference="preference">
                <template #title>
                    <v-icon>mdi-pen</v-icon>
                    {{ $t('types.object') }}
                </template>
                <template #text v-if="data.objectTarget != undefined">
                    <codemirror-json v-model="data.object_temp" 
                        style="text-align:left;"
                        :style="{ height: '40vh' }"
                        @change="setdirty"/>
                </template>
                <template #action>
                    <v-btn class="mt-3" color="primary" @click="confirmSpecialModify_O">{{ $t('confirm') }}</v-btn>
                </template>
            </DialogBase>
            <DialogBase :persistent="true" width="800" v-model="data.selecterModal" class="text-white" :preference="preference">
                <template #title>
                    <v-icon>mdi-pen</v-icon>
                    {{ $t('types.select') }}
                </template>
                <template #text v-if="data.selecterTarget != undefined">
                    <v-sheet>
                        <v-btn variant="text" class="mx-1" color="primary" @click="selectAdd">{{ $t('create') }}</v-btn>
                        <v-btn variant="text" class="mx-1" color="error" @click="data.selecterTarget.meta = []">{{ $t('clean') }}</v-btn>
                    </v-sheet>
                    <v-card style="height: 50vh; overflow-y: auto;" class="border-thin border-primary" v-if="data.selecterTarget.config">
                        <v-row v-for="(item, index) in data.selecterTarget.meta" :key="index">
                            <v-col cols="1" class="mt-1 pl-4">
                                <v-chip>{{ index }}</v-chip>
                            </v-col>
                            <v-col cols="2">
                                <v-select v-model="data.selecterTarget.config.types[index]" :items="data.options1" density="compact" hide-details></v-select>
                            </v-col>
                            <v-col cols="9">
                                <v-checkbox density="compact" hide-details v-if="data.selecterTarget.config.types[index] === DataTypeBase.Boolean" v-model="data.selecterTarget.meta[index]"></v-checkbox>
                                <v-text-field density="compact" hide-details v-else-if="data.selecterTarget.config.types[index] === DataTypeBase.Number" type="number" v-model.number="data.selecterTarget.meta[index]"></v-text-field>
                                <v-text-field density="compact" hide-details v-else-if="data.selecterTarget.config.types[index] === DataTypeBase.String" v-model="data.selecterTarget.meta[index]"></v-text-field>
                            </v-col>
                        </v-row>
                    </v-card>
                </template>
                <template #action>
                    <v-btn class="mt-3" color="primary" @click="confirmSpecialModify">{{ $t('confirm') }}</v-btn>
                </template>
            </DialogBase>
            <DialogBase :persistent="true" width="800" v-model="data.selecterModal1" class="text-white" :preference="preference">
                <template #title>
                    <v-icon>mdi-pen</v-icon>
                    {{ $t('types.select') }}
                </template>
                <template #text v-if="data.selecterTarget != undefined">
                    <v-select class="w-100" v-model="data.selecterTarget.value" :items="select_option">
                    </v-select>
                </template>
                <template #action>
                    <v-btn class="mt-3" color="primary" @click="confirmSpecialModify">{{ $t('confirm') }}</v-btn>
                </template>
            </DialogBase>
            <DialogBase :persistent="true" width="800" v-model="data.textareaModal" class="text-white" :preference="preference">
                <template #title>
                    <v-icon>mdi-pen</v-icon>
                    {{ $t('types.textarea') }}
                </template>
                <template #text v-if="data.textareaTarget != undefined">
                    <v-textarea v-model="data.textareaTarget.value" 
                        style="text-align:left;"
                        placeholder="Enter Text Here..."
                        :style="{ height: '40vh' }"
                        @change="setdirty"/>
                </template>
                <template #action>
                    <v-btn class="mt-3" color="primary" @click="confirmSpecialModify">{{ $t('confirm') }}</v-btn>
                </template>
            </DialogBase>
            <DialogBase :persistent="true" width="800" v-model="data.listModal" class="text-white" :preference="preference">
                <template #title>
                    <v-icon>mdi-pen</v-icon>
                    {{ $t('types.list') }}
                </template>
                <template #text v-if="data.listTarget != undefined">
                    <v-sheet>
                        <v-btn variant="text" class="mx-1" color="primary" @click="data.listTarget.value.push('')">{{ $t('create') }}</v-btn>
                        <v-btn variant="text" class="mx-1" color="error" @click="data.listTarget.value = []">{{ $t('clean') }}</v-btn>
                    </v-sheet>
                    <v-card style="height: 50vh; overflow-y: auto;" class="border-thin border-primary">
                        <div v-for="(ttt, index) in data.listTarget.value" :key="index">
                            <v-text-field :label="String(index)" hide-details single-line v-model="data.listTarget.value[index]">
                                <template v-slot:prepend>
                                    <v-btn color="error" icon="mdi-delete" variant="text" @click="data.listTarget.value.splice(index, 1)"></v-btn>
                                </template>
                            </v-text-field>
                        </div>
                    </v-card>
                </template>
                <template #action>
                    <v-btn class="mt-3" color="primary" @click="confirmSpecialModify">{{ $t('confirm') }}</v-btn>
                </template>
            </DialogBase>
            <DialogBase width="500" v-model="data.deleteModal" class="text-white">
                <template #title>
                    <v-icon>mdi-pencil</v-icon>
                    {{ $t('modal.delete-database') }}
                </template>
                <template #text>
                    <p>{{ $t('modal.delete-database-confirm') }}</p>
                </template>
                <template #action>
                    <v-btn class="mt-3" color="primary" @click="data.deleteModal = false">{{ $t('cancel') }}</v-btn>
                    <v-btn class="mt-3" color="error" @click="deleteConfirm">{{ $t('delete') }}</v-btn>
                </template>
            </DialogBase>
            <DialogBase width="800" v-model="data.importModal" class="text-white" :preference="preference">
                <template #title>
                    <v-icon>mdi-import</v-icon>
                    {{ $t('modal.import-project') }}
                </template>
                <template #text>
                    <v-file-upload v-model="data.importData" show-size clearable multiple density="default"></v-file-upload>
                </template>
                <template #action>
                    <v-btn class="mt-3" :disabled="data.importData.length == 0" color="primary" @click="ImportConfirm">{{ $t('import') }}</v-btn>
                </template>
            </DialogBase>
        </template>
        <v-card flat style="background: transparent">
            <v-card-text class="my-0 py-0">
                <v-text-field v-model="data.search" class="mb-2" :style="{ 'fontSize': preference.font + 'px' }" :placeholder="$t('search')" clearable prepend-icon="mdi-magnify" hide-details single-line></v-text-field>
                <v-data-table style="background: transparent" hide-default-footer :items-per-page="data.itemPrePage" :headers="data.fields" :items="items_final" item-value="name" :style="{ 'fontSize': preference.font + 'px' }">
                    <template #body="props"></template>
                    <template #tbody="props">
                        <VueDraggableNext v-model="items_final" 
                            tag="tbody"
                            :move="util.move"
                            @end="util.end"
                        >
                            <v-data-table-row v-for="(item, index) in props.internalItems"
                                :key="index"
                                :item="item"
                                :index="index"
                                :cell-props="props"
                            >
                                <template v-slot:item.detail="{ item }">
                                    <v-btn variant="text" icon @click="editDatabase(item.name)" size="small">
                                        <v-icon>mdi-pencil</v-icon>
                                    </v-btn>
                                    <v-btn variant="text" icon @click="deleteitem(item.name)" size="small">
                                        <v-icon>mdi-delete</v-icon>
                                    </v-btn>
                                </template>
                                <template v-slot:item.value="{ item }">
                                    <v-checkbox density="compact" hide-details v-if="item.type == DataType.Boolean" v-model="item.value" @input="setdirty"></v-checkbox>
                                    <v-text-field density="compact" hide-details v-else-if="item.type == DataType.Number" type="number" v-model.number="item.value" @input="setdirty"></v-text-field>
                                    <v-text-field density="compact" hide-details v-else-if="item.type == DataType.String" v-model="item.value" @input="setdirty"></v-text-field>
                                    <v-text-field density="compact" hide-details v-else-if="item.type == DataType.Expression" v-model="item.meta" @input="setdirty"></v-text-field>
                                    <v-btn class="w-100" color="primary" variant="tonal" density="compact" hide-details v-else-if="item.type == DataType.Object" @click="modifyContent(item)">{{ $t("modify") }}</v-btn>
                                    <v-btn class="w-100" color="primary" variant="tonal" density="compact" hide-details v-else-if="item.type == DataType.Textarea" @click="modifyContent_T(item)">{{ $t("modify") }}</v-btn>
                                    <v-btn class="w-100" color="primary" variant="tonal" density="compact" hide-details v-else-if="item.type == DataType.List" @click="modifyContent_L(item)">{{ $t("modify") }}</v-btn>
                                    <v-row v-else-if="item.type == DataType.Select">
                                        <v-col cols="4">
                                            <v-btn class="w-100" color="primary" variant="tonal" density="compact" hide-details @click="modifyContent_S(item)">{{ $t("modify") }}</v-btn>
                                        </v-col>
                                        <v-col cols="8">
                                            <v-btn class="w-100" color="warning" variant="tonal" density="compact" hide-details @click="modifyContent_S1(item)">{{ $t("types.select") }}</v-btn>
                                        </v-col>
                                    </v-row>
                                </template>
                                <template v-slot:item.hidden="{ item }">
                                    <v-chip :color="item.hidden ? 'success' : 'error'">{{ item.hidden }}</v-chip>
                                </template>
                                <template v-slot:item.runtimeOnly="{ item }">
                                    <v-chip :color="item.runtimeOnly ? 'success' : 'error'">{{ item.runtimeOnly }}</v-chip>
                                </template>
                                <template v-slot:item.type="{ item }">
                                    <v-chip color="info">{{ DataTypeTranslate(item.type) }}</v-chip>
                                </template>
                            </v-data-table-row>
                        </VueDraggableNext>
                    </template>
                </v-data-table>
            </v-card-text>
        </v-card>
    </ContextFrame>
</template>

<style scoped>
</style>
