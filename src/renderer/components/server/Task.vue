<script setup lang="ts">
import { Emitter } from 'mitt';
import { v6 as uuidv6 } from 'uuid';
import { computed, inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, DataType, Preference, Project, Task, TaskTable } from '../../interface';
import { i18n } from '../../plugins/i18n';
import { DATA } from '../../util/Task';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    preference: Preference
    projects: Array<Project>
    select: Project | undefined
}

const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'added', task:Task[]): void
    (e: 'edit', uuid:string, task:Task): void
    (e: 'delete', uuids:Array<string>): void
    (e: 'select', uuids:string): void
    (e: 'parameter'):void
    (e: 'moveup', uuids:string): void
    (e: 'movedown', uuids:string): void
}>()
const data:Ref<DATA> = ref({
    fields: [],
    dialogModal: false,
    isEdit: false,
    createData: {cronjob: false, cronjobKey: "", title: "", description: "", multi: false, multiKey: ""},
    editUUID: '',
    deleteModal: false,
    deleteData: [],
    items: [],
    para_keys: [],
    errorMessage: '',
    titleError: false,
    search: '',
    selection: []
})
const createModal = ref(false)
const createData = ref({cronjob: false, cronjobKey: "", title: "", description: "", multi: false, multiKey: ""})
const editModal = ref(false)
const editUUID = ref('')
const deleteModal = ref(false)
const deleteData:Ref<Array<string>> = ref([])
const items:Ref<Array<TaskTable>> = ref([])
const para_keys:Ref<Array<string>> = ref([])
const errorMessage = ref('')
const titleError = ref(false)
const search = ref('')
const selection:Ref<Array<string>> = ref([])

const realSearch = computed(() => data.value.search.trimStart().trimEnd())
const items_final = computed(() => {
    return realSearch.value == null || realSearch.value.length == 0 ? items.value : items.value.filter(x => x.title.includes(realSearch.value) || x.ID.includes(realSearch.value))
})
const hasSelect = computed(() => selection.value.length > 0)
const selected_task_ids = computed(() => items.value.filter(x => selection.value.includes(x.ID)).map(x => x.ID))

const updateTask = () => {
    items.value = props.select?.task.map(x => {
        return {
            s: false,
            ID: x.uuid,
            cronjob: x.cronjob,
            multi: x.multi,
            title: x.title,
            description: x.description,
            jobCount: x.jobs.length
        }
    }) ?? []
    const allid = items.value.map(x => x.ID)
    selection.value = selection.value.filter(x => allid.includes(x))
}

const updateParameter = () => {
    para_keys.value = props.select?.parameter.containers.filter(x => x.type == DataType.Number).map(x => x.name) ?? []
}

const createProject = () => {
    createData.value = {cronjob: false, cronjobKey: para_keys.value[0], title: "", description: "", multi: false, multiKey: para_keys.value[0]}
    createModal.value = true
    errorMessage.value = ''
    titleError.value = false
}

const detailOpen = () => {
    emits('parameter')
}

const cloneSelect = () => {
    if(props.select == undefined) return
    const ts:Array<Task> = props.select.task.filter(x => selected_task_ids.value.includes(x.uuid)).map(y => JSON.parse(JSON.stringify(y)))
    ts.forEach(x => {
        x.uuid = uuidv6()
        x.title = x.title + ` (${i18n.global.t('clone')})`
        x.jobs.forEach(y => {
            y.uuid = uuidv6()
        })
    })
    emits('added', ts)
    nextTick(() => {
        updateTask();
    })
}

const selectall = () => {
    selection.value = items.value.map(x => x.ID)
}

const deleteSelect = () => {
    deleteData.value = selected_task_ids.value
    deleteModal.value = true
}

const deleteConfirm = () => {
    deleteModal.value = false
    emits('delete', deleteData.value)
    nextTick(() => {
        updateTask()
    })
}

const datachoose = (uuid:string) => {
    emits('select', uuid)
}

const dataedit = (uuid:string) => {
    if(props.select == undefined) return
    const selectp = props.select.task.find(x => x.uuid == uuid)
    if(selectp == undefined) return;
    createData.value = {
        cronjob: selectp.cronjob, 
        cronjobKey: selectp.cronjobKey, 
        title: selectp.title, 
        description: selectp.description, 
        multi: selectp.multi, 
        multiKey: selectp.multiKey
    };
    editModal.value = true;
    editUUID.value = uuid;
    errorMessage.value = ''
    titleError.value = false
}

const confirmCreate = () => {
    if(createData.value.title.length == 0){
        errorMessage.value = i18n.global.t('error.title-needed')
        titleError.value = true
        return
    }
    createModal.value = false
    emits('added', 
        [{ 
            uuid: uuidv6(),
            title: createData.value.title, 
            description: createData.value.description,
            cronjob: createData.value.cronjob,
            cronjobKey: createData.value.cronjobKey,
            multi: createData.value.multi, 
            multiKey: createData.value.multiKey,
            properties: [],
            jobs: []
        }]
    )
    nextTick(() => {
        updateTask();
        createData.value = {cronjob: false, cronjobKey: "", title: "", description: "", multi: false, multiKey: ""};
    })
}

