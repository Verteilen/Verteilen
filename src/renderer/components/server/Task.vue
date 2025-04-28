<script setup lang="ts">
import { Emitter } from 'mitt';
import { computed, inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, DataType, Parameter, Preference, Project, Task } from '../../interface';
import { i18n } from '../../plugins/i18n';
import { CreateField, DATA, Util_Task } from '../../util/Task';
import TaskDialog from '../dialog/TaskDialog.vue';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    preference: Preference
    projects: Array<Project>
    select: Project | undefined
    parameters: Array<Parameter>
}

const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'added', task:Task[]): void
    (e: 'edit', uuid:string, task:Task): void
    (e: 'delete', uuids:Array<string>): void
    (e: 'select', uuids:string): void
    (e: 'parameter', uuid:string):void
    (e: 'bind', uuid:string):void
    (e: 'moveup', uuids:string): void
    (e: 'movedown', uuids:string): void
}>()
const data:Ref<DATA> = ref({
    fields: [],
    paraModal: false,
    dialogModal: false,
    isEdit: false,
    editData: {cronjob: false, cronjobKey: "", title: "", description: "", setupjob: false, multi: false, multiKey: ""},
    editUUID: '',
    deleteModal: false,
    deleteData: [],
    items: [],
    para_keys: [],
    errorMessage: '',
    titleError: false,
    search: '',
    selectSearch: '',
    selection: []
})

const util:Util_Task = new Util_Task(data, () => props.select)

const hasPara = computed(() => {
    if(props.select == undefined || props.select.parameter_uuid.length == 0) return false
    return props.parameters.find(x => x.uuid == props.select!.parameter_uuid) != undefined
})
const realSearch = computed(() => data.value.search?.trimStart().trimEnd() ?? '')
const items_final = computed(() => {
    return realSearch.value == null || realSearch.value.length == 0 ? data.value.items : data.value.items.filter(x => x.title.includes(realSearch.value) || x.ID.includes(realSearch.value))
})
const hasSelect = computed(() => data.value.selection.length > 0)
const selected_task_ids = computed(() => data.value.items.filter(x => data.value.selection.includes(x.ID)).map(x => x.ID))
const para_title = computed(() => props.parameters.find(x => x.uuid == props.select?.parameter_uuid)?.title)

const updateTask = () => util.updateTask()
const updateParameter = () => util.updateParameter()
const createProject = () => util.createProject()
const detailOpen = () => emits('parameter', props.select!.parameter_uuid)

const datachoose = (uuid:string) => emits('select', uuid)
const dataedit = (uuid:string) => util.dataedit(uuid)

const detailSelect = () => {
    data.value.paraModal = true
}

const cloneSelect = () => {
    const ts = util.cloneSelect()
    if(ts == undefined) return
    emits('added', ts)
    nextTick(() => {
        updateTask();
    })
}

const selectall = () => data.value.selection = data.value.items.map(x => x.ID)

const deleteSelect = () => {
    data.value.deleteData = selected_task_ids.value
    data.value.deleteModal = true
}

const deleteConfirm = () => {
    data.value.deleteModal = false
    emits('delete', data.value.deleteData)
    nextTick(() => {
        updateTask()
    })
}

const selectParameter = (uuid:string) => {
    emits('bind', uuid)
}

const DialogSubmit = (p:CreateField) => {
    data.value.editData = p
    if(data.value.isEdit) confirmEdit()
    else confirmCreate()
}
const confirmCreate = () => {
    const p = util.confirmCreate()
    if(p == undefined) return
    emits('added', p)
    nextTick(() => {
        updateTask();
        data.value.editData = {cronjob: false, cronjobKey: "", title: "", description: "", setupjob: false, multi: false, multiKey: ""};
    })
}

const confirmEdit = () => {
    const p = util.confirmEdit()
    if(p == undefined) return
    emits('edit', data.value.editUUID, p)
    nextTick(() => {
        updateTask()
    })
}

const moveup = (uuid:string) => {
    emits('moveup', uuid)
    nextTick(() => {
        updateTask();
    })
}

const movedown = (uuid:string) => {
    emits('movedown', uuid)
    nextTick(() => {
        updateTask();
    })
}

const isFirst = (uuid:string) => util.isFirst(uuid)
const isLast = (uuid:string) => util.isLast(uuid)

const updateFields = () => {
    data.value.fields = [
        { title: 'ID', align: 'center', key: 'ID' },
        { title: i18n.global.t('headers.title'), align: 'center', key: 'title' },
        { title: i18n.global.t('headers.description'), align: 'center', key: 'description' },
        { title: i18n.global.t('headers.cronjob'), align: 'center', key: 'cronjob' },
        { title: i18n.global.t('headers.multi'), align: 'center', key: 'multi' },
        { title: i18n.global.t('headers.job-count'), align: 'center', key: 'jobCount' },
        { title: i18n.global.t('headers.detail'), align: 'center', key: 'detail' },
    ]
}

