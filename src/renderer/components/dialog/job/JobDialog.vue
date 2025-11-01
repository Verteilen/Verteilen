<script lang="ts" setup>
//#region Modules
import { Emitter } from 'mitt'
import { 
    BusType, 
    CreateDefaultJob, 
    Execute_PART, 
    Job, 
    JobCategory, 
    JobCategoryText, 
    JobResultText, 
    JobType, 
    JobType2,
    JobType2Text,
    JobTypeText, 
} from 'verteilen-core/src/interface'
import { i18n } from 'verteilen-core/src/plugins/i18n'
import { inject, ref, Ref, watch } from 'vue'
import { BackendProxy } from '../../../proxy'
//#endregion

//#region Views
import DialogBase from './../DialogBase.vue'
import { DATA, PROPS } from './JobDialog'
//#endregion

//#region Data
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const backend:Ref<BackendProxy> = inject('backend')!
const modal = defineModel<boolean>({ required: true })
const props = defineProps<PROPS>()
const data:Ref<DATA> = ref({
    ck: 0,
    buffer: CreateDefaultJob()
})
//#endregion

//#region Watch
watch(() => props.select, (v:Job) => {

})
//#endregion

//#region Methods
const replaceString = (index:number):string => {
    if(props.select == undefined) return ""
    const copyJob:Job = JSON.parse(JSON.stringify(data.value.buffer))
    if(index >= copyJob.string_args.length || index < 0) return ""
    if(props.database == undefined) return copyJob.string_args[index]
    Execute_PART.ExecuteManager_Base.string_args_transform(props.task!, copyJob, (str) => console.log(str), props.database, data.value.ck)
    return copyJob.string_args[index]
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

}
const cancel = () => {

}
//#endregion
</script>

<template>
    <DialogBase width="90vw" v-model="modal">
        <template #title>
            <template v-if="edit">
                <v-icon>mdi-pencil</v-icon>
                {{ data.buffer.uuid }}
            </template>
            <template v-else>
                <v-icon>mdi-hammer</v-icon>
                {{ $t("modal.new-job") }}
            </template>
        </template>
        <template #text>
            <!-- Header -->
            <v-text-field v-model="data.buffer.title" :label="$t('modal.job-title')"></v-text-field>
            <v-textarea v-model="data.buffer.description" :label="$t('modal.job-description')"></v-textarea>

            <v-select v-model.number="props.jobtype" disabled item-title="title" item-value="value" :items="[
                { title: $t('enum.category.condition'), value: 0 },
                { title: $t('enum.category.execution'), value: 1 }
            ]"></v-select>
            <v-select v-if="props.jobtype == JobCategory.Execution" v-model="data.buffer.type" :items="props.types" item-title="text" item-value="value"></v-select>
            <v-select v-else-if="props.jobtype == JobCategory.Condition" v-model="data.buffer.type" :items="props.types2" item-title="text" item-value="value"></v-select>
            
            <hr class="mb-6" />

            <!-- Content -->
            <div v-if="checkPatterm(data.buffer.category, data.buffer.type, 'Javascript_n')">
                <v-select v-model="data.buffer.number_args[0]" :items="props.result" item-title="text" :label="$t('jobpage.if-error')" hide-details></v-select>
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
                <v-text-field class="my-2" v-model="data.buffer.string_args[2]" :label="$t('jobpage.databases')" hide-details></v-text-field>
            </div>
            <div v-else-if="checkPatterm(data.buffer.category, data.buffer.type, 'Lib_Command')">
                <p class="hint">{{ replaceString(0) }}</p>
                <v-text-field class="my-2" v-model="data.buffer.string_args[0]" :label="$t('jobpage.command')" hide-details></v-text-field>
                <p class="hint">{{ replaceString(1) }}</p>
                <v-text-field class="my-2" v-model="data.buffer.string_args[1]" :label="$t('jobpage.databases')" hide-details></v-text-field>
            </div>
            <div v-else-if="checkPatterm(data.buffer.category, data.buffer.type, 'Javascript')">
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
        <template #action>
            <v-btn class="mt-3" color="primary" @click="confirm">{{ $t(props.edit ? 'modify' : 'create') }}</v-btn>
            <v-btn class="mt-3" color="error" @click="cancel">{{ $t('cancel') }}</v-btn>
        </template>
    </DialogBase>
</template>