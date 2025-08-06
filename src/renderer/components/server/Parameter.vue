<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { Emitter } from 'mitt';
import { computed, inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { AppConfig, BusType, DataType, DataTypeBase, DataTypeText, Parameter, ParameterContainer, ParameterTemplate, ParameterTemplateText, PluginPageData, Preference, ToastData } from '../../interface';
import { i18n } from '../../plugins/i18n';
import { CreateField, DATA, IndexToValue, Temp, Util_Parameter, ValueToGroupName } from '../../util/parameter';
import DialogBase from '../dialog/DialogBase.vue'
import ParameterDialog from '../dialog/ParameterDialog.vue'
import ParameterSetDialog from '../dialog/ParameterSetDialog.vue'
import { v6 as uuidv6 } from 'uuid'
import { BackendProxy } from '../../proxy';

interface PROPS {
    config: AppConfig
    preference: Preference
    backend: BackendProxy
    select: Parameter | undefined
    parameters: Array<Parameter>
    plugin: PluginPageData
}

const emitter:Emitter<BusType> | undefined = inject('emitter');

const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'added', data:Parameter): void
    (e: 'edit', data:Parameter): void
    (e: 'select', uuid:string): void
    (e: 'delete', uuid:string): void
    (e: 'return'): void
}>()
const fields:Ref<Array<any>> = ref([
    { title: 'Name', align: 'center', key: 'name', width: "15%" },
    { title: 'Type', align: 'center', key: 'type', width: "40px" },
    { title: 'Hidden', align: 'center', key: 'hidden', width: "40px" },
    { title: 'Runtime Only', align: 'center', key: 'runtimeOnly', width: "40px" },
    { title: 'Value', align: 'center', key: 'value' },
    { title: 'Detail', align: 'center', key: 'detail', width: "15%" },
])

