<script lang="ts" setup>
//#region Modules
import { Emitter } from 'mitt'
import { 
    BusType, 
    CreateDefaultJob, 
    DatabaseTable, 
    ExecuteManager_Base, 
    Job, 
    JobCategory, 
    JobType, 
    JobType2,
    ToastData, 
} from 'verteilen-core/src/interface'
import { i18n } from '../../../plugins/i18n'
import { inject, ref, Ref, watch } from 'vue'
import { BackendProxy } from '../../../proxy'
//#endregion

//#region Views
import DialogBase from './../DialogBase.vue'
import { DATA, EmitType, PROPS } from './JobDialog'
//#endregion

//#region Data
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const backend:Ref<BackendProxy> = inject('backend')!
const modal = defineModel<boolean>({ required: true })
const props = defineProps<PROPS>()
const emits = defineEmits<EmitType>()
const data:Ref<DATA> = ref({
    ck: 0,
    zoom: false,
    buffer: CreateDefaultJob()
})
//#endregion

//#region Watch
watch(() => props.select, (v:Job) => {
    data.value.zoom = false
    data.value.buffer = JSON.parse(JSON.stringify(v))
})
//#endregion

//#region Methods
const replaceString = (index:number):string => {
    if(props.select == undefined) return ""
    const copyJob:Job = JSON.parse(JSON.stringify(data.value.buffer))
    if(index >= copyJob.string_args.length || index < 0) return ""
    let db:DatabaseTable | undefined = props.database
    if(db == undefined) {
        db = { uuid: "", title: "", canWrite: true, containers: [], s: false}
    }
    try{
        ExecuteManager_Base.string_args_transform(props.task!, copyJob, (str) => console.log(str), db, data.value.ck)
        return copyJob.string_args[index]
    }catch(e:any){
        const t:ToastData = {
            type: "error",
            title: "Expression Error",
            message: e.message
        }
        emitter.emit('makeToast', t)
        return ""
    }
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
const scriptExist = (name:string) => {
    return props.libs!.findIndex(x => x.name == name) != -1
}
const confirm = () => {
    emits('confirm', {
        ...data.value.buffer,
        string_args: data.value.buffer.string_args.map((s) => (s == null || s == undefined) ? '' : s)
    })
}
const cancel = () => {
    modal.value = false
}
//#endregion
</script>

<template>
    <DialogBase persistent :width="data.zoom ? '100vw' : '90vw'" :height="data.zoom ? '100vh' : undefined" v-model="modal">
        <template #title>
            <template v-if="edit">
                <v-icon>mdi-pencil</v-icon>
                {{ data.buffer.uuid.slice(data.buffer.uuid.length - 12, data.buffer.uuid.length) }}
            </template>
            <template v-else>
                <v-icon>mdi-hammer</v-icon>
                {{ $t("modal.new-job") }}
            </template>
        </template>
        <template v-if="!data.zoom" #text>
            <!-- Header -->
            <v-text-field class="mb-5" :error="titleError" :autofocus="true" required v-model="data.buffer.title" :label="$t('modal.job-title')" hide-details></v-text-field>
            <v-textarea v-model="data.buffer.description" :label="$t('modal.job-description')"></v-textarea>

            <v-row>
                <v-col cols="6">
                    <v-select v-model.number="props.jobtype" disabled item-title="title" item-value="value" :items="[
                        { title: $t('enum.category.condition'), value: 0 },
                        { title: $t('enum.category.execution'), value: 1 }
                    ]"></v-select>
                </v-col>
                <v-col cols="6">
                    <v-select v-if="props.jobtype == JobCategory.Execution" v-model="data.buffer.type" :items="props.types" item-title="text" item-value="value"></v-select>
                    <v-select v-else-if="props.jobtype == JobCategory.Condition" v-model="data.buffer.type" :items="props.types2" item-title="text" item-value="value"></v-select>
                </v-col>
            </v-row>
            <v-text-field v-model.number="data.ck" hide-details label="ck" :min="0" type="number"></v-text-field>

            <br class="my-6" />
            <h2 class="ml-2 mb-6"> {{ $t('headers.detail') }} </h2>

            <!-- Content -->
            <div v-if="checkPatterm(data.buffer.category, data.buffer.type, 'Javascript_n')">
                <v-select v-model="data.buffer.number_args[0]" :items="props.result" item-title="text" :label="$t('jobpage.if-error')" hide-details></v-select>
                <v-btn prepend-icon="mdi-magnify-plus" variant="outlined" color="warning" @click="data.zoom = true">{{ $t('zoom') }}</v-btn>
                <codemirror-js v-model="data.buffer.script" 
                    style="text-align:left;"
                    :style="{ height: '40vh' }"/>
                <v-select clearable v-model="data.buffer.string_args" :items="props.libs" item-title="name" item-value="name" multiple label="Library">
                    <template #selection="{ item }">
                        <v-chip v-if="scriptExist(item.title)" color="primary">{{item.title}}</v-chip>
                        <v-chip v-else closable color="danger">{{item.title}}</v-chip>
                    </template>
                </v-select>
            </div>
            <div v-else-if="checkPatterm(data.buffer.category, data.buffer.type, 'OnePath_n')">
                <v-select v-model="data.buffer.number_args[0]" :items="props.result" item-title="text" :label="$t('jobpage.if-error')" hide-details></v-select>
                <p class="hint">{{ replaceString(0) }}</p>
                <v-text-field class="my-2" v-model="data.buffer.string_args[0]" :label="$t('jobpage.path')" hide-details></v-text-field>
            </div>
            <!-- Execution -->
            <div v-else-if="checkPatterm(data.buffer.category, data.buffer.type, 'TwoPath')">
                <p class="hint">{{ replaceString(0) }}</p>
                <v-text-field class="my-2" v-model="data.buffer.string_args[0]" :label="$t('jobpage.from')" hide-details></v-text-field>
                <p class="hint">{{ replaceString(1) }}</p>
                <v-text-field class="my-2" v-model="data.buffer.string_args[1]" :label="$t('jobpage.to')" hide-details></v-text-field>
            </div>
            <div v-else-if="checkPatterm(data.buffer.category, data.buffer.type, 'OnePath')">
                <p class="hint">{{ replaceString(0) }}</p>
                <v-text-field class="my-2" v-model="data.buffer.string_args[0]" :label="$t('jobpage.path')" hide-details></v-text-field>
            </div>
            <div v-else-if="checkPatterm(data.buffer.category, data.buffer.type, 'Writer')">
                <p class="hint">{{ replaceString(0) }}</p>
                <v-text-field class="my-2" v-model="data.buffer.string_args[0]" :label="$t('jobpage.path')" hide-details></v-text-field>
                <v-textarea class="my-2" v-model="data.buffer.string_args[1]" :label="$t('jobpage.content')" hide-details></v-textarea>
            </div>
            <div v-else-if="checkPatterm(data.buffer.category, data.buffer.type, 'Command')">
                <p class="hint">{{ replaceString(0) }}</p>
                <v-text-field class="my-2" v-model="data.buffer.string_args[0]" :label="$t('jobpage.path')" hide-details></v-text-field>
                <p class="hint">{{ replaceString(1) }}</p>
                <v-text-field class="my-2" v-model="data.buffer.string_args[1]" :label="$t('jobpage.command')" hide-details></v-text-field>
                <p class="hint">{{ replaceString(2) }}</p>
                <v-text-field class="my-2" v-model="data.buffer.string_args[2]" :label="$t('jobpage.variable')" hide-details></v-text-field>
            </div>
            <div v-else-if="checkPatterm(data.buffer.category, data.buffer.type, 'Lib_Command')">
                <p class="hint">{{ replaceString(0) }}</p>
                <v-text-field class="my-2" v-model="data.buffer.string_args[0]" :label="$t('jobpage.command')" hide-details></v-text-field>
                <p class="hint">{{ replaceString(1) }}</p>
                <v-text-field class="my-2" v-model="data.buffer.string_args[1]" :label="$t('jobpage.variable')" hide-details></v-text-field>
            </div>
            <div v-else-if="checkPatterm(data.buffer.category, data.buffer.type, 'Javascript')">
                <v-btn prepend-icon="mdi-magnify-plus" variant="outlined" color="warning" @click="data.zoom = true">{{ $t('zoom') }}</v-btn>
                <codemirror-js v-model="data.buffer.script"
                    style="text-align:left;"
                    :style="{ height: '40vh' }"/>
                <v-select clearable v-model="data.buffer.string_args" :items="props.libs" item-title="name" item-value="name" multiple label="Library">
                    <template #selection="{ item }">
                        <v-chip v-if="scriptExist(item.title)" color="primary">{{item.title}}</v-chip>
                        <v-chip v-else closable color="danger">{{item.title}}</v-chip>
                    </template>
                </v-select>
            </div>
        </template>
        <template v-else #text>
            <v-btn prepend-icon="mdi-magnify-minus" variant="outlined" color="warning" @click="data.zoom = false">{{ $t('unzoom') }}</v-btn>
            <codemirror-js v-model="data.buffer.script"
                style="text-align:left;"
                :style="{ height: 'calc(100vh - 250px)' }"/>
        </template>
        <template #action>
            <v-btn class="mt-3" color="primary" @click="confirm">{{ $t(props.edit ? 'modify' : 'create') }}</v-btn>
            <v-btn class="mt-3" color="error" @click="cancel">{{ $t('cancel') }}</v-btn>
        </template>
    </DialogBase>
</template>

<style scoped>
.hint {
    opacity: 60%;
    text-align: left;
    margin-top: 10px;
}
</style>