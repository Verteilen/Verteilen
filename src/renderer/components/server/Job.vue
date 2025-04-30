<script setup lang="ts">
import { Emitter } from 'mitt';
import { v6 as uuidv6 } from 'uuid';
import { computed, inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, ConditionResult, Job, JobCategory, JobCategoryText, JobResultText, JobType, JobType2, JobType2Text, JobTypeText, Libraries, Project, Property, Rename, Task } from '../../interface';
import { i18n } from './../../plugins/i18n';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    projects: Array<Project>
    select: Task | undefined
    owner: Project | undefined
    libs: Libraries
}

interface JobTable extends Job {
    s?: boolean
}

const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'added', job:Job[]): void
    (e: 'edit', task:Array<Job>, properties: Array<Property>): void
    (e: 'delete', uuids:Array<string>): void
    (e: 'select', uuids:string): void
    (e: 'keychange', key:string): void
    (e: 'moveup', uuids:string): void
    (e: 'movedown', uuids:string): void
    (e: 'return'): void
}>()
const createModal = ref(false)
const createData = ref({category: 0, type: 0, spe_template: 0})
const deleteModal = ref(false)
const deleteData:Ref<Array<string>> = ref([])
const items:Ref<Array<JobTable>> = ref([])
const items2:Ref<Array<Property>> = ref([])
const types:Ref<Array<any>> = ref([])
const types2:Ref<Array<any>> = ref([])
const result:Ref<Array<any>> = ref([])
const categorise:Ref<Array<any>> = ref([])
const dirty = ref(false)

const hasSelect = computed(() => items.value.filter(x => x.s).length > 0)


const setdirty = () => {
    dirty.value = true
}

const updateJob = () => {
    const old:Array<Job> = JSON.parse(JSON.stringify(items.value))
    items.value = JSON.parse(JSON.stringify(props.select?.jobs ?? []))
    const ids = old.filter(x => x.s).map(x => x.uuid)
    items.value.filter(x => ids.includes(x.uuid)).forEach(x => x.s = true)
    items.value.forEach(x => x.s = false)
    items2.value = JSON.parse(JSON.stringify(props.select?.properties ?? []))
    dirty.value = false
}

const checkPatterm = (category:number, type:number, checker:string):boolean => {
    const e = category == JobCategory.Execution && ( 
        (checker == 'TwoPath' && ( type === JobType.COPY_DIR || type === JobType.COPY_FILE || type === JobType.RENAME )) ||
        (checker == 'OnePath' && ( type === JobType.DELETE_DIR || type === JobType.DELETE_FILE || type === JobType.CREATE_DIR )) ||
        (checker == 'Command' && ( type === JobType.COMMAND )) ||
        (checker == 'Writer' && ( type === JobType.CREATE_FILE )) ||
        (checker == 'Lua' && (type == JobType.LUA)) ||
        (checker == 'Javascript' && (type == JobType.JAVASCRIPT))
    );
    const e2 = category == JobCategory.Condition && (
        (checker == 'Lua_n' && (type == JobType2.LUA)) ||
        (checker == 'Javascript_n' && (type == JobType2.JAVASCRIPT)) ||
        (checker == 'OnePath_n' && (type == JobType2.CHECK_PATH))
    )
    return e || e2
}

const expressionNameCheck = (x:string) => {
    return x.length == 0 || x == null || items2.value.filter(y => x == y.name).length >= 2
}

const deleteProperty = (name:string) => {
    dirty.value = true
    items2.value = items2.value.filter(x => x.name != name)
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
    createData.value = {category: 0, type: 0, spe_template: 0};
    createModal.value = true
}

const createProperty = () => {
    items2.value.push({name: "default", expression: "1 + 1"})
    setdirty()
}

const saveJobs = () => {
    emits('edit', items.value, items2.value)
    dirty.value = false
}

const cloneSelect = () => {
    const buffer:JobTable[] = JSON.parse(JSON.stringify(items.value.filter(x => x.s != undefined && x.s === true)))
    buffer.forEach(x => x.uuid = uuidv6())
    items.value.push(...buffer)
}

