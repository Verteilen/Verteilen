<script setup lang="ts">
import { v6 as uuidv6 } from 'uuid';
import { nextTick, onMounted, Ref, ref } from 'vue';
import { Project, Task, TaskTable } from '../../interface';

interface PROPS {
    projects: Array<Project>
    select: Project | undefined
}

const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'added', task:Task): void
    (e: 'delete', uuids:Array<string>): void
    (e: 'select', uuids:string): void
}>()
const hasSelect = ref(false)
const createModal = ref(false)
const createData = ref({cronjob: false, title: "", description: ""})
const items:Ref<Array<TaskTable>> = ref([])
const fields:Ref<Array<string>> = ref([])

const updateTask = () => {
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
}

const createProject = () => {
    createModal.value = true
}

const cloneSelect = () => {
    
}

const deleteSelect = () => {
    
}

const datachange = (uuid:any, v:boolean) => {
    const index = items.value.findIndex(x => x.ID == uuid)
    if(index != -1) items.value[index].s = v
    hasSelect.value = items.value.filter(x => x.s).length > 0;
}

const datachoose = (uuid:string) => {
    emits('select', uuid)
}

const confirmCreate = () => {
    createModal.value = false
    emits('added', 
        { 
            uuid: uuidv6(),
            title: createData.value.title, 
            description: createData.value.description,
            cronjob: createData.value.cronjob,
            jobs: []
        }
    )
    nextTick(() => {
        updateTask();
        createData.value = {cronjob: false, title: "", description: ""};
    })
}

onMounted(() => {
    fields.value = ['s', 'ID', 'cronjob', 'title', 'description', 'jobCount', 'detail']
    updateTask()
})

</script>

<template>
    <div>
        <div class="mt-3">
            <b-button-group>
                <b-button @click="createProject" :disabled="select == undefined">新增</b-button>
                <b-button @click="cloneSelect" :disabled="!hasSelect || select == undefined">克隆</b-button>
                <b-button @click="deleteSelect" :disabled="!hasSelect || select == undefined">刪除</b-button>
            </b-button-group>
        </div>
        <b-card ag="article" class="mb-2" v-if="props.select != undefined">
            <b-card-title>
                當前選擇專案: {{ props.select.title }}
            </b-card-title>
            <b-card-text>
                敘述: {{ props.select.description }}
            </b-card-text>
        </b-card>
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
        <b-modal title="新增流程" v-model="createModal" hide-footer>
            <b-form-input v-model="createData.title" required placeholder="輸入流程名稱"></b-form-input>
            <b-form-input class="mt-3" v-model="createData.description" placeholder="輸入流程敘述"></b-form-input>
            <b-form-checkbox size="lg" v-model="createData.cronjob">分散運算</b-form-checkbox>
            <b-button class="mt-3" variant="primary" @click="confirmCreate">新增</b-button>
        </b-modal>
    </div>
</template>

<style scoped>

</style>
