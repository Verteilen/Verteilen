<script setup lang="ts">
//#region Modules
import { Emitter } from 'mitt';
import { v6 as uuidv6 } from 'uuid';
import { computed, inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { 
    Execute_PART, 
    BusType, 
    ConditionResult, 
    Job, 
    JobCategory, 
    JobCategoryText, 
    JobResultText, 
    JobType, 
    JobType2, 
    JobType2Text, 
    JobTypeText, 
    Preference,  
    Property, 
    Rename, 
    ProjectTable,
    TaskTable,
    DatabaseTable,
    Library,
    JobTable} from '../../interface';
import { i18n } from './../../plugins/i18n';
import DialogBase from '../dialog/DialogBase.vue';
import { BackendProxy } from '../../proxy';
//#endregion

//#region Views
import ContextFrame from '../components/layout/ContextFrame.vue';
import { DATA, EmitType, PROPS, Util_Job } from './Job';
import DeleteDialog from '../dialog/DeleteDialog.vue';
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
    createModal: false,
    createData: {category: 0, type: 0, spe_template: 0},
    deleteModal: false,
    deleteData: [],
    items: [],
    items2: [],
    types: [],
    types2: [],
    result: [],
    categorise: [],
    dirty: false,
})
//#endregion

//#region  Computed
const hasSelect = computed(() => data.value.items.filter(x => x.s).length > 0)
const util = new Util_Job(data, emits)
//#endregion


const replaceString = (job:Job, index:number):string => {
    if(props.select == undefined) return ""
    const copyJob:Job = JSON.parse(JSON.stringify(job))
    if(index >= copyJob.string_args.length || index < 0) return ""
    if(props.database == undefined) return copyJob.string_args[index]
    Execute_PART.ExecuteManager_Base.string_args_transform(props.select, copyJob, (str) => console.log(str), props.database, data.value.ck)
    return copyJob.string_args[index]
}
const rules = {
    required: (value:any) => !!value || 'Required.',
    deep: (value:any) => (typeof value == 'number' && value >= 1) || 'Number must bigger than 0'
}

const setdirty = () => {
    data.value.dirty = true
}

const updateJob = () => {
    const old:Array<JobTable> = JSON.parse(JSON.stringify(data.value.items))
    data.value.items = JSON.parse(JSON.stringify(props.select?.jobs ?? []))
    const ids = old.filter(x => x.s).map(x => x.uuid)
    data.value.items.filter(x => ids.includes(x.uuid)).forEach(x => x.s = true)
    data.value.items.forEach(x => x.s = false)
    data.value.items2 = JSON.parse(JSON.stringify(props.select?.properties ?? []))
    data.value.dirty = false
}

const checkPatterm = (category:number, type:number, checker:string):boolean => {
    const e = category == JobCategory.Execution && ( 
        (checker == 'TwoPath' && ( type === JobType.COPY_DIR || type === JobType.COPY_FILE || type === JobType.RENAME )) ||
        (checker == 'OnePath' && ( type === JobType.DELETE_DIR || type === JobType.DELETE_FILE || type === JobType.CREATE_DIR )) ||
        (checker == 'Command' && ( type === JobType.COMMAND )) ||
        (checker == 'Lib_Command' && ( type === JobType.LIB_COMMAND)) ||
        (checker == 'Writer' && ( type === JobType.CREATE_FILE )) ||
        (checker == 'Javascript' && (type == JobType.JAVASCRIPT))
    );
    const e2 = category == JobCategory.Condition && (
        (checker == 'Javascript_n' && (type == JobType2.JAVASCRIPT)) ||
        (checker == 'OnePath_n' && (type == JobType2.CHECK_PATH))
    )
    return e || e2
}

const expressionNameCheck = (x:string) => {
    return x.length == 0 || x == null || data.value.items2.filter(y => x == y.name).length >= 2
}

const upProperty = (index: number) => {
    setdirty()
    const buffer = data.value.items2[index]
    data.value.items2[index] = data.value.items2[index - 1]
    data.value.items2[index - 1] = buffer
}

const downProperty = (index: number) => {
    setdirty()
    const buffer = data.value.items2[index]
    data.value.items2[index] = data.value.items2[index + 1]
    data.value.items2[index + 1] = buffer
}

