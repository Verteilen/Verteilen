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
    (e: 'added', project:Project[]): void
    (e: 'edit', uuid:string, project:Project): void
    (e: 'delete', uuids:Array<string>): void
    (e: 'select', uuids:string): void
    (e: 'execute', uuids:Array<string>, force:boolean): void
    (e: 'moveup', uuids:string): void
    (e: 'movedown', uuids:string): void
}>()
const items:Ref<Array<ProjectTable>> = ref([])
const fields:Ref<Array<string>> = ref([])
const createModal = ref(false)
const createData = ref({title: "", description: ""})
const hasSelect = ref(false)
const editModal = ref(false)
const editUUID = ref('')

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
    createData.value = {title: "", description: ""};
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

const dataedit = (uuid:string) => {
    const selectp = props.projects.find(x => x.uuid == uuid)
    if(selectp == undefined) return;
    createData.value = {title: selectp.title, description: selectp.description};
    editModal.value = true;
    editUUID.value = uuid;
}

const deleteSelect = () => {
    emits('delete', items.value.filter(x => x.s).map(x => x.ID))
    nextTick(() => {
        updateProject()
        hasSelect.value = items.value.filter(x => x.s).length > 0;
    })
}

const cloneSelect = () => {
    const selectps = items.value.filter(x => x.s).map(x => x.ID)
    const ps = props.projects.filter(x => selectps.includes(x.uuid)).map(y => Object.create(y))
    ps.forEach(x => {
        x.uuid = uuidv6()
        x.title = x.title + " (克隆)"
    })
    emits('added', ps)
    nextTick(() => {
        updateProject();
    })
}

const execute = (force:boolean) => {
    emits('execute', items.value.filter(x => x.s).map(x => x.ID), force)
}

const confirmCreate = () => {
    createModal.value = false
    emits('added', 
        [{ 
            uuid: uuidv6(),
            title: createData.value.title, 
            description: createData.value.description,
            parameter: {
                numbers: [],
                strings: [],
                booleans: []
            },
            task: []
        }]
    )
    nextTick(() => {
        updateProject();
    })
}

const confirmEdit = () => {
    const selectp = props.projects.find(x => x.uuid == editUUID.value)
    if(selectp == undefined) return;
    editModal.value = false
    emits('edit', 
        editUUID.value,
        { 
            uuid: editUUID.value,
            title: createData.value.title, 
            description: createData.value.description,
            parameter: selectp.parameter,
            task: selectp.task
        }
    )
    nextTick(() => {
        updateProject();
    })
}

const moveup = (uuid:string) => {
    emits('moveup', uuid)
    nextTick(() => {
        updateProject();
    })
}

const movedown = (uuid:string) => {
    emits('movedown', uuid)
    nextTick(() => {
        updateProject();
    })
}

const isFirst = (uuid:string) => {
    const index = props.projects.findIndex(x => x.uuid == uuid)
    return index <= 0
}

const isLast = (uuid:string) => {
    const index = props.projects.findIndex(x => x.uuid == uuid)
    if(index == -1) return true
    return index == props.projects.length - 1
}

onMounted(() => {
    fields.value = ['ID', 'title', 'description', 'taskCount', 'detail']
    updateProject()
    window.electronAPI.eventOn('createProject', createProject)

    emitter?.on('updateProject', updateProject)
    emitter?.on('createProject', createProject)
})

onUnmounted(() => {
    window.electronAPI.eventOff('createProject', createProject)

    emitter?.off('updateProject', updateProject)
    emitter?.off('createProject', createProject)
})

</script>

<template>
    <div>
        <div class="my-3">
            <b-button-group>
                <b-button variant='primary' @click="createProject">新增</b-button>
                <b-button variant='primary' @click="cloneSelect" :disabled="!hasSelect">克隆</b-button>
                <b-button variant='danger' @click="deleteSelect" :disabled="!hasSelect">刪除</b-button>
                <b-button @click="execute(false)" :disabled="!hasSelect">執行</b-button>
                <b-button @click="execute(true)" :disabled="!hasSelect">強制執行</b-button>
            </b-button-group>
        </div>
        <div>
            <b-table striped hover :items="items" :fields="fields">
                <template #cell(ID)="data">
                    <b-row>
                        <b-col cols="1">
                            <b-form-checkbox style="float:left; width:15px" v-model="data.s" @change="v => datachange(data.item.ID, v)"></b-form-checkbox>
                        </b-col>
                        <b-col>
                            <a href="#" @click="datachoose(data.item.ID)">{{ data.item.ID }}</a>
                        </b-col>
                    </b-row>
                </template>
                <template #cell(detail)="data">
                    <b-dropdown text="動作" class="m-md-2">
                        <b-dropdown-item @click="datachoose(data.item.ID)">查看</b-dropdown-item>
                        <b-dropdown-item @click="dataedit(data.item.ID)">編輯</b-dropdown-item>
                        <b-dropdown-divider></b-dropdown-divider>
                        <b-dropdown-item :disabled="isFirst(data.item.ID)" @click="moveup(data.item.ID)">往上移動</b-dropdown-item>
                        <b-dropdown-item :disabled="isLast(data.item.ID)" @click="movedown(data.item.ID)">往下移動</b-dropdown-item>
                    </b-dropdown>
                </template>
            </b-table>
        </div>
        <b-modal title="新增專案" v-model="createModal" hide-footer>
            <b-form-input v-model="createData.title" required placeholder="輸入專案名稱"></b-form-input>
            <b-form-input class="mt-3" v-model="createData.description" placeholder="輸入專案敘述"></b-form-input>
            <b-button class="mt-3" variant="primary" @click="confirmCreate">新增</b-button>
        </b-modal>
        <b-modal title="編輯專案" v-model="editModal" hide-footer>
            <b-form-input v-model="createData.title" required placeholder="輸入專案名稱"></b-form-input>
            <b-form-input class="mt-3" v-model="createData.description" placeholder="輸入專案敘述"></b-form-input>
            <b-button class="mt-3" variant="primary" @click="confirmEdit">修改</b-button>
        </b-modal>
    </div>
</template>

<style scoped>

</style>
