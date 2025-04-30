<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { Emitter } from 'mitt';
import { computed, inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { AppConfig, BusType, DataType, DataTypeText, Parameter, Preference } from '../../interface';
import { i18n } from '../../plugins/i18n';
import { DATA, Util_Parameter } from '../../util/parameter';

interface PROPS {
    config: AppConfig
    preference: Preference
    select: Parameter | undefined
    parameters: Array<Parameter>
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
    { title: 'Name', align: 'center', key: 'name' },
    { title: 'Type', align: 'center', key: 'type' },
    { title: 'Hidden', align: 'center', key: 'hidden' },
    { title: 'Runtime Only', align: 'center', key: 'runtimeOnly' },
    { title: 'Value', align: 'center', key: 'value' },
    { title: 'Detail', align: 'center', key: 'detail' },
])

const data:Ref<DATA> = ref({
    selectModal: false,
    selectSearch: '',
    createModal: false,
    createParameterModal: false,
    editMode: false,
    filterModal: false,
    deleteModal: false,
    createData: { name: '', value: 0, hidden: false, runtimeOnly: false, type: DataType.Number },
    editData: { name: '', type: 0 },
    filter: { showhidden: false, showruntime: false, type: -1 },
    buffer_filter: { showhidden: false, showruntime: false, type: -1 },
    options: [],
    dirty: false,
    buffer: { uuid: '', title: '', canWrite: true, containers: [] },
    errorMessage: '',
    titleError: false,
    search: '',
    search_para: ''
})

const util:Util_Parameter = new Util_Parameter(data, () => props.parameters, () => props.select)

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
const only_options = computed(() => {
    return data.value.options.filter(x => x.title != "All")
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

const importPara = () => {
    if(!props.config.isElectron) return
    window.electronAPI.send("import_parameter")
}

const exportPara = () => {
    if(!props.config.isElectron) return
    window.electronAPI.send("export_parameter", JSON.stringify(data.value.buffer))
}

const confirmCreateSet = () => {
    const d = util.confirmCreateSet()
    if(d == undefined) return
    emits('added', d)
    data.value.createParameterModal = false
}

const confirmEditSet = () => {
    const d = util.confirmEditSet()
    if(d == undefined) return
    emits('edit', d)
    data.value.createParameterModal = false
}

const deleteSelect = () => {
    data.value.deleteModal = true
}

const deleteConfirm = () => {
    data.value.deleteModal = false
    emits('delete', data.value.buffer.uuid)
}

const deleteitem = (name:string) => {
    data.value.buffer.containers = data.value.buffer.containers.filter(x => x.name != name)
    data.value.dirty = true
}

const DataTypeTranslate = (t:number):string => {
    return i18n.global.t(DataTypeText[t])
}

const updateLocate = () => {
    data.value.options = Object.keys(DataType).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            title: DataTypeTranslate(index),
            value: index
        }
    })
    data.value.options.push({ title: "All", value: -1 })
}

const import_parameter_feedback = (e:IpcRendererEvent, v:string) => {
    const d = JSON.parse(v)
    data.value.buffer = d
    setdirty()
}

const paraSelect = () => { data.value.selectModal = true }

const paraCreate = () => {
    data.value.createParameterModal = true
    data.value.editData.name = ''
}

const paraEdit = () => {
    if(props.select == undefined) return
    data.value.createParameterModal = true
    data.value.editMode = true
    data.value.editData.name = props.select.title
}

const moveup = (name:string) => util.moveup(name)
const movedown = (name:string) => util.movedown(name)
const isFirst = (name:string) => util.isFirst(name)
const isLast = (name:string) => util.isLast(name)

const goreturn = () => {
    emits('return')
}

