<script setup lang="ts">
//#region Modules
import { Emitter } from 'mitt';
import { computed, ComputedRef, inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, DataType, Preference, TaskTable } from '../../interface';
import { i18n } from '../../plugins/i18n';
import { CreateField, DATA, EmitType, PROPS, Util_Task } from './Task';
//#endregion

//#region Views
import { VueDraggableNext } from 'vue-draggable-next'
import TaskDialog from '../dialog/task/TaskDialog.vue';
import DatabaseSelectionDialog from '../dialog/DatabaseSelectionDialog.vue';
import ContextFrame from '../components/layout/ContextFrame.vue';
import DeleteDialog from '../dialog/DeleteDialog.vue';
//#endregion

//#region Data
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const preference:Ref<Preference> = inject("preference")!
const props = defineProps<PROPS>()
const emits = defineEmits<EmitType>()
const data:Ref<DATA> = ref({
    fields: [],
    itemPrePage: -1,
    paraModal: false,
    dialogModal: false,
    isEdit: false,
    editData: {cronjob: false, cronjobKey: "", title: "", description: "", setupjob: false, multi: false, multiKey: ""},
    editUUID: '',
    deleteModal: false,
    deleteData: [],
    errorMessage: '',
    titleError: false,
    search: '',
    selectSearch: '',
    selection: [],
})
//#endregion

//#region Computed
const hasPara = computed(() => {
    if(props.select == undefined || props.select.database_uuid.length == 0) return false
    return props.databases.find(x => x.uuid == props.select!.database_uuid) != undefined
})
const realSearch = computed(() => data.value.search?.trimStart().trimEnd() ?? '')
const items_final = computed(() => {
    let a = realSearch.value == null || 
        realSearch.value.length == 0 ? props.tasks : 
            props.tasks.filter(x => x.title.includes(realSearch.value) || x.uuid.slice(x.uuid.length - 12, x.uuid.length).includes(realSearch.value))
    return JSON.parse(JSON.stringify(a)) as TaskTable[]
})
const hasSelect = computed(() => data.value.selection.length > 0)
const selected_task_ids = computed(() => props.tasks.filter(x => data.value.selection.includes(x.uuid)).map(x => x.uuid))
const para_title = computed(() => props.databases.find(x => x.uuid == props.select?.database_uuid)?.title)
const para_keys:ComputedRef<Array<{ title:string, subtitle: string, value: string }>> = computed(() => {
    if(props.select == undefined) return []
    const p = props.databases.find(x => x.uuid == props.select!.database_uuid)
    return p?.containers.filter(x => {
        return x.type == DataType.Expression || x.type == DataType.Number
    }).map(x => ({
        title: x.name,
        subtitle: x.type == DataType.Expression ? i18n.global.t('types.expression') : i18n.global.t('types.number'),
        value: x.name
    })) ?? []
})
const tasks = computed(() => props.tasks)
const selected = computed(() => props.select)
const util:Util_Task = new Util_Task(data, emits, selected, tasks, selected_task_ids)
//#endregion

//#region Methods
const createProject = () => util.createProject()
const detailOpen = () => emits('database', props.select!.database_uuid)

const detailSelect = () => {
    data.value.paraModal = true
}

const selectall = () => data.value.selection = props.tasks.map(x => x.uuid)

const deleteSelect = () => {
    data.value.deleteData = selected_task_ids.value
    data.value.deleteModal = true
}

const deleteConfirm = () => {
    data.value.deleteModal = false
    data.value.selection = []
    emits('delete', data.value.deleteData)
}

const selectDatabase = (uuid:string) => {
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
        data.value.editData = {cronjob: false, cronjobKey: "", title: "", description: "", setupjob: false, multi: false, multiKey: ""};
    })
}

const confirmEdit = () => {
    const p = util.confirmEdit()
    if(p == undefined) return
    emits('edit', data.value.editUUID, p)
}

const TaskType = (item:TaskTable) => {
    if(!item.setupjob && !item.cronjob && !item.multi) return $t('singlejob')
    else if(item.setupjob && !item.cronjob && !item.multi) return $t('setupjob')
    else if(!item.setupjob && item.cronjob && !item.multi) return $t('cronjob')
    else return $t('multicore')
}
const TaskTypeColor = (item:TaskTable) => {
    if(!item.setupjob && !item.cronjob && !item.multi) return ''
    else if(item.setupjob && !item.cronjob && !item.multi) return 'warning'
    else if(!item.setupjob && item.cronjob && !item.multi) return 'info'
    else return 'success'
}

