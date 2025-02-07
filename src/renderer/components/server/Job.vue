<script setup lang="ts">
import { Emitter } from 'mitt';
import { v6 as uuidv6 } from 'uuid';
import { inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { } from 'vue-codemirror';
import { BusType, Job, JobType, JobTypeText, LUATemplate, LUATemplateText, Project, Task } from '../../interface';
import { DEFAULT, FUNIQUE_GS4_V1 } from '../../luaTemplate';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    projects: Array<Project>
    select: Task | undefined
    owner: Project | undefined
}

interface JobTable extends Job {
    s?: boolean
}

const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'added', job:Job[]): void
    (e: 'edit', task:Array<Job>): void
    (e: 'delete', uuids:Array<string>): void
    (e: 'select', uuids:string): void
    (e: 'keychange', key:string): void
    (e: 'moveup', uuids:string): void
    (e: 'movedown', uuids:string): void
}>()
const hasSelect = ref(false)
const createModal = ref(false)
const createData = ref({type: 0, spe_template: 0})
const items:Ref<Array<JobTable>> = ref([])
const types:Ref<Array<{  }>> = ref([])
const lua_types:Ref<Array<{  }>> = ref([])
const para_keys:Ref<Array<string>> = ref([])
const dirty = ref(false)

const updateParameter = () => {
    para_keys.value = props.owner?.parameter.numbers.map(x => x.name) ?? []
}

const setdirty = () => {
    dirty.value = true
}

const updateJob = () => {
    items.value = props.select?.jobs ?? []
}

const checkPatterm = (type:number, checker:string):boolean => {
    const e = ( 
        (checker == 'TwoPath' && ( type === JobType.COPY_DIR || type === JobType.COPY_FILE )) ||
        (checker == 'OnePath' && ( type === JobType.DELETE_DIR || type === JobType.DELETE_FILE )) ||
        (checker == 'Script' && (type == JobType.LUA))
    );
    return e
}

const datachange = (id:string, e:boolean) => {
    const d = items.value.find(x => x.uuid == id)
    if(d == undefined) return
    d.s = e
    hasSelect.value = items.value.filter(x => x.s).length > 0
}

const JobTypeTranslate = (t:number):string => {
    return JobTypeText[t]
}
const LUATemplateTranslate = (t:number):string => {
    return LUATemplateText[t]
}

const changeCronKey = (key:string) => {
    emits('keychange', key)
}

const createJob = () => {
    createData.value = {type: 0, spe_template: 0};
    createModal.value = true
}

const saveJobs = () => {
    emits('edit', items.value)
    dirty.value = false
}

const cloneSelect = () => {
    
}

const deleteSelect = () => {
    emits('delete', items.value.filter(x => x.s).map(x => x.uuid))
    nextTick(() => {
        updateJob()
        hasSelect.value = items.value.filter(x => x.s).length > 0;
    })
}

const confirmCreate = () => {
    createModal.value = false
    let code = ""
    if(createData.value.type == JobType.LUA){
        switch(createData.value.spe_template){
            case LUATemplate.DEFAULT:
                code = DEFAULT
                break
            case LUATemplate.FUNIQUE_GS4_V1:
                code = FUNIQUE_GS4_V1
                break
        }
    }
    emits('added', 
        [{ 
            uuid: uuidv6(),
            type: createData.value.type,
            lua: code,
            string_args: [],
            number_args: [],
            boolean_args: []
        }]
    )
    nextTick(() => {
        updateJob();
    })
}

const moveup = (uuid:string) => {
    emits('moveup', uuid)
    nextTick(() => {
        updateJob();
    })
}

const movedown = (uuid:string) => {
    emits('movedown', uuid)
    nextTick(() => {
        updateJob();
    })
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

onMounted(() => {
    types.value = Object.keys(JobType).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            text: JobTypeTranslate(index as JobType),
            value: index
        }
    })
    lua_types.value = Object.keys(LUATemplate).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            text: LUATemplateTranslate(index as LUATemplate),
            value: index
        }
    })
    updateJob()
    emitter?.on('updateJob', updateJob)
    emitter?.on('updateParameter', updateParameter)
})

onUnmounted(() => {
    emitter?.off('updateJob', updateJob)
    emitter?.off('updateParameter', updateParameter)
})

</script>

<template>
    <div>
        <div class="my-3">
            <b-button-group>
                <b-button variant='primary' @click="createJob" :disabled="select == undefined">新增</b-button>
                <b-button variant='primary' @click="saveJobs" :disabled="select == undefined || !dirty">存檔</b-button>
                <b-button variant='primary' @click="cloneSelect" :disabled="!hasSelect || select == undefined">克隆</b-button>
                <b-button variant='danger' @click="deleteSelect" :disabled="!hasSelect || select == undefined">刪除</b-button>
            </b-button-group>
        </div>
        <b-card ag="article" class="my-3 w-50" style="margin-left: 25%;" v-if="props.select != undefined">
            <b-card-title>
                當前選擇流程: {{ props.select.title }}
            </b-card-title>
            <b-card-text>
                敘述: {{ props.select.description }}
                <p>群集運算: {{ props.select.cronjob }}</p>
                <b-form-select v-if="props.select.cronjob" :value="props.select.cronjobKey" @change="e => changeCronKey(e)" :options="para_keys"></b-form-select>
            </b-card-text>
        </b-card>
        <b-modal title="新增工作" v-model="createModal" hide-footer>
            <b-form-select v-model="createData.type" :options="types"></b-form-select>
            <b-form-select class="mt-3" v-if="checkPatterm(createData.type, 'Script')" v-model="createData.spe_template" :options="lua_types"></b-form-select>
            <b-button class="mt-3" variant="primary" @click="confirmCreate">新增</b-button>
        </b-modal>
        <hr />
        <div v-if="select != undefined">
            <b-card v-for="(c, i) in items">
                <b-card-header>
                    <b-form-checkbox type="checkbox" v-model="c.s" @change="e => datachange(c.uuid, e)">
                        {{ i }}. {{ JobTypeTranslate(c.type) }}
                        <span>
                            <b-dropdown text="動作" class="m-md-2">
                                <b-dropdown-item :disabled="isFirst(c.uuid)" @click="moveup(c.uuid)">往上移動</b-dropdown-item>
                                <b-dropdown-item :disabled="isLast(c.uuid)" @click="movedown(c.uuid)">往下移動</b-dropdown-item>
                            </b-dropdown>
                        </span>
                    </b-form-checkbox>
                </b-card-header>
                <div v-if="checkPatterm(c.type, 'TwoPath')">
                    <b-form-input class="my-2" v-model="c.string_args[0]" placeholder="輸入來源"></b-form-input>
                    <b-form-input class="my-2" v-model="c.string_args[1]" placeholder="輸入目的"></b-form-input>
                </div>
                <div v-else-if="checkPatterm(c.type, 'OnePath')">
                    <b-form-input class="my-2" v-model="c.string_args[1]" placeholder="輸入路徑"></b-form-input>
                </div>
                <codemirror v-else-if="checkPatterm(c.type, 'Script')" v-model="c.lua" 
                    style="text-align:left;"
                    :style="{ height: '40vh' }"
                    :autofocus="true"
                    :indent-with-tab="true"
                    :tab-size="2" 
                    mode="text/x-lua"
                    @change="setdirty"/>
                <b-card-footer>
                    {{ c.uuid }}
                </b-card-footer>
            </b-card>
        </div>
        
        
    </div>
</template>

<style scoped>

</style>