const deleteSelect = () => {
    deleteData.value = items.value.filter(x => x.s == true).map(x => x.uuid)
    deleteModal.value = true
}

const deleteConfirm = () => {
    deleteModal.value = false
    items.value = items.value.filter(x => !deleteData.value.includes(x.uuid))
    dirty.value = true
}

const confirmCreate = () => {
    createModal.value = false
    emits('added', 
        [{ 
            uuid: uuidv6(),
            category: createData.value.category,
            type: createData.value.type,
            script: "",
            string_args: [],
            number_args: [0],
            boolean_args: []
        }]
    )
    nextTick(() => {
        updateJob();
        dirty.value = true
    })
}

const scriptExist = (name:string) => {
    return props.libs.libs!.findIndex(x => x.name == name) != -1
}

const libRename = (d:Rename) => {
    items.value.forEach(z => {
        if((z.category == JobCategory.Condition && z.type == JobType2.LUA) || (z.category == JobCategory.Execution && z.type == JobType.LUA)){
            const index = z.string_args.findIndex(x => x == d.oldname)
            if(index != -1) z.string_args[index] = d.newname
        }
    })
}

const libDelete = (name:string) => {
    items.value.forEach(z => {
        if((z.category == JobCategory.Condition && z.type == JobType2.LUA) || (z.category == JobCategory.Execution && z.type == JobType.LUA)){
            const index = z.string_args.findIndex(x => x == name)
            if(index != -1) z.string_args.splice(index, 1)
        }
    })
}

const selectall = (s:boolean) => {
    items.value.forEach(x => x.s = s)
}

const moveup = (uuid:string) => {
    dirty.value = true
    const index = items.value.findIndex(x => x.uuid == uuid)
    const buffer = items.value[index - 1]
    items.value[index - 1] = items.value[index]
    items.value[index] = buffer
}

const movedown = (uuid:string) => {
    dirty.value = true
    const index = items.value.findIndex(x => x.uuid == uuid)
    const buffer = items.value[index + 1]
    items.value[index + 1] = items.value[index]
    items.value[index] = buffer
}

const isFirst = (uuid:string) => {
    if(props.select == undefined) return
    const index = props.select.jobs.findIndex(x => x.uuid == uuid)
    return index <= 0
}

const isLast = (uuid:string) => {
    if(props.select == undefined) return
    const index = props.select.jobs.findIndex(x => x.uuid == uuid)
    if(index == -1) return true
    return index == props.select.jobs.length - 1
}

const updateLocate = () => {
    categorise.value = Object.keys(JobCategory).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            text: JobCategoryTranslate(index as JobCategory),
            value: index
        }
    })
    types.value = Object.keys(JobType).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            text: JobTypeTranslate(index as JobType),
            value: index
        }
    })
    types2.value = Object.keys(JobType2).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            text: JobType2Translate(index as JobType2),
            value: index
        }
    })
    result.value = Object.keys(ConditionResult).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            text: JobResultTranslate(index as ConditionResult),
            value: index
        }
    })
}

const goreturn = () => {
    emits('return')
}

onMounted(() => {
    updateLocate()
    updateJob()
    emitter?.on('updateJob', updateJob)
    emitter?.on('updateLocate', updateLocate)
    emitter?.on('renameScript', libRename)
    emitter?.on('deleteScript', libDelete)
})

onUnmounted(() => {
    emitter?.off('updateJob', updateJob)
    emitter?.off('updateLocate', updateLocate)
    emitter?.off('renameScript', libRename)
    emitter?.off('deleteScript', libDelete)
})

</script>