const updateFields = () => {
    data.value.fields = [
        { title: 'ID', align: 'center', key: 'ID', maxWidth: "20%", sortable: false },
        { title: $t('headers.title'), align: 'center', key: 'title', sortable: false },
        { title: $t('headers.description'), align: 'center', key: 'description', sortable: false },
        { title: $t('headers.type'), align: 'center', key: 'type', sortable: false },
        { title: $t('headers.job-count'), align: 'center', key: 'jobCount', minWidth: "150px", sortable: false },
        { title: $t('headers.detail'), align: 'center', key: 'detail', minWidth: "200px", sortable: false },
    ]
}

const updateLocate = () => {
    updateFields()
}

const goreturn = () => {
    emits('return')
}

const onHotkey = (value:string) => {
    if(value == 'create_task'){
        createProject()
    }
}
//#endregion

onMounted(() => {
    updateFields()
    emitter.on('hotkey', onHotkey)
    emitter.on('updateLocate', updateLocate)
})

onUnmounted(() => {
    emitter.off('hotkey', onHotkey)
    emitter.off('updateLocate', updateLocate)
})
</script>

<template>
    <ContextFrame>
        <template #toolbar>
            <v-toolbar density="compact" class="px-3">
                <v-btn size="sm" class="mr-2" variant="text" icon="mdi-chevron-left" @click="goreturn"></v-btn>
                <p v-if="props.select != undefined" class="mx-4">
                    {{ $t('project') }}: {{ props.select.title }}
                </p>
                <v-chip v-if="hasPara && props.select != undefined" prepend-icon="mdi-paperclip" @click="detailOpen" color="success">
                    {{ $t('database-setting') }}: {{ para_title }}
                </v-chip>
                <v-btn v-if="hasPara && props.select != undefined" variant="text" icon="mdi-select" @click="detailSelect"></v-btn>
                <v-chip v-if="!hasPara && props.select != undefined" prepend-icon="mdi-paperclip" @click="detailSelect" color="warning">
                    {{ $t('database-select') }}
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
                        <v-btn icon v-bind="props" @click="util.cloneSelect" :disabled="!hasSelect || select == undefined">
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
            <TaskDialog v-model="data.dialogModal" 
                :para_keys="para_keys"
                :is-edit="data.isEdit" 
                :error-message="data.errorMessage"
                :title-error="data.titleError"
                :edit-data="data.editData" 
                :preference="preference"
                @submit="DialogSubmit" />
            <DatabaseSelectionDialog v-model="data.paraModal" 
                :items="props.databases"
                :preference="preference"
                @select_uuid="selectDatabase" />
            <DeleteDialog v-model="data.deleteModal"
                :title="$t('modal.delete-task')"
                :text="$t('modal.delete-task-confirm')"
                :data="data.deleteData"
                @cancel="data.deleteModal = false"
                @delete="deleteConfirm"/>
        </template>
        <v-data-table v-model="data.selection" show-select 
            class="px-6"
            style="background: transparent" 
            :style="{ 'fontSize': preference.font + 'px' }"
            :headers="data.fields" 
            :items-per-page="data.itemPrePage" 
            item-value="uuid"
            hide-default-footer
            :items="items_final" 
        >
            <template #body="props"></template>
            <template #tbody="props">
                <VueDraggableNext v-model="items_final" tag="tbody">
                    <v-data-table-row v-for="(item, index) in props.internalItems"
                        :key="index"
                        :item="item"
                        :index="index"
                        :cell-props="props"
                    >
                        <template v-slot:item.ID="{ item }">
                            <a href="#" @click="util.dataChoose(item.uuid)">{{ item.uuid.slice(item.uuid.length - 12, item.uuid.length) }}</a>
                        </template>
                        <template v-slot:item.detail="{ item }">
                            <v-btn variant="text" icon @click="util.dataEdit(item.uuid)" size="small">
                                <v-icon>mdi-pencil</v-icon>
                            </v-btn>
                            <v-btn variant="text" icon :disabled="util.isFirst(item.uuid) || util.isSort()" @click="util.moveUp(item.uuid)" size="small">
                                <v-icon>mdi-arrow-up</v-icon>
                            </v-btn>
                            <v-btn variant="text" icon :disabled="util.isLast(item.uuid) || util.isSort()" @click="util.moveDown(item.uuid)" size="small">
                                <v-icon>mdi-arrow-down</v-icon>
                            </v-btn>
                        </template>
                        <template v-slot:item.type="{ item }">
                            <v-chip :color="TaskTypeColor(item)">{{ TaskType(item) }}</v-chip>
                        </template>
                    </v-data-table-row>
                </VueDraggableNext>
            </template>
        </v-data-table>
    </ContextFrame>
</template>

<style scoped>
</style>
