<script setup lang="ts">
import { Emitter } from 'mitt';
import { v6 as uuidv6 } from 'uuid';
import { inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, Project, ProjectTable } from '../../interface';

interface PROPS {
    projects: Array<Project>
}

const emitter:Emitter<BusType> | undefined = inject('emitter');

const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'added', projects:Project): void
    (e: 'delete', uuids:Array<string>): void
    (e: 'select', uuids:string): void
    (e: 'execute', uuids:Array<string>, force:boolean): void
}>()
const items:Ref<Array<ProjectTable>> = ref([])
const fields:Ref<Array<string>> = ref([])
const createModal = ref(false)
const createData = ref({title: "", description: ""})
const hasSelect = ref(false)

const updateProject = () => {
    items.value = props.projects.map(x => {
        return {
            s: false,
            ID: x.uuid,
            title: x.title,
            description: x.description,
            taskCount: x.task.length
        }
    })
}

const createProject = () => {
    createModal.value = true
}

const datachange = (uuid:any, v:boolean) => {
    const index = items.value.findIndex(x => x.ID == uuid)
    if(index != -1) items.value[index].s = v
    hasSelect.value = items.value.filter(x => x.s).length > 0;
}

const datachoose = (uuid:string) => {
    emits('select', uuid)
}

const deleteSelect = () => {
    emits('delete', items.value.filter(x => x.s).map(x => x.ID))
    nextTick(() => {
        updateProject()
        hasSelect.value = items.value.filter(x => x.s).length > 0;
    })
}

const cloneSelect = () => {

}

const execute = (force:boolean) => {
    emits('execute', items.value.filter(x => x.s).map(x => x.ID), force)
}

const confirmCreate = () => {
    createModal.value = false
    emits('added', 
        { 
            uuid: uuidv6(),
            title: createData.value.title, 
            description: createData.value.description,
            task: []
        }
    )
    nextTick(() => {
        updateProject();
        createData.value = {title: "", description: ""};
    })
}

emitter?.on('updateProject', updateProject)
emitter?.on('createProject', createProject)

onMounted(() => {
    fields.value = ['s', 'ID', 'title', 'description', 'taskCount', 'detail']
    updateProject()
    window.electronAPI.eventOn('createProject', createProject)
})

onUnmounted(() => {
    window.electronAPI.eventOff('createProject', createProject)
})

</script>

<template>
    <div>
        <div class="mt-3">
            <b-button-group>
                <b-button @click="createProject">新增</b-button>
                <b-button @click="cloneSelect" :disabled="!hasSelect">克隆</b-button>
                <b-button @click="deleteSelect" :disabled="!hasSelect">刪除</b-button>
                <b-button @click="execute(false)" :disabled="!hasSelect">執行</b-button>
                <b-button @click="execute(true)" :disabled="!hasSelect">強制執行</b-button>
            </b-button-group>
        </div>
        <div>
            <b-table striped hover :items="items" :fields="fields">
                <template #cell(s)="data">
                    <b-form-checkbox style="float:right;" size="lg" v-model="data.s" @change="v => datachange(data.item.ID, v)"></b-form-checkbox>
                </template>
                <template #cell(detail)="data">
                    <b-dropdown text="動作" class="m-md-2">
                        <b-dropdown-item @click="datachoose(data.item.ID)">查看</b-dropdown-item>
                        <b-dropdown-divider></b-dropdown-divider>
                        <b-dropdown-item>往上移動</b-dropdown-item>
                        <b-dropdown-item>往下移動</b-dropdown-item>
                    </b-dropdown>
                </template>
            </b-table>
        </div>
        <b-modal title="新增專案" v-model="createModal" hide-footer>
            <b-form-input v-model="createData.title" required placeholder="輸入專案名稱"></b-form-input>
            <b-form-input class="mt-3" v-model="createData.description" placeholder="輸入專案敘述"></b-form-input>
            <b-button class="mt-3" variant="primary" @click="confirmCreate">新增</b-button>
        </b-modal>
    </div>
</template>

<style scoped>

</style>
