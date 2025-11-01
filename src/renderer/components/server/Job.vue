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
} from '../../interface';
import { i18n } from './../../plugins/i18n';
import { BackendProxy } from '../../proxy'
import { DATA, EmitType, PROPS, Util_Job, ViewTreeNode } from './Job'
//#endregion

//#region Views
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
    ck: 0,
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
})
//#endregion

//#region Watch
watch(() => props.select, () => {
    data.value.buffer = props.select == undefined ? undefined : JSON.parse(JSON.stringify(props.select))
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

const deleteSelect = () => {
    data.value.deleteData = items.value!.filter(x => x.s == true).map(x => x.uuid)
    data.value.deleteModal = true
}

const deleteConfirm = () => {
    data.value.deleteModal = false
    //data.value.items = items.value@.filter(x => !data.value.deleteData.includes(x.uuid))
    data.value.dirty = true
}

const confirmCreate = () => {
    data.value.createModal = false
    emits('added', 
        [{ 
            uuid: uuidv6(),
            category: data.value.createData.category,
            type: data.value.createData.type,
            script: "",
            string_args: [],
            number_args: [0],
            boolean_args: [],
            id_args: [],
        }]
    )
    nextTick(() => {
        data.value.dirty = true
    })
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
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="util.pcreateProperty()" :disabled="select == undefined">
                            <v-icon>mdi-book-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('create-property') }}
                </v-tooltip>  
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" :disabled="!hasSelect || select == undefined">
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
                :database="props.database">
            </JobDialog>
            <DeleteDialog v-model="data.deleteModal"
                :title="$t('modal.delete-job')"
                :text="$t('modal.delete-job-confirm')"
                :data="data.deleteData"
                @cancel="data.deleteModal = false"
                @delete="deleteConfirm"/>
        </template>
        <div class="text-left px-6">
            <v-btn class="mx-1" variant="outlined" color="primary" @click="data.page = 0" :disabled="data.page == 0">{{ $t(logic != undefined ? 'logic' : 'job') }}</v-btn>
            <v-btn class="mx-1" variant="outlined" color="primary" @click="data.page = 1" :disabled="data.page == 1">{{ $t('property') }}</v-btn>

            <v-btn class="mx-1" variant="outlined" color="success" v-if="logic == undefined && props.select != undefined">{{ $t('use_logic') }}</v-btn>
            <v-btn class="mx-1" variant="outlined" color="error" v-if="logic != undefined && props.select != undefined">{{ $t('remove_logic') }}</v-btn>
        </div>
        <!-- Job List -->
        <template v-if="data.page == 0">
            <h2 class="text-info"> {{ $t(logic != undefined ? 'logic' : 'job')}} </h2>
            <v-sheet class="mx-6 text-left">
                <v-btn prepend-icon="mdi-plus" v-bind="props" @click="createJob(JobCategory.Execution)" :disabled="select == undefined">{{ $t('create') }}</v-btn>
            </v-sheet>
            <v-treeview class="mx-6" v-model="data.selection" :items="treeData" item-value="id" :activatable="false" open-all @update:selected="e => console.log(e)">
                <template v-slot:append="{ item, depth, isFirst, isLast }">
                    <v-btn variant="text" prepend-icon="mdi-pencil" :disabled="item.id.length == 0" @click="">{{ $t('edit') }}</v-btn>
                    <v-btn variant="text" prepend-icon="mdi-delete" color="error" @click="">{{ $t('delete') }}</v-btn>
                </template>
                <template v-slot:prepend="{ item, depth, isFirst, isLast }">
                    <span v-if="item.id.length > 0">{{ item.id.slice(item.id.length - 12, item.id.length) }}</span>
                </template>
            </v-treeview>
        </template>
        <!-- Property -->
        <template v-if="data.page == 1">
            <h2 class="text-info"> {{ $t('property') }} </h2>
            <div v-if="select != undefined" class="py-3 pb-5 mx-5">
                <br />
                <v-row>
                    <v-col>
                        <v-text-field v-model.number="data.ck" label="ck" hide-details :min="0" type="number"></v-text-field>
                    </v-col>
                </v-row>
                <v-row v-for="(c, i) in properties" :key="i">
                    <v-col cols="2" class="my-0 py-0">
                        <v-text-field :error="expressionNameCheck(c.name)" hide-detail v-model="c.name" :label="$t('expression.title')" @input="setdirty"></v-text-field>
                    </v-col>
                    <v-col cols="6" class="my-0 py-0">
                        <v-text-field hide-detail v-model="c.expression" :label="$t('expression.value')" @input="setdirty"></v-text-field>
                    </v-col>
                    <v-col cols="2" class="my-0 py-0">
                        <v-text-field type="number" :rules="[rules.required, rules.deep]" :min="1" hide-detail v-model.number="c.deep" :label="$t('expression.deep')" @input="setdirty"></v-text-field>
                    </v-col>
                    <v-col cols="2" class="my-0 py-0">
                        <v-row>
                            <v-col cols="4">
                                <v-btn flat icon @click="util.pmoveUp(i)" :disabled="util.pisFirst(i)">
                                    <v-icon>mdi-arrow-up</v-icon>
                                </v-btn>
                            </v-col>
                            <v-col cols="4">
                                <v-btn flat icon @click="util.pmoveDown(i)" :disabled="util.pisLast(i)">
                                    <v-icon>mdi-arrow-down</v-icon>
                                </v-btn>
                            </v-col>
                            <v-col cols="4">
                                <v-btn flat icon @click="util.pdelete(c.name)">
                                    <v-icon>mdi-delete</v-icon>
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-col>
                </v-row>
            </div>
        </template>
    </ContextFrame>
</template>

<style scoped>
.hint {
    opacity: 60%;
    text-align: left;
    margin-top: 10px;
}
</style>
