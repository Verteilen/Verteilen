<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { Emitter } from 'mitt';
import { computed, inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { AppConfig, BusType, DataType, DataTypeText, Parameter, ParameterContainer, Preference, Project } from '../../interface';
import { i18n } from '../../plugins/i18n';

interface PROPS {
    config: AppConfig
    preference: Preference
    select: Project | undefined
}

const emitter:Emitter<BusType> | undefined = inject('emitter');

const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'edit', data:Parameter): void
}>()
const fields:Ref<Array<any>> = ref([
    { title: 'Name', align: 'center', key: 'name' },
    { title: 'Type', align: 'center', key: 'type' },
    { title: 'Hidden', align: 'center', key: 'hidden' },
    { title: 'Runtime Only', align: 'center', key: 'runtimeOnly' },
    { title: 'Value', align: 'center', key: 'value' },
    { title: 'Detail', align: 'center', key: 'detail' },
])
const createModal = ref(false)
const editMode = ref(false)
const createData:Ref<ParameterContainer> = ref({ name: '', value: 0, hidden: false, runtimeOnly: false, type: DataType.Number })
const editData = ref({ name: '', type: 0 })
const filter = ref({ showhidden: false, showruntime: false, type: -1 })
const options:Ref<Array<{ title: string, value:number }>> = ref([])
const dirty = ref(false)
const buffer:Ref<Parameter> = ref({ canWrite: true, containers: [] })
const errorMessage = ref('')
const titleError = ref(false)
const selection:Ref<Array<string>> = ref([])
const search = ref('')

const hasSelect = computed(() => selection.value.length > 0)
const items_final = computed(() => buffer.value.containers
    .filter(x => {
        if (!filter.value.showruntime && x.runtimeOnly) return false
        return true
    })
    .filter(x => {
        if (!filter.value.showhidden && x.hidden) return false
        return true
    })
    .filter(x => {
        return search.value == null || search.value.length == 0 ? true : x.name.includes(search.value)
    })
    .filter(x => {
        if(filter.value.type == -1) return true
        return filter.value.type == x.type
    }))

const updateParameter = () => {
    if( props.select == undefined) return
    buffer.value = JSON.parse(JSON.stringify(props.select.parameter))
    dirty.value = false
}

const createParameter = () => {
    createData.value = { name: '', value: 0, hidden: false, runtimeOnly: false, type: DataType.Number }
    createModal.value = true
    editMode.value = false
    errorMessage.value = ''
    titleError.value = false
}

const editParameter = (oldname:string) => {
    const p = buffer.value.containers.find(x => x.name == oldname)
    if(p == undefined) return
    createData.value = JSON.parse(JSON.stringify(p))
    editData.value.name = p.name
    editData.value.type = p.type
    createModal.value = true
    editMode.value = true
    errorMessage.value = ''
    titleError.value = false
}

const cloneSelect = () => {
    const ps = buffer.value.containers.filter(x => selection.value.includes(x.name))
    ps.forEach(x => x.name += ` (${i18n.global.t('clone')})`)
    buffer.value.containers.push(...ps)
    dirty.value = true
}

const saveParameter = () => {
    emits('edit', buffer.value)
}

const importPara = () => {
    if(!props.config.isElectron) return
    window.electronAPI.send("import_parameter")
}

const exportPara = () => {
    if(!props.config.isElectron) return
    window.electronAPI.send("export_parameter", JSON.stringify(buffer.value))
}

const selectall = (s:boolean) => {
    selection.value = buffer.value.containers.map(x => x.name)
}

const confirmCreate = () => {
    if(createData.value.name.length == 0){
        errorMessage.value = i18n.global.t('error.title-needed')
        titleError.value = true
        return
    }
    if(buffer.value.containers.findIndex(x => x.name == createData.value.name) != -1){
        errorMessage.value = i18n.global.t('error.title-repeat')
        titleError.value = true
        return
    }
    buffer.value.containers.push(createData.value)
    createModal.value = false
    dirty.value = true
}

const confirmEdit = () => {
    if(createData.value.name.length == 0){
        errorMessage.value = i18n.global.t('error.title-needed')
        titleError.value = true
        return
    }
    if(editData.value.name != createData.value.name){
        if(buffer.value.containers.findIndex(x => x.name == createData.value.name) != -1){
            errorMessage.value = i18n.global.t('error.title-repeat')
            titleError.value = true
            return
        }
    }
    if(createData.value.type != editData.value.type){
        if(createData.value.type = DataType.Boolean) createData.value.value = false
        else if(createData.value.type = DataType.Expression) createData.value.value = ''
        else if(createData.value.type = DataType.Number) createData.value.value = 0
        else if(createData.value.type = DataType.String) createData.value.value = ''
    }
    const index = buffer.value.containers.findIndex(x => x.name == editData.value.name)
    buffer.value.containers[index] = createData.value
    createModal.value = false
    dirty.value = true
}

const deleteSelect = () => {
    buffer.value.containers = buffer.value.containers.filter(x => !selection.value.includes(x.name))
    selection.value = []
    dirty.value = true
}

const setdirty = () => dirty.value = true

const DataTypeTranslate = (t:number):string => {
    return i18n.global.t(DataTypeText[t])
}

const updateLocate = () => {
    options.value = Object.keys(DataType).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            title: DataTypeTranslate(index),
            value: index
        }
    })
    options.value.push({ title: "All", value: -1 })
}

const import_parameter_feedback = (e:IpcRendererEvent, v:string) => {
    buffer.value = JSON.parse(v)
    setdirty()
}