const deleteProperty = (name:string) => {
    setdirty()
    const index = data.value.items2.findIndex(x => x.name == name)
    data.value.items2.splice(index, 1)
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

const createJob = () => {
    data.value.createData = {category: 0, type: 0, spe_template: 0};
    data.value.createModal = true
}

const createProperty = () => {
    data.value.items2.push({name: "default", expression: "1 + 1", deep: 1})
    setdirty()
}

const saveJobs = () => {
    emits('edit', data.value.items, data.value.items2)
    data.value.dirty = false
}

const cloneSelect = () => {
    const buffer:JobTable[] = JSON.parse(JSON.stringify(data.value.items.filter(x => x.s != undefined && x.s === true)))
    buffer.forEach(x => x.uuid = uuidv6())
    data.value.items.push(...buffer)
}

const deleteSelect = () => {
    data.value.deleteData = data.value.items.filter(x => x.s == true).map(x => x.uuid)
    data.value.deleteModal = true
}

const deleteConfirm = () => {
    data.value.deleteModal = false
    data.value.items = data.value.items.filter(x => !data.value.deleteData.includes(x.uuid))
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
        updateJob();
        data.value.dirty = true
    })
}

const scriptExist = (name:string) => {
    return props.libs!.findIndex(x => x.name == name) != -1
}

const libRename = (d:Rename) => {
    data.value.items.forEach(z => {
        if((z.category == JobCategory.Condition && z.type == JobType2.JAVASCRIPT) || (z.category == JobCategory.Execution && z.type == JobType.JAVASCRIPT)){
            const index = z.string_args.findIndex(x => x == d.oldname)
            if(index != -1) z.string_args[index] = d.newname
        }
    })
}

const libDelete = (name:string) => {
    data.value.items.forEach(z => {
        if((z.category == JobCategory.Condition && z.type == JobType2.JAVASCRIPT) || (z.category == JobCategory.Execution && z.type == JobType.JAVASCRIPT)){
            const index = z.string_args.findIndex(x => x == name)
            if(index != -1) z.string_args.splice(index, 1)
        }
    })
}

const selectall = (s:boolean) => {
    data.value.items.forEach(x => x.s = s)
}

const moveup = (uuid:string) => {
    data.value.dirty = true
    const index = data.value.items.findIndex(x => x.uuid == uuid)
    const buffer = data.value.items[index - 1]
    data.value.items[index - 1] = data.value.items[index]
    data.value.items[index] = buffer
}

const movedown = (uuid:string) => {
    data.value.dirty = true
    const index = data.value.items.findIndex(x => x.uuid == uuid)
    const buffer = data.value.items[index + 1]
    data.value.items[index + 1] = data.value.items[index]
    data.value.items[index] = buffer
}

const isFirst = (uuid:string) => {
    const index = data.value.items.findIndex(x => x.uuid == uuid)
    return index <= 0
}

const isLast = (uuid:string) => {
    const index = data.value.items.findIndex(x => x.uuid == uuid)
    if(index == -1) return true
    return index == data.value.items.length - 1
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
        createJob()
    }
    else if(value == 'job_save'){
        saveJobs()
    }
}

onMounted(() => {
    updateLocate()
    updateJob()
    emitter.on('hotkey', onHotkey)
    emitter.on('updateJob', updateJob)
    emitter.on('updateLocate', updateLocate)
    emitter.on('renameScript', libRename)
    emitter.on('deleteScript', libDelete)
})

