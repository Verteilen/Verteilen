<script setup lang="ts">
import { Emitter } from 'mitt';
import { v6 as uuidv6 } from 'uuid';
import { inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { } from 'vue-codemirror';
import { BusType, Job, JobType, JobTypeText, LUATemplate, LUATemplateText, Project, Task } from '../../interface';
import { DEFAULT, FUNIQUE_GS4_PREPARE } from '../../template/luaTemplate';

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
const para_keys:Ref<Array<{ value: string, text: string }>> = ref([])
const dirty = ref(false)

const updateParameter = () => {
    para_keys.value = props.owner?.parameter.numbers.map(x => { return { value: x.name, text: x.name }}) ?? []
}

const setdirty = () => {
    dirty.value = true
}

const updateJob = () => {
    const old:Array<Job> = Object.create(items.value)
    items.value = props.select?.jobs ?? []
    const ids = old.filter(x => x.s).map(x => x.uuid)
    items.value.filter(x => ids.includes(x.uuid)).forEach(x => x.s = true)
    items.value.forEach(x => x.s = false)
    updateParameter()
    dirty.value = false
}

const checkPatterm = (type:number, checker:string):boolean => {
    const e = ( 
        (checker == 'TwoPath' && ( type === JobType.COPY_DIR || type === JobType.COPY_FILE || type === JobType.RENAME )) ||
        (checker == 'OnePath' && ( type === JobType.DELETE_DIR || type === JobType.DELETE_FILE || type === JobType.CREATE_DIR )) ||
        (checker == 'Command' && ( type === JobType.COMMAND )) ||
        (checker == 'Writer' && ( type === JobType.CREATE_FILE )) ||
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

const taskchange = () => {
    dirty.value = true
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
    const buffer = items.value.filter(x => x.s != undefined && x.s === true)
    buffer.forEach(x => x.uuid = uuidv6())
    items.value.push(...buffer)
}

const deleteSelect = () => {
    items.value = items.value.filter(x => x.s == undefined || x.s === false)
    hasSelect.value = false
    dirty.value = true
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
                code = FUNIQUE_GS4_PREPARE
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
        dirty.value = true
    })
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
        <div class="py-3">
            <b-button-group>
                <b-button variant='primary' @click="createJob" :disabled="select == undefined">{{ $t('create') }}</b-button>
                <b-button variant='primary' @click="saveJobs" :disabled="select == undefined || !dirty">{{ $t('save') }}</b-button>
                <b-button variant='primary' @click="cloneSelect" :disabled="!hasSelect || select == undefined">{{ $t('clone') }}</b-button>
                <b-button variant='danger' @click="deleteSelect" :disabled="!hasSelect || select == undefined">{{ $t('delete') }}</b-button>
            </b-button-group>
        </div>
        <b-card ag="article" bg-variant="dark" border-variant="primary" class="text-white my-3 w-50" style="margin-left: 25%;" v-if="props.select != undefined">
            <b-card-title>
                {{ props.select.title }}
            </b-card-title>
            <b-card-text>
                <p>{{ props.select.description }}</p>
                <v-row>
                    <v-col cols="4" class="pt-6">
                        <b-form-checkbox type="checkbox" @change="taskchange" v-model="props.select.cronjob">群集運算</b-form-checkbox>
                    </v-col>
                    <v-col>
                        <v-select v-if="props.select.cronjob" v-model="props.select.cronjobKey" @change="(e: string) => changeCronKey(e)" item-title="text" item-value="text" :items="para_keys" hide-details></v-select>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="4" class="pt-6">
                        <b-form-checkbox type="checkbox" @change="taskchange" v-model="props.select.multi">多核運算</b-form-checkbox>
                    </v-col>
                    <v-col>
                        <v-select v-if="props.select.multi" v-model="props.select.multiKey" @change="(e: string) => changeCronKey(e)" item-title="text" item-value="text" :items="para_keys" hide-details></v-select>
                    </v-col>
                </v-row>
            </b-card-text>
        </b-card>
        <hr />
        <div v-if="select != undefined" class="pb-7">
            <b-card v-for="(c, i) in items" no-body :key="i" bg-variant="dark" border-variant="success" class="text-white mb-3 py-1 px-2 mx-6">
                <b-card-header>
                    <v-row>
                        <v-col cols="2" style="padding-top: 25px;">
                            <b-form-checkbox type="checkbox" v-model="c.s" @change="(e: boolean) => datachange(c.uuid, e)"></b-form-checkbox>
                        </v-col>
                        <v-col>
                            {{ i }}. {{ JobTypeTranslate(c.type) }}
                            <span>
                                <b-dropdown :text="$t('action')" class="text-white m-md-2">
                                    <b-dropdown-item :disabled="isFirst(c.uuid)" @click="moveup(c.uuid)">{{ $t('moveup') }}</b-dropdown-item>
                                    <b-dropdown-item :disabled="isLast(c.uuid)" @click="movedown(c.uuid)">{{ $t('movedown') }}</b-dropdown-item>
                                </b-dropdown>
                            </span>
                        </v-col>
                        <v-col cols="2" style="padding-top: 25px;">
                            <span style="float:right; font-size: small; height:100%;">{{ c.uuid }}</span>
                        </v-col>
                    </v-row>
                </b-card-header>
                <div v-if="checkPatterm(c.type, 'TwoPath')">
                    <v-text-field class="my-2" v-model="c.string_args[0]" @input="setdirty" label="來源" hide-details></v-text-field>
                    <v-text-field class="my-2" v-model="c.string_args[1]" @input="setdirty" label="目的" hide-details></v-text-field>
                </div>
                <div v-else-if="checkPatterm(c.type, 'OnePath')">
                    <v-text-field class="my-2" v-model="c.string_args[0]" @input="setdirty" label="路徑" hide-details></v-text-field>
                </div>
                <div v-else-if="checkPatterm(c.type, 'Writer')">
                    <v-text-field class="my-2" v-model="c.string_args[0]" @input="setdirty" label="路徑" hide-details></v-text-field>
                    <v-textarea class="my-2" v-model="c.string_args[1]" @input="setdirty" label="內容" hide-details></v-textarea>
                </div>
                <div v-else-if="checkPatterm(c.type, 'Command')">
                    <v-text-field class="my-2" v-model="c.string_args[0]" @input="setdirty" label="執行路徑" hide-details></v-text-field>
                    <v-text-field class="my-2" v-model="c.string_args[1]" @input="setdirty" label="命令" hide-details></v-text-field>
                    <v-text-field class="my-2" v-model="c.string_args[2]" @input="setdirty" label="參數" hide-details></v-text-field>
                </div>
                <codemirror v-else-if="checkPatterm(c.type, 'Script')" v-model="c.lua" 
                    style="text-align:left;"
                    :style="{ height: '40vh' }"
                    :autofocus="true"
                    :indent-with-tab="true"
                    :tab-size="2" 
                    mode="text/x-lua"
                    @change="setdirty"/>
            </b-card>
        </div>
        <b-modal title="新增工作" v-model="createModal" hide-footer class="text-white" header-bg-variant="dark" header-text-variant="light" body-bg-variant="dark" body-text-variant="light" footer-text-variant="dark" footer-body-variant="light">
            <b-form-select v-model="createData.type" :options="types" item-title="text"></b-form-select>
            <b-form-select class="mt-3" v-if="checkPatterm(createData.type, 'Script')" v-model="createData.spe_template" :options="lua_types" item-title="text"></b-form-select>
            <b-button class="mt-3" variant="primary" @click="confirmCreate">新增</b-button>
        </b-modal>
    </div>
</template>

<style scoped>

</style>