const moveup = (name:string) => {
    const index = buffer.value.containers.findIndex(x => x.name == name)
    const bb = buffer.value.containers[index]
    buffer.value.containers[index] = buffer.value.containers[index - 1]
    buffer.value.containers[index - 1] = bb
    dirty.value = true
}

const movedown = (name:string) => {
    const index = buffer.value.containers.findIndex(x => x.name == name)
    const bb = buffer.value.containers[index]
    buffer.value.containers[index] = buffer.value.containers[index + 1]
    buffer.value.containers[index + 1] = bb
    dirty.value = true
}

const isFirst = (name:string) => {
    const index = buffer.value.containers.findIndex(x => x.name == name)
    return index <= 0
}

const isLast = (name:string) => {
    const index = buffer.value.containers.findIndex(x => x.name == name)
    if(index == -1) return true
    return index == buffer.value.containers.length - 1
}

onMounted(() => {
    updateLocate()
    emitter?.on('updateLocate', updateLocate)
    emitter?.on('updateParameter', updateParameter)
    nextTick(() => {
        updateParameter()
    })
    if(props.config.isElectron){
        window.electronAPI.eventOn("import_parameter_feedback", import_parameter_feedback)
    }
})

onUnmounted(() => {
    emitter?.off('updateLocate', updateLocate)
    emitter?.off('updateParameter', updateParameter)
    if(props.config.isElectron){
        window.electronAPI.eventOff("import_parameter_feedback", import_parameter_feedback)
    }
})

</script>

<template>
    <div>
        <div class="py-3">
            <v-toolbar density="compact" class="pr-3">
                <v-text-field :style="{ 'fontSize': props.preference.font + 'px' }" max-width="400px" class="pl-5 mr-5" :placeholder="$t('search')" clearable density="compact" prepend-icon="mdi-magnify" hide-details single-line v-model="search"></v-text-field>
                <p v-if="props.select != undefined" class="mr-4">
                    {{ $t('project') }}: {{ props.select.title }}
                </p>
                <v-spacer></v-spacer>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="createParameter" :disabled="select == undefined">
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('create') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" color="success" @click="saveParameter" :disabled="select == undefined || !dirty">
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
                        <v-btn icon v-bind="props" @click="exportPara">
                            <v-icon>mdi-export</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('export') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="selectall(true)">
                            <v-icon>mdi-check-bold</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('selectall') }}
                </v-tooltip>    
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="selectall(false)">
                            <v-icon>mdi-check-outline</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('unselectall') }}
                </v-tooltip>    
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="cloneSelect" :disabled="!hasSelect || select == undefined">
                            <v-icon>mdi-content-paste</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('clone') }}
                </v-tooltip>         
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon color='error' v-bind="props" @click="deleteSelect" :disabled="!hasSelect || select == undefined">
                            <v-icon>mdi-delete</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('delete') }}
                </v-tooltip> 
            </v-toolbar>
        </div>
        <v-toolbar>
            <v-checkbox class="pl-3" :label="$t('filter.show-hidden')" v-model="filter.showhidden" hide-details></v-checkbox>
            <v-checkbox class="pl-3" :label="$t('filter.show-runtime')" v-model="filter.showruntime" hide-details></v-checkbox>
            <v-select class="pl-3" density="compact" :label="$t('filter.type')" v-model="filter.type" :items="options" item-text="text" hide-details max-width="300px"></v-select>
            <v-spacer></v-spacer>
            <v-checkbox class="pr-5" :label="$t('filter.canwrite')" v-model="buffer.canWrite" @input="setdirty" hide-details></v-checkbox>
        </v-toolbar>
        <div class="py-3 px-5 text-left">
            <v-data-table :headers="fields" :items="items_final" show-select v-model="selection" item-value="name" :style="{ 'fontSize': props.preference.font + 'px' }">
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
                </template>
                <template v-slot:item.value="{ item }">
                    <v-checkbox density="compact" hide-details v-if="item.type == 0" v-model="item.value" @input="setdirty"></v-checkbox>
                    <v-text-field density="compact" hide-details v-if="item.type == 1" type="number" v-model="item.value" @input="setdirty"></v-text-field>
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
        <v-dialog width="500" v-model="createModal" class="text-white">
            <v-card>
                <v-card-title v-if="!editMode">
                    <v-icon>mdi-hammer</v-icon>
                    {{ $t('modal.new-parameter') }}
                </v-card-title>
                <v-card-title v-else>
                    <v-icon>mdi-pencil</v-icon>
                    {{ $t('modal.edit-parameter') }}
                </v-card-title>
                <v-card-text>
                    <v-text-field :error="titleError" v-model="createData.name" required :label="$t('modal.enter-parameter-name')" hide-details></v-text-field>
                    <v-select class="mt-3" v-model="createData.type" :items="options" :label="$t('modal.parameter-datatype')" hide-details></v-select>
                    <v-checkbox :label="$t('filter.show-hidden')" v-model="createData.hidden" hide-details></v-checkbox>
                    <v-checkbox :label="$t('filter.show-runtime')" v-model="createData.runtimeOnly" hide-details></v-checkbox>
                    <p v-if="errorMessage.length > 0" class="mt-3 text-red">{{ errorMessage }}</p>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" color="primary" v-if="!editMode" @click="confirmCreate">{{ $t('create') }}</v-btn>
                    <v-btn class="mt-3" color="primary" v-else @click="confirmEdit">{{ $t('modify') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
    </div>
</template>

<style scoped>

</style>