<template>
    <div>
        <div class="py-3">
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
                        <v-btn icon v-bind="props" color="success" @click="saveJobs" :disabled="select == undefined || !dirty">
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
        </div>
        <!-- Property -->
        <div v-if="select != undefined" class="py-3 pb-5 mx-5">
            <h3> {{ $t('property') }} </h3>
            <br />
            <v-row v-for="(c, i) in items2" :key="i">
                <v-col cols="3">
                    <v-text-field :error="expressionNameCheck(c.name)" hide-detail v-model="c.name" :label="$t('expression.title')" @input="setdirty"></v-text-field>
                </v-col>
                <v-col cols="8">
                    <v-text-field hide-detail v-model="c.expression" :label="$t('expression.value')" @input="setdirty"></v-text-field>
                </v-col>
                <v-col cols="1" class="mt-1">
                    <v-btn flat icon @click="deleteProperty(c.name)">
                        <v-icon>mdi-delete</v-icon>
                    </v-btn>
                </v-col>
            </v-row>
        </div>
        <!-- Job List -->
        <hr class="mx-5 my-2" />
        <div v-if="select != undefined" class="py-3 pb-7">
            <h3> {{ $t('job') }} </h3>
            <br />
            <v-expansion-panels color="dark" class="px-6 text-white">
                <v-expansion-panel v-for="(c, i) in items" :key="i" class="my-2" color="blue-darken-4">
                    <v-row>
                        <v-col cols="auto" class="mt-2">
                            <v-checkbox type="checkbox" v-model="c.s" hide-details width="25" density="compact"></v-checkbox>
                        </v-col>
                        <v-col cols="auto" class="mt-2">
                            <v-btn size="small" icon flat :disabled="isFirst(c.uuid)" @click="moveup(c.uuid)">
                                <v-icon>mdi-arrow-up</v-icon>
                            </v-btn>
                            <v-btn class="ml-2" size="small" icon flat :disabled="isLast(c.uuid)" @click="movedown(c.uuid)">
                                <v-icon>mdi-arrow-down</v-icon>
                            </v-btn>
                        </v-col>
                        <v-col cols="10">
                            <v-expansion-panel-title>
                                <v-chip class="mr-1">{{ i }}. {{ c.category == 0 ? JobType2Translate(c.type) : JobTypeTranslate(c.type) }}</v-chip>
                                <v-chip>{{ c.uuid }}</v-chip>
                            </v-expansion-panel-title>
                        </v-col>
                    </v-row>
                    
                    <v-expansion-panel-text>
                        <v-card flat>
                            <v-card-text>
                                <div v-if="checkPatterm(c.category, c.type, 'Lua_n')">
                                    <v-select v-model="c.number_args[0]" @update:model-value="setdirty" :items="result" item-title="text" :label="$t('jobpage.if-error')" hide-details></v-select>
                                    <codemirror-lua v-model="c.script" 
                                        style="text-align:left;"
                                        :style="{ height: '40vh' }"
                                        @change="setdirty"/>
                                    <v-select @update:model-value="setdirty" clearable v-model="c.string_args" :items="props.libs.libs" item-title="name" item-value="name" multiple label="Library">
                                        <template #selection="{ item }">
                                            <v-chip v-if="scriptExist(item.title)" color="primary">{{item.title}}</v-chip>
                                            <v-chip v-else closable color="danger">{{item.title}}</v-chip>
                                        </template>
                                    </v-select>
                                </div>
                                <div v-if="checkPatterm(c.category, c.type, 'Javascript_n')">
                                    <v-select v-model="c.number_args[0]" @update:model-value="setdirty" :items="result" item-title="text" :label="$t('jobpage.if-error')" hide-details></v-select>
                                    <codemirror-js v-model="c.script" 
                                        style="text-align:left;"
                                        :style="{ height: '40vh' }"
                                        @change="setdirty"/>
                                </div>
                                <div v-else-if="checkPatterm(c.category, c.type, 'OnePath_n')">
                                    <v-select v-model="c.number_args[0]" @update:model-value="setdirty" :items="result" item-title="text" :label="$t('jobpage.if-error')" hide-details></v-select>
                                    <v-text-field class="my-2" v-model="c.string_args[0]" @input="setdirty" :label="$t('jobpage.path')" hide-details></v-text-field>
                                </div>
                                <!-- Execution -->
                                <div v-else-if="checkPatterm(c.category, c.type, 'TwoPath')">
                                    <v-text-field class="my-2" v-model="c.string_args[0]" @input="setdirty" :label="$t('jobpage.from')" hide-details></v-text-field>
                                    <v-text-field class="my-2" v-model="c.string_args[1]" @input="setdirty" :label="$t('jobpage.to')" hide-details></v-text-field>
                                </div>
                                <div v-else-if="checkPatterm(c.category, c.type, 'OnePath')">
                                    <v-text-field class="my-2" v-model="c.string_args[0]" @input="setdirty" :label="$t('jobpage.path')" hide-details></v-text-field>
                                </div>
                                <div v-else-if="checkPatterm(c.category, c.type, 'Writer')">
                                    <v-text-field class="my-2" v-model="c.string_args[0]" @input="setdirty" :label="$t('jobpage.path')" hide-details></v-text-field>
                                    <v-textarea class="my-2" v-model="c.string_args[1]" @input="setdirty" :label="$t('jobpage.content')" hide-details></v-textarea>
                                </div>
                                <div v-else-if="checkPatterm(c.category, c.type, 'Command')">
                                    <v-text-field class="my-2" v-model="c.string_args[0]" @input="setdirty" :label="$t('jobpage.path')" hide-details></v-text-field>
                                    <v-text-field class="my-2" v-model="c.string_args[1]" @input="setdirty" :label="$t('jobpage.command')" hide-details></v-text-field>
                                    <v-text-field class="my-2" v-model="c.string_args[2]" @input="setdirty" :label="$t('jobpage.parameters')" hide-details></v-text-field>
                                </div>
                                <div v-else-if="checkPatterm(c.category, c.type, 'Lua')">
                                    <codemirror-lua v-model="c.script"
                                        style="text-align:left;"
                                        :style="{ height: '40vh' }"
                                        @change="setdirty"/>
                                    <v-select @update:model-value="setdirty" clearable v-model="c.string_args" :items="props.libs.libs" item-title="name" item-value="name" multiple label="Library">
                                        <template #selection="{ item }">
                                            <v-chip v-if="scriptExist(item.title)" color="primary">{{item.title}}</v-chip>
                                            <v-chip v-else closable color="danger">{{item.title}}</v-chip>
                                        </template>
                                    </v-select>
                                </div>
                                <div v-else-if="checkPatterm(c.category, c.type, 'Javascript')">
                                    <codemirror-js v-model="c.script"
                                        style="text-align:left;"
                                        :style="{ height: '40vh' }"
                                        @change="setdirty"/>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
        </div>
        <v-dialog width="500" v-model="createModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-hammer</v-icon>
                    {{ $t('modal.new-job') }}
                </v-card-title>
                <v-card-text>
                    <v-select class="mb-1" hide-details v-model="createData.category" :items="categorise" item-title="text" item-value="value"></v-select>
                    <v-select class="mb-1" hide-details v-if="createData.category == 0" v-model="createData.type" :items="types2" item-title="text" item-value="value"></v-select>
                    <v-select class="mb-1" hide-details v-if="createData.category == 1" v-model="createData.type" :items="types" item-title="text" item-value="value"></v-select>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" color="primary" @click="confirmCreate">{{ $t('create') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
        <v-dialog width="500" v-model="deleteModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-pencil</v-icon>
                    {{ $t('modal.delete-job') }}
                </v-card-title>
                <v-card-text>
                    <p>{{ $t('modal.delete-job-confirm') }}</p>
                    <br />
                    <p v-for="(p, i) in deleteData">
                        {{ i }}. {{ p }}
                    </p>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" color="primary" @click="deleteModal = false">{{ $t('cancel') }}</v-btn>
                    <v-btn class="mt-3" color="error" @click="deleteConfirm">{{ $t('delete') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
    </div>
</template>

<style scoped>

</style>
