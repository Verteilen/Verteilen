<script setup lang="ts">
import { Emitter } from 'mitt';
import { v6 as uuidv6 } from 'uuid';
import { inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, Project, Task, TaskTable } from '../../interface';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
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
const hasSelect = ref(false)
const createModal = ref(false)
const createData = ref({cronjob: false, cronjobKey: "", title: "", description: "", multi: false, multiKey: ""})
const editModal = ref(false)
const editUUID = ref('')
const items:Ref<Array<TaskTable>> = ref([])
const fields:Ref<Array<string>> = ref([])
const para_keys:Ref<Array<string>> = ref([])

const updateTask = () => {
    const old:Array<TaskTable> = Object.create(items.value)
    items.value = props.select?.task.map(x => {
        return {
            s: false,
            ID: x.uuid,
            cronjob: x.cronjob,
            title: x.title,
            description: x.description,
            jobCount: x.jobs.length
        }
    }) ?? []
    const ids = old.filter(x => x.s).map(x => x.ID)
    items.value.filter(x => ids.includes(x.ID)).forEach(x => x.s = true)
}

const updateParameter = () => {
    para_keys.value = props.select?.parameter.numbers.map(x => x.name) ?? []
}

const createProject = () => {
    createModal.value = true
}

const detailOpen = () => {
    emits('parameter')
}

const cloneSelect = () => {
    if(props.select == undefined) return
    const selectpt = items.value.filter(x => x.s).map(x => x.ID)
    const ts = props.select.task.filter(x => selectpt.includes(x.uuid)).map(y => Object.create(y))
    ts.forEach(x => {
        x.uuid = uuidv6()
        x.title = x.title + " (克隆)"
    })
    emits('added', ts)
    nextTick(() => {
        updateTask();
    })
}

const deleteSelect = () => {
    emits('delete', items.value.filter(x => x.s).map(x => x.ID))
    nextTick(() => {
        updateTask()
        hasSelect.value = items.value.filter(x => x.s).length > 0;
    })
}

const datachange = (uuid:any, v:boolean) => {
    const index = items.value.findIndex(x => x.ID == uuid)
    if(index != -1) items.value[index].s = v
    hasSelect.value = items.value.filter(x => x.s).length > 0;
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
}

const confirmCreate = () => {
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
            jobs: []
        }]
    )
    nextTick(() => {
        updateTask();
        createData.value = {cronjob: false, cronjobKey: "", title: "", description: "", multi: false, multiKey: ""};
    })
}

const confirmEdit = () => {
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
            multi: selectp.multi, 
            multiKey: selectp.multiKey,
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

onMounted(() => {
    fields.value = ['ID', 'cronjob', 'title', 'description', 'jobCount', 'detail']
    emitter?.on('updateTask', updateTask)
    emitter?.on('updateParameter', updateParameter)
    para_keys.value = props.select?.parameter.numbers.map(x => x.name) ?? []
})

onUnmounted(() => {
    emitter?.off('updateTask', updateTask)
    emitter?.off('updateParameter', updateParameter)
})

</script>

<template>
    <div>
        <div class="py-3">
            <b-button-group>
                <b-button variant='primary' @click="createProject" :disabled="select == undefined">{{ $t('create') }}</b-button>
                <b-button variant='primary' @click="cloneSelect" :disabled="!hasSelect || select == undefined">{{ $t('clone') }}</b-button>
                <b-button variant='danger' @click="deleteSelect" :disabled="!hasSelect || select == undefined">{{ $t('delete') }}</b-button>
            </b-button-group>
        </div>
        <b-card dark no-body ag="article" bg-variant="dark" border-variant="primary" class="text-white my-3 w-50" style="margin-left: 25%;" v-if="props.select != undefined">
            <b-card-title>
                當前選擇專案: {{ props.select.title }}
            </b-card-title>
            <b-card-text>
                敘述: {{ props.select.description }}
            </b-card-text>
            <b-button variant="primary" @click="detailOpen">{{ $t('parameter-setting') }}</b-button>
        </b-card>
        <b-table dark striped hover :items="items" :fields="fields">
            <template #cell(ID)="data">
                <b-row>
                    <b-col cols="1">
                        <b-form-checkbox style="float:left; width:15px" v-model="data.s" @change="(v: boolean) => datachange(data.item.ID, v)"></b-form-checkbox>
                    </b-col>
                    <b-col>
                        <a href="#" @click="datachoose(data.item.ID)">{{ data.item.ID }}</a>
                    </b-col>
                </b-row>
            </template>
            <template #cell(detail)="data">
                <b-dropdown :text="$t('action')" class="text-white m-md-2">
                    <b-dropdown-item @click="datachoose(data.item.ID)">查看</b-dropdown-item>
                    <b-dropdown-item @click="dataedit(data.item.ID)">編輯</b-dropdown-item>
                    <b-dropdown-divider></b-dropdown-divider>
                    <b-dropdown-item :disabled="isFirst(data.item.ID)" @click="moveup(data.item.ID)">{{ $t('moveup') }}</b-dropdown-item>
                    <b-dropdown-item :disabled="isLast(data.item.ID)" @click="movedown(data.item.ID)">{{ $t('movedown') }}</b-dropdown-item>
                </b-dropdown>
            </template>
        </b-table>
        <b-modal title="新增流程" v-model="createModal" hide-footer class="text-white" header-bg-variant="dark" header-text-variant="light" body-bg-variant="dark" body-text-variant="light" footer-text-variant="dark" footer-body-variant="light">
            <v-text-field v-model="createData.title" required label="輸入流程名稱" hide-details></v-text-field>
            <v-text-field class="mt-3" v-model="createData.description" label="輸入流程敘述" hide-details></v-text-field>
            <hr />
            <b-form-checkbox v-model="createData.cronjob">分散運算</b-form-checkbox>
            <b-form-select class="mt-3" v-if="createData.cronjob" v-model="createData.cronjobKey" :options="para_keys"></b-form-select>
            <b-button class="mt-3" variant="primary" @click="confirmCreate">新增</b-button>
        </b-modal>
        <b-modal title="編輯流程" v-model="editModal" hide-footer class="text-white" header-bg-variant="dark" header-text-variant="light" body-bg-variant="dark" body-text-variant="light" footer-text-variant="dark" footer-body-variant="light">
            <v-text-field v-model="createData.title" required label="輸入流程名稱" hide-details></v-text-field>
            <v-text-field class="mt-3" v-model="createData.description" label="輸入流程敘述" hide-details></v-text-field>
            <hr />
            <b-form-checkbox v-model="createData.cronjob">分散運算</b-form-checkbox>
            <b-form-select class="mt-3" v-if="createData.cronjob" v-model="createData.cronjobKey" :options="para_keys"></b-form-select>
            <b-button class="mt-3" variant="primary" @click="confirmEdit">修改</b-button>
        </b-modal>
    </div>
</template>

<style scoped>

</style>
