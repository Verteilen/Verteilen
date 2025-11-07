<script setup lang="ts">
//#region Modules
import { Emitter } from 'mitt';
import { v6 as uuidv6 } from 'uuid';
import { computed, inject, nextTick, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { 
    BusType, 
    ConditionResult, 
    JobCategory, 
    JobCategoryText, 
    JobResultText, 
    JobType, 
    JobType2, 
    JobType2Text, 
    JobTypeText, 
    Preference,  
    Rename,
    TaskLogicUnit,
    CreateDefaultJob,
    Job,
    JobTable, 
} from '../../interface';
import { i18n } from './../../plugins/i18n';
import { BackendProxy } from '../../proxy'
import { DATA, EmitType, PROPS, Util_Job, ViewTreeNode } from './Job'
//#endregion

//#region Views
import { VueDraggableNext } from 'vue-draggable-next'
import ContextFrame from '../components/layout/ContextFrame.vue'
import DeleteDialog from '../dialog/DeleteDialog.vue'
import JobDialog from '../dialog/job/JobDialog.vue';
//#endregion

//#region Data
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const backend:Ref<BackendProxy> = inject("backend")!
const preference:Ref<Preference> = inject("preference")!
const props = defineProps<PROPS>()
const emits = defineEmits<EmitType>()
const data:Ref<DATA> = ref({
    page: 0,
    createModal: false,
    createType: 0,
    createData: CreateDefaultJob(),
    editMode: false,
    deleteModal: false,
    deleteData: [],
    selection: [],
    buffer: undefined,
    types: [],
    types2: [],
    result: [],
    categorise: [],
    dirty: false,
    pfields: [],
})
//#endregion

//#region Watch
watch(() => props.select, () => {
    make_instance()
})
//#endregion

//#region  Computed
const items = computed(() => props.jobs)
const logic = computed(() => data.value.buffer?.logic)
const hasSelect = computed(() => items.value.filter(x => x.s).length > 0)
const properties = computed(() => props.select?.properties ?? [])
const treeData = computed(() => {
    if(logic.value == undefined) {
        return items.value.map(x => convert2(x.uuid))
    }
    return logic.value.group.map(x => {
        return convert(x)
    })
})
const util = new Util_Job(data, emits, properties)
//#endregion

const make_instance = () => {
    data.value.buffer = props.select == undefined ? undefined : JSON.parse(JSON.stringify(props.select))
}
const convert = (unit:TaskLogicUnit):ViewTreeNode => {
    return {
        id: unit.job_uuid ?? "",
        title: `${unit.type}`,
        children: unit.children.map(x => convert(x))
    }
}
const convert2 = (uuid:string):ViewTreeNode => {
    return {
        id: uuid,
        title: items.value?.find(x => x.uuid == uuid)?.title ?? ""
    }
}
const rules = {
    required: (value:any) => !!value || 'Required.',
    deep: (value:any) => (typeof value == 'number' && value >= 1) || 'Number must bigger than 0'
}

const setdirty = () => {
    data.value.dirty = true
}

const logic_modify = (add:boolean) => {

}

const expressionNameCheck = (x:string) => {
    return x.length == 0 || x == null || properties.value!.filter(y => x == y.name).length >= 2
}

const JobCategoryTranslate = (t:number):string => {
    return i18n.global.t(JobCategoryText[t])
}
const JobTypeTranslate = (t:number):string => {
    return i18n.global.t(JobTypeText[t])
}
const JobType2Translate = (t:number):string => {
    return i18n.global.t(JobType2Text[t])
}
const JobResultTranslate = (t:number):string => {
    return i18n.global.t(JobResultText[t])
}

const createJob = (type:JobCategory) => {
    data.value.createData = CreateDefaultJob()
    data.value.createType = type
    data.value.createModal = true
    data.value.editMode = false
}
const editJob = (id:string) => {
    const f = props.jobs.find(x => x.uuid == id)
    if(f == undefined) return
    data.value.createData = JSON.parse(JSON.stringify(f))
    data.value.createType = f.category
    data.value.createModal = true
    data.value.editMode = true
}

const deleteSelect = () => {
    data.value.deleteData = items.value!.filter(x => x.s == true).map(x => x.uuid)
    data.value.deleteModal = true
}

const deleteConfirm = () => {
    data.value.deleteModal = false
    //data.value.items = items.value@.filter(x => !data.value.deleteData.includes(x.uuid))
    data.value.dirty = true
}

const dialogConfirm = (job:JobTable) => {

}

const libRename = (d:Rename) => {
    items.value.forEach(z => {
        if((z.category == JobCategory.Condition && z.type == JobType2.JAVASCRIPT) || (z.category == JobCategory.Execution && z.type == JobType.JAVASCRIPT)){
            const index = z.string_args.findIndex(x => x == d.oldname)
            if(index != -1) z.string_args[index] = d.newname
        }
    })
}

const libDelete = (name:string) => {
    items.value.forEach(z => {
        if((z.category == JobCategory.Condition && z.type == JobType2.JAVASCRIPT) || (z.category == JobCategory.Execution && z.type == JobType.JAVASCRIPT)){
            const index = z.string_args.findIndex(x => x == name)
            if(index != -1) z.string_args.splice(index, 1)
        }
    })
}

const selectall = (s:boolean) => {
    items.value.forEach(x => x.s = s)
}

const updateLocate = () => {
    data.value.categorise = Object.keys(JobCategory).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            text: JobCategoryTranslate(index as JobCategory),
            value: index
        }
    })
    data.value.types = Object.keys(JobType).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            text: JobTypeTranslate(index as JobType),
            value: index
        }
    })
    data.value.types2 = Object.keys(JobType2).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            text: JobType2Translate(index as JobType2),
            value: index
        }
    })
    data.value.result = Object.keys(ConditionResult).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            text: JobResultTranslate(index as ConditionResult),
            value: index
        }
    })
    data.value.pfields = [
        { title: $t('expression.title'), align: 'center', key: 'name', maxWidth: '100px', sortable: false },
        { title: $t('expression.value'), align: 'center', key: 'expression', sortable: false },
        { title: $t('expression.deep'), align: 'center', key: 'deep', maxWidth: '50px', sortable: false },
        { title: $t('headers.detail'), align: 'center', key: 'detail', maxWidth: "50px", sortable: false },
    ]
}