onMounted(() => {
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
            <v-checkbox class="pr-5" :label="$t('filter.canwrite')" v-model="data.buffer.canWrite" @input="setdirty" hide-details></v-checkbox>
            <v-data-table :headers="fields" :items="items_final" item-value="name" :style="{ 'fontSize': props.preference.font + 'px' }">
                <template v-slot:item.detail="{ item }">
                    <v-btn flat icon @click="editParameter(item.name)" size="small">
                        <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn flat icon :disabled="isFirst(item.name)" @click="moveup(item.name)" size="small">
                        <v-icon>mdi-arrow-up</v-icon>
                    </v-btn>
                    <v-btn flat icon :disabled="isLast(item.name)" @click="movedown(item.name)" size="small">
                        <v-icon>mdi-arrow-down</v-icon>
                    </v-btn>
                    <v-btn flat icon :disabled="isLast(item.name)" @click="deleteitem(item.name)" size="small">
                        <v-icon>mdi-delete</v-icon>
                    </v-btn>
                </template>
                <template v-slot:item.value="{ item }">
                    <v-checkbox density="compact" hide-details v-if="item.type == 0" v-model="item.value" @input="setdirty"></v-checkbox>
                    <v-text-field density="compact" hide-details v-if="item.type == 1" type="number" v-model.number="item.value" @input="setdirty"></v-text-field>
                    <v-text-field density="compact" hide-details v-if="item.type == 2" v-model="item.value" @input="setdirty"></v-text-field>
                    <v-text-field density="compact" hide-details v-if="item.type == 3" v-model="item.meta" @input="setdirty"></v-text-field>
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
        <v-dialog width="500" v-model="data.createModal" class="text-white">
            <v-card>
                <v-card-title v-if="!data.editMode">
                    <v-icon>mdi-hammer</v-icon>
                    {{ $t('modal.new-parameter') }}
                </v-card-title>
                <v-card-title v-else>
                    <v-icon>mdi-pencil</v-icon>
                    {{ $t('modal.edit-parameter') }}
                </v-card-title>
                <v-card-text>
                    <v-text-field :error="data.titleError" v-model="data.createData.name" required :label="$t('modal.enter-parameter-name')" hide-details></v-text-field>
                    <v-select class="mt-3" v-model="data.createData.type" :items="only_options" :label="$t('modal.parameter-datatype')" hide-details></v-select>
                    <v-checkbox :label="$t('filter.show-hidden')" v-model="data.createData.hidden" hide-details></v-checkbox>
                    <v-checkbox :label="$t('filter.show-runtime')" v-model="data.createData.runtimeOnly" hide-details></v-checkbox>
                    <p v-if="data.errorMessage.length > 0" class="mt-3 text-red">{{ data.errorMessage }}</p>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" color="primary" v-if="!data.editMode" @click="confirmCreate">{{ $t('create') }}</v-btn>
                    <v-btn class="mt-3" color="primary" v-else @click="confirmEdit">{{ $t('modify') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
        <v-dialog width="500" v-model="data.createParameterModal" class="text-white">
            <v-card>
                <v-card-title v-if="!data.editMode">
                    <v-icon>mdi-hammer</v-icon>
                    {{ $t('modal.new-parameter-set') }}
                </v-card-title>
                <v-card-title v-else>
                    <v-icon>mdi-pencil</v-icon>
                    {{ $t('modal.edit-parameter-set') }}
                </v-card-title>
                <v-card-text>
                    <v-text-field :error="data.titleError" v-model="data.editData.name" required :label="$t('modal.enter-parameter-set-name')" hide-details></v-text-field>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" color="primary" v-if="!data.editMode" @click="confirmCreateSet">{{ $t('create') }}</v-btn>
                    <v-btn class="mt-3" color="primary" v-else @click="confirmEditSet">{{ $t('modify') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
        <v-dialog width="500" v-model="data.selectModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-pen</v-icon>
                    {{ $t('parameter-select') }}
                </v-card-title>
                <v-card-text>
                    <v-text-field :placeholder="$t('search')" clearable density="compact" prepend-icon="mdi-magnify" hide-details single-line v-model="data.selectSearch">
                    </v-text-field>
                    <v-list>
                        <v-list-item v-for="(p, i) in props.parameters" :key="i">
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
                </v-card-text>
            </v-card>
        </v-dialog>
        <v-dialog width="500" v-model="data.filterModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-pen</v-icon>
                    {{ $t('search') }}
                </v-card-title>
                <v-card-text>
                    <v-checkbox class="pl-3" :label="$t('filter.show-hidden')" v-model="data.buffer_filter.showhidden" hide-details></v-checkbox>
                    <v-checkbox class="pl-3" :label="$t('filter.show-runtime')" v-model="data.buffer_filter.showruntime" hide-details></v-checkbox>
                    <v-select class="pl-3" :label="$t('filter.type')" v-model="data.buffer_filter.type" :items="data.options" item-text="text" hide-details></v-select>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" color="primary" @click="confirmFilter">{{ $t('confirm') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
        <v-dialog width="500" v-model="data.deleteModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-pencil</v-icon>
                    {{ $t('modal.delete-parameter') }}
                </v-card-title>
                <v-card-text>
                    <p>{{ $t('modal.delete-parameter-confirm') }}</p>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" color="primary" @click="data.deleteModal = false">{{ $t('cancel') }}</v-btn>
                    <v-btn class="mt-3" color="error" @click="deleteConfirm">{{ $t('delete') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
    </div>
</template>

<style scoped>

</style>
