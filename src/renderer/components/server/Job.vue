<script setup lang="ts">
import { v6 as uuidv6 } from 'uuid';
import { nextTick, onMounted, Ref, ref } from 'vue';
import { Job, JobTable, JobType, Project, Task } from '../../interface';

interface PROPS {
    projects: Array<Project>
    select: Task | undefined
}

const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'added', job:Job): void
    (e: 'delete', uuids:Array<string>): void
    (e: 'select', uuids:string): void
}>()
const hasSelect = ref(false)
const createModal = ref(false)
const createData = ref({type: JobType.COPY_DIR})
const items:Ref<Array<JobTable>> = ref([])
const fields:Ref<Array<string>> = ref([])
const types:Ref<Array<string>> = ref([])

const updateJob = () => {
    items.value = props.select?.jobs.map(x => {
        return {
            s: false,
            ID: x.uuid,
            type: x.type
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
            type: createData.value.type
        }
    )
    nextTick(() => {
        updateJob();
        createData.value = {type: JobType.COPY_DIR};
    })
}

onMounted(() => {
    fields.value = ['s', 'ID', 'type', 'detail']
    types.value = Object.keys(JobType).filter(key => isNaN(Number(key)))
    updateJob()
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
                當前選擇流程: {{ props.select.title }}
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
        <b-modal title="新增工作" v-model="createModal" hide-footer>
            <b-form-select v-model="createData.type" :options="types"></b-form-select>
            <b-button class="mt-3" variant="primary" @click="confirmCreate">新增</b-button>
        </b-modal>
    </div>
</template>

<style scoped>

</style>