const updateLocate = () => {
    updateFields()
}

onMounted(() => {
    updateFields()
    emitter?.on('updateTask', updateTask)
    emitter?.on('updateLocate', updateLocate)
    data.value.para_keys = props.select?.parameter?.containers.filter(x => x.type == DataType.Number).map(x => x.name) ?? []
})

onUnmounted(() => {
    emitter?.off('updateTask', updateTask)
    emitter?.off('updateLocate', updateLocate)
})

</script>

<template>
    <div>
        <div class="py-3">
            <v-toolbar density="compact" class="pr-3">
                <v-text-field :style="{ 'fontSize': props.preference.font + 'px' }" max-width="400px" class="pl-5 mr-5" :placeholder="$t('search')" clearable density="compact" prepend-icon="mdi-magnify" hide-details single-line v-model="data.search"></v-text-field>
                <p v-if="props.select != undefined" class="mr-4">
                    {{ $t('project') }}: {{ props.select.title }}
                </p>
                <v-chip v-if="hasPara && props.select != undefined" prepend-icon="mdi-pen" @click="detailOpen" color="success">
                    {{ $t('parameter-setting') }}: {{ para_title }}
                </v-chip>
                <v-btn v-if="hasPara && props.select != undefined" variant="text" icon="mdi-select" @click="detailSelect"></v-btn>
                <v-chip v-if="!hasPara && props.select != undefined" prepend-icon="mdi-pen" @click="detailSelect" color="warning">
                    {{ $t('parameter-select') }}
                </v-chip>
                <v-spacer></v-spacer>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="createProject" :disabled="select == undefined">
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('create') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="selectall">
                            <v-icon>mdi-check-all</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('selectall') }}
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
        <div class="py-3">
            <v-data-table :headers="data.fields" :items="items_final" show-select v-model="data.selection" item-value="ID" :style="{ 'fontSize': props.preference.font + 'px' }">
                <template v-slot:item.ID="{ item }">
                    <a href="#" @click="datachoose(item.ID)">{{ item.ID }}</a>
                </template>
                <template v-slot:item.detail="{ item }">
                    <v-btn flat icon @click="datachoose(item.ID)" size="small">
                        <v-icon>mdi-location-enter</v-icon>
                    </v-btn>
                    <v-btn flat icon @click="dataedit(item.ID)" size="small">
                        <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn flat icon :disabled="isFirst(item.ID)" @click="moveup(item.ID)" size="small">
                        <v-icon>mdi-arrow-up</v-icon>
                    </v-btn>
                    <v-btn flat icon :disabled="isLast(item.ID)" @click="movedown(item.ID)" size="small">
                        <v-icon>mdi-arrow-down</v-icon>
                    </v-btn>
                </template>
                <template v-slot:item.cronjob="{ item }">
                    <v-chip :color="item.cronjob ? 'success' : 'error'">{{ item.cronjob || item.setupjob }}</v-chip>
                </template>
                <template v-slot:item.multi="{ item }">
                    <v-chip :color="item.multi ? 'success' : 'error'">{{ item.multi }}</v-chip>
                </template>
            </v-data-table>
        </div>
        <TaskDialog v-model="data.dialogModal" 
            :para_keys="data.para_keys"
            :is-edit="data.isEdit" 
            :error-message="data.errorMessage"
            :title-error="data.titleError"
            :edit-data="data.editData" 
            @submit="DialogSubmit" />
        <v-dialog width="500" v-model="data.deleteModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-pencil</v-icon>
                    {{ $t('modal.delete-task') }}
                </v-card-title>
                <v-card-text>
                    <p>{{ $t('modal.delete-task-confirm') }}</p>
                    <br />
                    <p v-for="(p, i) in data.deleteData">
                        {{ i }}. {{ p }}
                    </p>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" color="primary" @click="data.deleteModal = false">{{ $t('cancel') }}</v-btn>
                    <v-btn class="mt-3" color="error" @click="deleteConfirm">{{ $t('delete') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
        <v-dialog width="500" v-model="data.paraModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-pen</v-icon>
                    {{ $t('parameter-select') }}
                </v-card-title>
                <v-card-text>
                    <v-text-field :placeholder="$t('search')" clearable density="compact" prepend-icon="mdi-magnify" hide-details single-line v-model="data.selectSearch">
                    </v-text-field>
                    <v-list>
                        <v-list-item v-for="(p, i) in [{ title: 'None', uuid: '' }, ...props.parameters]" :key="i">
                            <v-list-item-title>
                                {{ p.title }}
                            </v-list-item-title>
                            <v-list-item-subtitle>
                                {{ p.uuid }}
                            </v-list-item-subtitle>
                            <template v-slot:append>
                                <v-btn color="grey-lighten-1" icon="mdi-arrow-right" variant="text" @click="selectParameter(p.uuid); data.paraModal = false"
                                ></v-btn>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<style scoped>
</style>