const data:Ref<DATA> = ref({
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
    createParameterModal: false,
    editMode: false,
    filterModal: false,
    deleteModal: false,
    createData: { name: '', value: 0, hidden: false, runtimeOnly: false, type: DataType.Number },
    editData: { name: '', type: 0, useTemp: false, temp: null },
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

const util:Util_Parameter = new Util_Parameter(props.backend, () => props.plugin, data, () => props.parameters, () => props.select)

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
const temp_name = computed(() => {
    if(data.value.editData.temp == undefined) return ''
    return data.value.temps.find(x => x.value == data.value.editData.temp)?.text
})
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

const updateParameter = () => util.updateParameter()
const selectParameter = (uuid:string) => { emits('select', uuid) }
const recoverParameter = (p:Parameter) => { emits('added', p) }
const createParameter = () => util.createParameter()
const editParameter = (oldname:string) => util.editParameter(oldname)
const saveParameter = () => { emits('edit', data.value.buffer) }

const confirmFilter = () => util.confirmFilter()
const confirmCreate = () => util.confirmCreate()
const confirmEdit = () => util.confirmEdit()
const setdirty = () => data.value.dirty = true
const filterOpen = () => util.filterOpen()

const openSelectTemp = () => {
    data.value.selectTempModel = true
}

const selectSearchF = computed(() => {
    if(data.value.selectSearch == undefined || data.value.selectSearch.length == 0) return props.parameters
    return props.parameters.filter(x => x.title.includes(data.value.selectSearch!) || x.uuid.includes(data.value.selectSearch!))
})

const importPara = () => {
    if(!props.config.isElectron) return
    window.electronAPI.send("import_parameter")
}

const exportPara = async () => {
    if(props.config.isElectron) {
        window.electronAPI.send("export_parameter", JSON.stringify(data.value.buffer))
    }else if(props.config.isExpress){
        const handle = await window.showSaveFilePicker({ suggestedName: data.value.buffer.uuid + '.json' });
        const writer = await handle.createWritable();
        await writer.write(new Blob([JSON.stringify(JSON.stringify(data.value.buffer), null, 2)]))
        await writer.close()
    }
}

const confirmCreateSet = async (v:CreateField) => {
    const d = await util.confirmCreateSet()
    if(d == undefined) return
    emits('added', d)
    data.value.createParameterModal = false
}

const confirmEditSet = async (v:CreateField) => {
    const d = await util.confirmEditSet()
    if(d == undefined) return
    emits('edit', d)
    data.value.createParameterModal = false
}

const confirmSubmitSet = (v:CreateField) => {
    data.value.editData.name = v.name
    data.value.editData.temp = v.temp
    if(!data.value.editMode) confirmCreateSet(v);
    else confirmEditSet(v);
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
    const p:Parameter = JSON.parse(JSON.stringify(props.select))
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

const parameterTemplateTranslate = (t:number):string => {
    return ParameterTemplateText.hasOwnProperty(t) ? i18n.global.t(ParameterTemplateText[t]) : ""
}

const updateTemps = () => {
    data.value.temps = Object.keys(ParameterTemplate).filter(key => isNaN(Number(key))).map((x, index) => {
        const text = parameterTemplateTranslate(IndexToValue(index))
        return {
            text: text.length > 0 ? text : x,
            group: ValueToGroupName(IndexToValue(index)) ?? '',
            value: IndexToValue(index)
        }
    })
    let adder = 0
    props.plugin.templates.forEach(x => {
        x.parameter.forEach(y => {
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

const import_parameter_feedback = (e:IpcRendererEvent, v:string) => {
    const d = JSON.parse(v)
    data.value.buffer = d
    setdirty()
}

const paraSelect = () => { data.value.selectModal = true }

const paraCreate = () => {
    data.value.createParameterModal = true
    data.value.editMode = false
    data.value.editData.name = ''
}

const paraEdit = () => {
    if(props.select == undefined) return
    data.value.createParameterModal = true
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
    saveParameter()
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
        emitter?.emit('makeToast', t)
        console.error(err)
        return
    }
    specialPopupClose()
    saveParameter()
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

const modifyContent = (d:ParameterContainer) => {
    specialPopupClose()
    data.value.objectModal = true
    data.value.objectTarget = d
    data.value.object_temp = JSON.stringify(d.value, null, 4)
}

const modifyContent_T = (d:ParameterContainer) => {
    specialPopupClose()
    data.value.textareaModal = true
    data.value.textareaTarget = d
}

const modifyContent_S = (d:ParameterContainer) => {
    specialPopupClose()
    data.value.selecterModal = true
    data.value.selecterTarget = d
}

const modifyContent_S1 = (d:ParameterContainer) => {
    specialPopupClose()
    data.value.selecterModal1 = true
    data.value.selecterTarget = d
}

const modifyContent_L = (d:ParameterContainer) => {
    specialPopupClose()
    data.value.listModal = true
    data.value.listTarget = d
}

const moveup = (name:string) => util.moveup(name)
const movedown = (name:string) => util.movedown(name)
const isFirst = (name:string) => util.isFirst(name)
const isLast = (name:string) => util.isLast(name)

const goreturn = () => {
    emits('return')
}

onMounted(() => {
    console.log("Parameter Mounted")
    updateLocate()
    emitter?.on('updateLocate', updateLocate)
    emitter?.on('updateParameter', updateParameter)
    emitter?.on('recoverParameter', recoverParameter)
    emitter?.on('selectParameter', selectParameter)
    if(props.config.isElectron){
        window.electronAPI.eventOn("import_parameter_feedback", import_parameter_feedback)
    }
})

onUnmounted(() => {
    emitter?.off('updateLocate', updateLocate)
    emitter?.off('updateParameter', updateParameter)
    emitter?.off('recoverParameter', recoverParameter)
    emitter?.off('selectParameter', selectParameter)
    if(props.config.isElectron){
        window.electronAPI.eventOff("import_parameter_feedback", import_parameter_feedback)
    }
})

</script>

<template>
    <div>
        <div class="py-3">
            <v-toolbar density="compact" class="pr-3">
                <v-text-field :style="{ 'fontSize': props.preference.font + 'px' }" max-width="400px" class="pl-5 mr-5" :placeholder="$t('search')" clearable density="compact" prepend-icon="mdi-magnify" hide-details single-line v-model="data.search"></v-text-field>
                <v-btn size="sm" variant="text" icon="mdi-chevron-left" @click="goreturn"></v-btn>
                <v-chip class="mx-3" v-if="select == undefined" prepend-icon="mdi-paperclip" @click="paraSelect" color="warning">
                    {{ $t('parameter-select') }}
                </v-chip>
                <v-chip class="ml-3" v-else prepend-icon="mdi-paperclip" @click="paraSelect" color="success">
                    {{ select.title }}
                </v-chip>
                <v-btn variant="text" density="comfortable" icon="mdi-plus" @click="paraCreate"></v-btn>
                <v-btn variant="text" density="comfortable" :disabled="props.select == undefined" icon="mdi-pencil" @click="paraEdit"></v-btn>
                <v-spacer></v-spacer>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="createParameter" :disabled="select == undefined">
                            <v-icon>mdi-tag-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('create') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" color="success" @click="saveParameter" :disabled="select == undefined || !data.dirty">
                            <v-icon>mdi-content-save</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('save') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="importPara">
                            <v-icon>mdi-import</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('import') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" :disabled="select == undefined" @click="exportPara">
                            <v-icon>mdi-export</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('export') }}
                </v-tooltip>  
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" :disabled="select == undefined" @click="cloneSelect">
                            <v-icon>mdi-content-paste</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('clone') }}
                </v-tooltip>         
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon color='error' v-bind="props" @click="deleteSelect" :disabled="select == undefined">
                            <v-icon>mdi-delete</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('delete') }}
                </v-tooltip> 
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="filterOpen">
                            <v-icon>mdi-filter</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('filters') }}
                </v-tooltip> 
            </v-toolbar>
        </div>
        <div class="py-3 px-5 text-left" style="height: calc(100vh - 130px); overflow-y: auto;">
            <v-checkbox class="pr-5 text-info" :label="$t('filter.canwrite')" v-model="data.buffer.canWrite" @input="setdirty" hide-details></v-checkbox>
            <v-data-table style="background: transparent" :items-per-page="data.itemPrePage" :headers="fields" :items="items_final" item-value="name" :style="{ 'fontSize': props.preference.font + 'px' }">
                <template v-slot:item.detail="{ item }">
                    <v-btn variant="text" icon @click="editParameter(item.name)" size="small">
                        <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn variant="text" icon :disabled="isFirst(item.name)" @click="moveup(item.name)" size="small">
                        <v-icon>mdi-arrow-up</v-icon>
                    </v-btn>
                    <v-btn variant="text" icon :disabled="isLast(item.name)" @click="movedown(item.name)" size="small">
                        <v-icon>mdi-arrow-down</v-icon>
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
            </v-data-table>
        </div>
        <ParameterDialog width="500" v-model="data.createModal"
            :is-edit="data.editMode"
            :error-message="data.errorMessage"
            :title-error="data.titleError"
            :target-data="data.createData"
            :options="data.options"
            :temps="data.temps"
            :preference="props.preference"
            @confirm-create="confirmCreate"
            @confirm-edit="confirmEdit">
        </ParameterDialog>
        <ParameterSetDialog width="500" v-model="data.createParameterModal"
            :is-edit="data.editMode"
            :error-message="data.errorMessage"
            :title-error="data.titleError"
            :target-data="data.editData"
            :temps="data.temps"
            :preference="props.preference"
            @submit="confirmSubmitSet">
        </ParameterSetDialog>
        <DialogBase width="500" v-model="data.cloneModal" :preference="props.preference">
            <template #title>
                <v-icon>mdi-content-paste</v-icon>
                {{ $t('modal.clone-parameter-set') }}
            </template>
            <template #text>
                <v-text-field :error="data.titleError" v-model="data.cloneName" required :label="$t('modal.enter-parameter-set-name')" hide-details></v-text-field>
                <p v-if="data.errorMessage.length > 0" class="mt-3 text-red">{{ data.errorMessage }}</p>
            </template>
            <template #action>
                <v-btn class="mt-3" color="primary" v-if="!data.editMode" @click="cloneSelectConfirm">{{ $t('create') }}</v-btn>
            </template>
        </DialogBase>
        <DialogBase width="500" v-model="data.selectModal" class="text-white" :preference="props.preference">
            <template #title>
                <v-icon>mdi-pen</v-icon>
                {{ $t('parameter-select') }}
            </template>
            <template #text>
                <v-text-field :placeholder="$t('search')" clearable density="compact" prepend-icon="mdi-magnify" hide-details single-line v-model="data.selectSearch">
                </v-text-field>
                <v-list>
                    <v-list-item v-for="(p, i) in selectSearchF" :key="i">
                        <v-list-item-title>
                            {{ p.title }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            {{ p.uuid }}
                        </v-list-item-subtitle>
                        <template v-slot:append>
                            <v-btn color="grey-lighten-1" icon="mdi-arrow-right" variant="text" @click="selectParameter(p.uuid); data.selectModal = false"
                            ></v-btn>
                        </template>
                    </v-list-item>
                </v-list>
            </template>
        </DialogBase>
        <DialogBase width="500" v-model="data.filterModal" class="text-white" :preference="props.preference">
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
                <v-btn class="mt-3" color="primary" @click="confirmFilter">{{ $t('confirm') }}</v-btn>
            </template>
        </DialogBase>
        <DialogBase :persistent="true" width="800" v-model="data.objectModal" class="text-white" :preference="props.preference">
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
        <DialogBase :persistent="true" width="800" v-model="data.selecterModal" class="text-white" :preference="props.preference">
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
        <DialogBase :persistent="true" width="800" v-model="data.selecterModal1" class="text-white" :preference="props.preference">
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
        <DialogBase :persistent="true" width="800" v-model="data.textareaModal" class="text-white" :preference="props.preference">
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
        <DialogBase :persistent="true" width="800" v-model="data.listModal" class="text-white" :preference="props.preference">
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
                {{ $t('modal.delete-parameter') }}
            </template>
            <template #text>
                <p>{{ $t('modal.delete-parameter-confirm') }}</p>
            </template>
            <template #action>
                <v-btn class="mt-3" color="primary" @click="data.deleteModal = false">{{ $t('cancel') }}</v-btn>
                <v-btn class="mt-3" color="error" @click="deleteConfirm">{{ $t('delete') }}</v-btn>
            </template>
        </DialogBase>
    </div>
</template>

<style scoped>
</style>