const confirmEdit = () => {
    if(createData.value.title.length == 0){
        errorMessage.value = i18n.global.t('error.title-needed')
        titleError.value = true
        return
    }
    if(props.select == undefined) return
    const selectp = props.select.task.find(x => x.uuid == editUUID.value)
    if(selectp == undefined) return;
    editModal.value = false
    emits('edit', 
        editUUID.value,
        { 
            uuid: editUUID.value,
            title: createData.value.title, 
            description: createData.value.description,
            cronjob: createData.value.cronjob,
            cronjobKey: createData.value.cronjobKey,
            multi: createData.value.multi, 
            multiKey: createData.value.multiKey,
            properties: selectp.properties,
            jobs: selectp.jobs
        }
    )
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

const isFirst = (uuid:string) => {
    if(props.select == undefined) return
    const index = props.select.task.findIndex(x => x.uuid == uuid)
    return index <= 0
}

const isLast = (uuid:string) => {
    if(props.select == undefined) return
    const index = props.select.task.findIndex(x => x.uuid == uuid)
    if(index == -1) return true
    return index == props.select.task.length - 1
}

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
    emitter?.on('updateParameter', updateParameter)
    emitter?.on('updateLocate', updateLocate)
    para_keys.value = props.select?.parameter.containers.filter(x => x.type == DataType.Number).map(x => x.name) ?? []
})

onUnmounted(() => {
    emitter?.off('updateTask', updateTask)
    emitter?.off('updateParameter', updateParameter)
    emitter?.off('updateLocate', updateLocate)
})

</script>

<template>
    <div>
        <div class="py-3">
            <v-toolbar density="compact" class="pr-3">
                <v-text-field :style="{ 'fontSize': props.preference.font + 'px' }" max-width="400px" class="pl-5 mr-5" :placeholder="$t('search')" clearable density="compact" prepend-icon="mdi-magnify" hide-details single-line v-model="search"></v-text-field>
                <p v-if="props.select != undefined" class="mr-4">
                    {{ $t('project') }}: {{ props.select.title }}
                </p>
                <v-chip v-if="props.select != undefined" prepend-icon="mdi-pen" @click="detailOpen" color="success">
                    {{ $t('parameter-setting') }}
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
            <v-data-table :headers="data.fields" :items="items_final" show-select v-model="selection" item-value="ID" :style="{ 'fontSize': props.preference.font + 'px' }">
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
                    <v-chip :color="item.cronjob ? 'success' : 'error'">{{ item.cronjob }}</v-chip>
                </template>
                <template v-slot:item.multi="{ item }">
                    <v-chip :color="item.multi ? 'success' : 'error'">{{ item.multi }}</v-chip>
                </template>
            </v-data-table>
        </div>
        <v-dialog width="500" v-model="createModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-hammer</v-icon>
                    {{ $t('modal.new-task') }}
                </v-card-title>
                <v-card-text>
                    <v-text-field :error="titleError" v-model="createData.title" required :label="$t('modal.enter-task-name')" hide-details></v-text-field>
                    <v-text-field class="mt-3" v-model="createData.description" :label="$t('modal.enter-task-description')" hide-details></v-text-field>
                    <br />
                    <v-checkbox v-model="createData.cronjob" :label="$t('cronjob')" hide_details></v-checkbox>
                    <v-select v-if="createData.cronjob" v-model="createData.cronjobKey" :items="para_keys" hide-details></v-select>
                    <br />
                    <v-checkbox v-if="createData.cronjob" v-model="createData.multi" :label="$t('multicore')" hide_details></v-checkbox>
                    <v-select v-if="createData.cronjob && createData.multi" v-model="createData.multiKey" :items="para_keys" hide-details></v-select>
                    <p v-if="errorMessage.length > 0" class="mt-3 text-red">{{ errorMessage }}</p>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" color="primary" @click="confirmCreate">{{ $t('create') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
        <v-dialog width="500" v-model="editModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-pencil</v-icon>
                    {{ $t('modal.modify-task') }}
                </v-card-title>
                <v-card-text>
                    <v-text-field :error="titleError" v-model="createData.title" required :label="$t('modal.enter-task-name')" hide-details></v-text-field>
                    <v-text-field class="mt-3" v-model="createData.description" :label="$t('modal.enter-task-description')" hide-details></v-text-field>
                    <br />
                    <v-checkbox v-model="createData.cronjob" :label="$t('cronjob')" hide_details></v-checkbox>
                    <v-select class="my-3" v-if="createData.cronjob" v-model="createData.cronjobKey" :items="para_keys" hide-details></v-select>
                    <br />
                    <v-checkbox v-if="createData.cronjob" v-model="createData.multi" :label="$t('multicore')" hide_details></v-checkbox>
                    <v-select class="my-3" v-if="createData.multi" v-model="createData.multiKey" :items="para_keys" hide-details></v-select>
                    <p v-if="errorMessage.length > 0" class="mt-3 text-red">{{ errorMessage }}</p>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" color="primary" @click="confirmEdit">{{ $t('modify') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
        <v-dialog width="500" v-model="deleteModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-pencil</v-icon>
                    {{ $t('modal.delete-task') }}
                </v-card-title>
                <v-card-text>
                    <p>{{ $t('modal.delete-task-confirm') }}</p>
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