onUnmounted(() => {
    emitter.off('hotkey', onHotkey)
    emitter.off('updateJob', updateJob)
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
                        <v-btn icon v-bind="props" @click="createJob" :disabled="select == undefined">
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('create') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="createProperty" :disabled="select == undefined">
                            <v-icon>mdi-book-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('create-property') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" color="success" @click="saveJobs" :disabled="select == undefined || !data.dirty">
                            <v-icon>mdi-content-save</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('save') }}
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
        </template>
        <template #dialog>
            <DialogBase width="500" v-model="data.createModal" class="text-white" :preference="preference">
                <template #title>
                    <v-icon>mdi-hammer</v-icon>
                    {{ $t('modal.new-job') }}
                </template>
                <template #text>
                    <v-select class="mb-1" hide-details v-model="data.createData.category" :autofocus="true" :items="data.categorise" item-title="text" item-value="value"></v-select>
                    <v-select class="mb-1" hide-details v-if="data.createData.category == 0" v-model="data.createData.type" :items="data.types2" item-title="text" item-value="value"></v-select>
                    <v-select class="mb-1" hide-details v-if="data.createData.category == 1" v-model="data.createData.type" :items="data.types" item-title="text" item-value="value"></v-select>
                </template>
                <template #action>
                    <v-btn class="mt-3" color="primary" @click="confirmCreate">{{ $t('create') }}</v-btn>
                </template>
            </DialogBase>
            <DeleteDialog v-model="data.deleteModal"
                :title="$t('modal.delete-job')"
                :text="$t('modal.delete-job-confirm')"
                :data="data.deleteData"
                @cancel="data.deleteModal = false"
                @delete="deleteConfirm"/>
        </template>
        <!-- Property -->
        <h4 class="text-info"> {{ $t('property') }} </h4>
        <div v-if="select != undefined" class="py-3 pb-5 mx-5">
            <br />
            <v-row>
                <v-col>
                    <v-text-field v-model.number="data.ck" label="ck" hide-details :min="0" type="number"></v-text-field>
                </v-col>
            </v-row>
            <v-row v-for="(c, i) in data.items2" :key="i">
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
                            <v-btn flat icon @click="upProperty(i)" :disabled="i == 0">
                                <v-icon>mdi-arrow-up</v-icon>
                            </v-btn>
                        </v-col>
                        <v-col cols="4">
                            <v-btn flat icon @click="downProperty(i)" :disabled="i == data.items2.length - 1">
                                <v-icon>mdi-arrow-down</v-icon>
                            </v-btn>
                        </v-col>
                        <v-col cols="4">
                            <v-btn flat icon @click="deleteProperty(c.name)">
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-col>
            </v-row>
        </div>
        <!-- Job List -->
        <hr class="mx-5 my-2" />
        <h4 class="text-info"> {{ $t('job') }} </h4>
        <div v-if="select != undefined" class="py-3 pb-7">
            <br />
            <v-expansion-panels color="dark" class="px-6">
                <v-expansion-panel v-for="(c, i) in data.items" :key="i" class="my-2 pl-5">
                    <v-row>
                        <v-col cols="auto" class="mt-2">
                            <v-checkbox type="checkbox" v-model="c.s" hide-details width="25" density="compact"></v-checkbox>
                        </v-col>
                        <v-col cols="auto" class="mt-2">
                            <v-btn variant="text" size="small" icon :disabled="isFirst(c.uuid)" @click="moveup(c.uuid)">
                                <v-icon>mdi-arrow-up</v-icon>
                            </v-btn>
                            <v-btn variant="text" size="small" icon :disabled="isLast(c.uuid)" @click="movedown(c.uuid)" class="ml-2">
                                <v-icon>mdi-arrow-down</v-icon>
                            </v-btn>
                        </v-col>
                        <v-col cols="10">
                            <v-expansion-panel-title style="background: transparent">
                                <v-chip class="mr-1">{{ i }}. {{ c.category == 0 ? JobType2Translate(c.type) : JobTypeTranslate(c.type) }}</v-chip>
                                <v-chip>{{ c.uuid }}</v-chip>
                            </v-expansion-panel-title>
                        </v-col>
                    </v-row>
                    
                    <v-expansion-panel-text>
                        <v-card flat>
                            <v-card-text>
                                <div v-if="checkPatterm(c.category, c.type, 'Javascript_n')">
                                    <v-select v-model="c.number_args[0]" @update:model-value="setdirty" :items="data.result" item-title="text" :label="$t('jobpage.if-error')" hide-details></v-select>
                                    <codemirror-js v-model="c.script" 
                                        style="text-align:left;"
                                        :style="{ height: '40vh' }"
                                        @change="setdirty"/>
                                    <v-select @update:model-value="setdirty" clearable v-model="c.string_args" :items="props.libs" item-title="name" item-value="name" multiple label="Library">
                                        <template #selection="{ item }">
                                            <v-chip v-if="scriptExist(item.title)" color="primary">{{item.title}}</v-chip>
                                            <v-chip v-else closable color="danger">{{item.title}}</v-chip>
                                        </template>
                                    </v-select>
                                </div>
                                <div v-else-if="checkPatterm(c.category, c.type, 'OnePath_n')">
                                    <v-select v-model="c.number_args[0]" @update:model-value="setdirty" :items="data.result" item-title="text" :label="$t('jobpage.if-error')" hide-details></v-select>
                                    <p class="hint">{{ replaceString(c, 0) }}</p>
                                    <v-text-field class="my-2" v-model="c.string_args[0]" @input="setdirty" :label="$t('jobpage.path')" hide-details></v-text-field>
                                </div>
                                <!-- Execution -->
                                <div v-else-if="checkPatterm(c.category, c.type, 'TwoPath')">
                                    <p class="hint">{{ replaceString(c, 0) }}</p>
                                    <v-text-field class="my-2" v-model="c.string_args[0]" @input="setdirty" :label="$t('jobpage.from')" hide-details></v-text-field>
                                    <p class="hint">{{ replaceString(c, 1) }}</p>
                                    <v-text-field class="my-2" v-model="c.string_args[1]" @input="setdirty" :label="$t('jobpage.to')" hide-details></v-text-field>
                                </div>
                                <div v-else-if="checkPatterm(c.category, c.type, 'OnePath')">
                                    <p class="hint">{{ replaceString(c, 0) }}</p>
                                    <v-text-field class="my-2" v-model="c.string_args[0]" @input="setdirty" :label="$t('jobpage.path')" hide-details></v-text-field>
                                </div>
                                <div v-else-if="checkPatterm(c.category, c.type, 'Writer')">
                                    <p class="hint">{{ replaceString(c, 0) }}</p>
                                    <v-text-field class="my-2" v-model="c.string_args[0]" @input="setdirty" :label="$t('jobpage.path')" hide-details></v-text-field>
                                    <v-textarea class="my-2" v-model="c.string_args[1]" @input="setdirty" :label="$t('jobpage.content')" hide-details></v-textarea>
                                </div>
                                <div v-else-if="checkPatterm(c.category, c.type, 'Command')">
                                    <p class="hint">{{ replaceString(c, 0) }}</p>
                                    <v-text-field class="my-2" v-model="c.string_args[0]" @input="setdirty" :label="$t('jobpage.path')" hide-details></v-text-field>
                                    <p class="hint">{{ replaceString(c, 1) }}</p>
                                    <v-text-field class="my-2" v-model="c.string_args[1]" @input="setdirty" :label="$t('jobpage.command')" hide-details></v-text-field>
                                    <p class="hint">{{ replaceString(c, 2) }}</p>
                                    <v-text-field class="my-2" v-model="c.string_args[2]" @input="setdirty" :label="$t('jobpage.databases')" hide-details></v-text-field>
                                </div>
                                <div v-else-if="checkPatterm(c.category, c.type, 'Lib_Command')">
                                    <p class="hint">{{ replaceString(c, 0) }}</p>
                                    <v-text-field class="my-2" v-model="c.string_args[0]" @input="setdirty" :label="$t('jobpage.command')" hide-details></v-text-field>
                                    <p class="hint">{{ replaceString(c, 1) }}</p>
                                    <v-text-field class="my-2" v-model="c.string_args[1]" @input="setdirty" :label="$t('jobpage.databases')" hide-details></v-text-field>
                                </div>
                                <div v-else-if="checkPatterm(c.category, c.type, 'Javascript')">
                                    <codemirror-js v-model="c.script"
                                        style="text-align:left;"
                                        :style="{ height: '40vh' }"
                                        @change="setdirty"/>
                                    <v-select @update:model-value="setdirty" clearable v-model="c.string_args" :items="props.libs" item-title="name" item-value="name" multiple label="Library">
                                        <template #selection="{ item }">
                                            <v-chip v-if="scriptExist(item.title)" color="primary">{{item.title}}</v-chip>
                                            <v-chip v-else closable color="danger">{{item.title}}</v-chip>
                                        </template>
                                    </v-select>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
        </div>
    </ContextFrame>
</template>

<style scoped>
.hint {
    opacity: 60%;
    text-align: left;
    margin-top: 10px;
}
</style>
