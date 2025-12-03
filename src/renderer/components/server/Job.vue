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
    JobTable,
    TaskLogicType, 
} from 'verteilen-core/dist/interface';
import { i18n } from './../../plugins/i18n';
import { BackendProxy } from '../../proxy'
import { DATA, EmitType, PROPS, Util_Job, ViewTreeNode } from './Job'
//#endregion

//#region Views
import { VueDraggableNext } from 'vue-draggable-next'
import ContextFrame from '../components/layout/ContextFrame.vue'
import DeleteDialog from '../dialog/DeleteDialog.vue'
import JobDialog from '../dialog/job/JobDialog.vue';
import ConditionDialog from '../dialog/job/ConditionDialog.vue';
import NestTree from '../components/layout/NestTree.vue';
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
    conditionModal: false,
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
    errorMessage: "",
    titleError: false,
    dragging: false,
    logicBuffer: []
})
//#endregion

//#region Watch
watch(() => props.select, () => {
    console.log("task selected update")
    make_instance()
})
//#endregion

//#region  Computed
const items = computed(() => props.jobs)
const logic = computed(() => data.value.buffer?.logic)
const hasSelect = computed(() => items.value.filter(x => x.s).length > 0)
const properties = computed(() => props.select?.properties ?? [])
const treeData = computed<Array<ViewTreeNode>>(() => {
    if(logic.value == undefined) { // No Logic
        return items.value.map(x => convert2(x.uuid))
    }
    // Logic
    return logic.value.group.map(x => convert(x))
})
const util = new Util_Job(data, emits, properties)
//#endregion

const make_instance = () => {
    data.value.buffer = props.select == undefined ? undefined : JSON.parse(JSON.stringify(props.select))
    data.value.logicBuffer = props.select == undefined ? [] : treeData.value
}
const convert = (unit:TaskLogicUnit):ViewTreeNode => {
    return {
        id: unit.uuid,
        job_uuid: unit.job_uuid ?? "",
        type: unit.type,
        title: `${unit.type}`,
        disabled: util.conditionTypeDragEnable(unit.type),
        children: unit.children.map(x => convert(x))
    }
}
const convert2 = (uuid:string):ViewTreeNode => {
    return {
        id: uuidv6(),
        job_uuid: uuid,
        type: TaskLogicType.SINGLE,
        title: items.value?.find(x => x.uuid == uuid)?.title ?? ""
    }
}
const rules = {
    required: (value:string) => (value.toString().length > 0) || 'Required.',
    nospace: (value:string) => new RegExp(/\s+/g).exec(value) == null || 'No Space !!',
    deep: (value:string) => (typeof value == 'number' && value >= 1) || 'Number must bigger than 0'
}

const logic_modify = () => {
    if(data.value.buffer == undefined) return
    if(data.value.buffer.logic != undefined){
        delete data.value.buffer.logic
    }else{
        const g = data.value.buffer.jobs_uuid.map((x):TaskLogicUnit => {
            return {
                uuid: uuidv6(),
                type: TaskLogicType.SINGLE,
                job_uuid: x,
                children: []
            }
        })
        data.value.buffer.logic = {
            group: g
        }
    }
    util.save()
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
const createCondition = () => {
    data.value.conditionModal = true
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
const deleteJob = (id:string) => {
    data.value.deleteModal = true
    data.value.deleteData = [id]
}

const deleteConfirm = () => {
    data.value.deleteModal = false
    //data.value.items = items.value@.filter(x => !data.value.deleteData.includes(x.uuid))
    data.value.dirty = true
}

const dialogCreateConfirm = (job:JobTable) => {
    const r = util.jobCreate(job)
    if(r == undefined) return
    data.value.createModal = false
    emits('added', JSON.parse(JSON.stringify(r)))
}

const dialogModifyConfirm = (job:JobTable) => {
    data.value.createModal = false
    emits('save', JSON.parse(JSON.stringify(job)))
}

const dialogConfirm = (job:JobTable) => {
    if(!data.value.editMode) dialogCreateConfirm(job)
    else dialogModifyConfirm(job)
}

const dialogConfirmCondition = (index:number) => {
    if(data.value.buffer?.logic == undefined) return
    const c = util.createConditionNode(index as TaskLogicType)
    if(c == undefined) return
    data.value.conditionModal = false
    data.value.logicBuffer.push(convert(c))
    util.save()
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
                :error-message="data.errorMessage"
                :title-error="data.titleError"
                @confirm="dialogConfirm">
            </JobDialog>
            <ConditionDialog v-model="data.conditionModal" @confirm="dialogConfirmCondition" />
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

                <v-btn class="mx-1" variant="outlined" color="success" @click="logic_modify()" v-if="logic == undefined && props.select != undefined">{{ $t('use_logic') }}</v-btn>
                <v-btn class="mx-1" variant="outlined" color="error" @click="logic_modify()" v-if="logic != undefined && props.select != undefined">{{ $t('remove_logic') }}</v-btn>
            </div>
            <!-- Job List -->
            <template v-if="data.page == 0">
                <h2 class="text-info"> {{ $t(logic != undefined ? 'logic' : 'job')}} </h2>
                <v-sheet class="text-left">
                    <v-btn prepend-icon="mdi-plus" v-bind="props" @click="createJob(JobCategory.Execution)" :disabled="select == undefined">{{ $t('create') }}</v-btn>
                    <v-btn v-if="data.buffer?.logic != undefined" prepend-icon="mdi-tag-plus" v-bind="props" @click="createCondition()" :disabled="select == undefined">{{ $t('create') }}</v-btn>
                    <v-btn prepend-icon="mdi-content-save" variant="text" color='success' @click="util.save()" :disabled="select == undefined || !data.dirty">
                        {{ $t('save') }}
                    </v-btn>
                </v-sheet>
                <div class="pt-5">
                    <NestTree
                        :items="data.logicBuffer" 
                        :jobs="props.jobs" 
                        :types="data.types"
                        :types2="data.types2"
                        :categorise="data.categorise"
                        @clean-selection="nextTick(() => { data.selection = [] })"
                        @changed="util.dirty()"
                        @edit="id => editJob(id)"
                        @delete="id => deleteJob(id)">
                    </NestTree>
                </div>
            </template>
            <!-- Property -->
            <template v-if="data.page == 1">
                <h2 class="text-info"> {{ $t('property') }} </h2>
                <v-sheet class="text-left">
                    <v-btn prepend-icon="mdi-plus" v-bind="props" @click="util.pcreateProperty()" :disabled="select == undefined">{{ $t('create') }}</v-btn>
                    <v-btn prepend-icon="mdi-content-save" variant="text" color='success' @click="util.save()" :disabled="select == undefined || !data.dirty">
                        {{ $t('save') }}
                    </v-btn>
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
                                        <v-text-field v-model="item.name" hide-details="auto" density="compact" :rules="[rules.nospace]" :error="expressionNameCheck(item.name)" @input="util.dirty()"></v-text-field>
                                    </template>
                                    <template v-slot:item.expression="{ item }">
                                        <v-text-field v-model="item.expression" hide-details="auto" density="compact" @input="util.dirty()"></v-text-field>
                                    </template>
                                    <template v-slot:item.deep="{ item }">
                                        <v-text-field v-model.number="item.deep" hide-details="auto" density="compact" type="number" :rules="[rules.required, rules.deep]" :min="1" @input="util.dirty()"></v-text-field>
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