const get_title = (uuid:string) => {
    return props.jobs.find(x => x.uuid == uuid)?.title ?? 0
}
const get_category = (uuid:string) => {
    return props.jobs.find(x => x.uuid == uuid)?.category ?? 0
}
const get_type = (uuid:string) => {
    return props.jobs.find(x => x.uuid == uuid)?.type ?? 0
}

const goreturn = () => {
    emits('return')
}

const onHotkey = (value:string) => {
    if(value == 'create_job'){
        createJob(JobCategory.Execution)
    }
    else if(value == 'job_save'){
        
    }
}

onMounted(() => {
    updateLocate()
    make_instance()
    emitter.on('hotkey', onHotkey)
    emitter.on('updateLocate', updateLocate)
    emitter.on('renameScript', libRename)
    emitter.on('deleteScript', libDelete)
})

onUnmounted(() => {
    emitter.off('hotkey', onHotkey)
    emitter.off('updateLocate', updateLocate)
    emitter.off('renameScript', libRename)
    emitter.off('deleteScript', libDelete)
})
</script>

<template>
    <ContextFrame>
        <template #toolbar>
            <v-toolbar density="compact" class="px-3">
                <v-btn size="sm" class="mr-2" variant="text" icon="mdi-chevron-left" @click="goreturn"></v-btn>
                <p v-if="props.select != undefined" class="mr-4">
                    {{ $t('task') }}: {{ props.select.title }}
                </p>
                <v-spacer></v-spacer>
                <v-btn prepend-icon="mdi-content-paste" :disabled="!hasSelect || select == undefined">
                    {{ $t('clone') }}
                </v-btn>
                <v-btn prepend-icon="mdi-content-save" color='success' @click="util.save()" :disabled="!hasSelect || select == undefined || !data.dirty">
                    {{ $t('save') }}
                </v-btn>
                <v-btn prepend-icon="mdi-delete" color='error' @click="deleteSelect" :disabled="!hasSelect || select == undefined">
                    {{ $t('delete') }}
                </v-btn>
            </v-toolbar>
        </template>
        <template #dialog>
            <JobDialog v-model="data.createModal" 
                :jobtype="data.createType"
                :types="data.types"
                :types2="data.types2"
                :edit="data.editMode"
                :select="data.createData"
                :result="data.result"
                :task="props.select"
                :libs="props.libs"
                :database="props.database"
                @confirm="dialogConfirm">
            </JobDialog>
            <DeleteDialog v-model="data.deleteModal"
                :title="$t('modal.delete-job')"
                :text="$t('modal.delete-job-confirm')"
                :data="data.deleteData"
                @cancel="data.deleteModal = false"
                @delete="deleteConfirm"/>
        </template>
        <div class="px-6">
            <div class="text-left">
                <v-btn class="mx-1" variant="outlined" color="primary" @click="data.page = 0" :disabled="data.page == 0">{{ $t(logic != undefined ? 'logic' : 'job') }}</v-btn>
                <v-btn class="mx-1" variant="outlined" color="primary" @click="data.page = 1" :disabled="data.page == 1">{{ $t('property') }}</v-btn>

                <v-btn class="mx-1" variant="outlined" color="success" @click="logic_modify(true)" v-if="logic == undefined && props.select != undefined">{{ $t('use_logic') }}</v-btn>
                <v-btn class="mx-1" variant="outlined" color="error" @click="logic_modify(false)" v-if="logic != undefined && props.select != undefined">{{ $t('remove_logic') }}</v-btn>
            </div>
            <!-- Job List -->
            <template v-if="data.page == 0">
                <h2 class="text-info"> {{ $t(logic != undefined ? 'logic' : 'job')}} </h2>
                <v-sheet class="text-left">
                    <v-btn prepend-icon="mdi-plus" v-bind="props" @click="createJob(JobCategory.Execution)" :disabled="select == undefined">{{ $t('create') }}</v-btn>
                </v-sheet>
                <v-treeview v-model="data.selection" item-value="id">
                    <VueDraggableNext :list="treeData"
                        :move="util.move"
                        @end="util.end">
                        <v-treeview-item v-for="(item, i) in treeData" :key="i" :value="item.id" @click="nextTick(() => { data.selection = [] })">
                            <template v-slot:append>
                                <v-btn variant="text" prepend-icon="mdi-pencil" :disabled="item.id.length == 0" @click="editJob(item.id)">{{ $t('edit') }}</v-btn>
                                <v-btn variant="text" prepend-icon="mdi-delete" color="error" @click="">{{ $t('delete') }}</v-btn>
                            </template>
                            <template v-slot:prepend>
                                <span class="mx-1" v-if="item.id.length > 0">{{ item.id.slice(item.id.length - 12, item.id.length) }}</span>
                                <span class="mx-1" v-if="item.id.length > 0">{{ get_title(item.id) }}</span>
                                <span class="mx-1" v-if="item.id.length > 0">{{ data.categorise[get_category(item.id)]?.text }}</span>
                                <span class="mx-1" v-if="item.id.length > 0 && get_category(item.id) == 1">{{ data.types[get_type(item.id)]?.text }}</span>
                                <span class="mx-1" v-if="item.id.length > 0 && get_category(item.id) == 0">{{ data.types2[get_type(item.id)]?.text }}</span>
                            </template>
                        </v-treeview-item>
                    </VueDraggableNext>
                </v-treeview>
            </template>
            <!-- Property -->
            <template v-if="data.page == 1">
                <h2 class="text-info"> {{ $t('property') }} </h2>
                <v-sheet class="text-left">
                    <v-btn prepend-icon="mdi-plus" v-bind="props" @click="util.pcreateProperty()" :disabled="select == undefined">{{ $t('create') }}</v-btn>
                </v-sheet>
                <div v-if="data.buffer != undefined" class="py-3 pb-5 mx-5">
                    <v-data-table v-model="data.selection"
                        style="background: transparent" 
                        :style="{ 'fontSize': preference.font + 'px' }"
                        :headers="data.pfields"
                        item-value="name"
                        hide-default-footer
                        :items="data.buffer.properties" 
                    >
                        <template #body="props"></template>
                        <template #tbody="props">
                            <VueDraggableNext :list="data.buffer.properties" 
                                tag="tbody"
                                :move="util.pmove"
                                @end="util.pend"
                            >
                                <v-data-table-row v-for="(item, index) in props.internalItems"
                                    :key="index"
                                    :item="item"
                                    :index="index"
                                    :cell-props="props"
                                >
                                    <template v-slot:item.name="{ item }">
                                        <v-text-field v-model="item.name" hide-details density="compact" :error="expressionNameCheck(item.name)" @input="setdirty"></v-text-field>
                                    </template>
                                    <template v-slot:item.expression="{ item }">
                                        <v-text-field v-model="item.expression" hide-details density="compact" @input="setdirty"></v-text-field>
                                    </template>
                                    <template v-slot:item.deep="{ item }">
                                        <v-text-field v-model.number="item.deep" hide-details density="compact" type="number" :rules="[rules.required, rules.deep]" :min="1" @input="setdirty"></v-text-field>
                                    </template>
                                    <template v-slot:item.detail="{ item }">
                                        <v-btn variant="outlined" prepend-icon="mdi-delete" color="error" @click="util.pdelete(item.name)">
                                            {{ $t('delete') }}
                                        </v-btn>
                                    </template>
                                </v-data-table-row>
                            </VueDraggableNext>
                        </template>
                    </v-data-table>
                </div>
            </template>
        </div>
    </ContextFrame>
</template>

<style scoped lang="scss">
.v-treeview-node__root.v-treeview-node--active {
    pointer-events: none;
}

.v-treeview-node__toggle {
    pointer-events: all;
}
</style>