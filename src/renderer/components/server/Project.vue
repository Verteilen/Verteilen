<script setup lang="ts">
import { Emitter } from 'mitt';
import { v6 as uuidv6 } from 'uuid';
import { inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, Project, ProjectTable, ProjectTemplate, ProjectTemplateText } from '../../interface';
import { isElectron } from '../../main';
import { i18n } from '../../plugins/i18n';
import { GetDefaultProjectTemplate, GetFUNIQUE_GS4ProjectTemplate } from '../../template/projectTemplate';

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
const fields:Ref<Array<string>> = ref(['ID', 'title', 'description', 'taskCount', 'detail'])
const createModal = ref(false)
const createData = ref({title: "", description: "", useTemp: false, temp: 0})
const hasSelect = ref(false)
const temps:Ref<Array<{ text: string, value:number }>> = ref([])
const editModal = ref(false)
const editUUID = ref('')

const updateProject = () => {
    const old:Array<ProjectTable> = Object.create(items.value)
    items.value = props.projects.map(x => {
        return {
            s: false,
            ID: x.uuid,
            title: x.title,
            description: x.description,
            taskCount: x.task.length
        }
    })
    const ids = old.filter(x => x.s).map(x => x.ID)
    items.value.filter(x => ids.includes(x.ID)).forEach(x => x.s = true)
}

const recoverProject = (p:Project) => {
    emits('added', [p])
    items.value.forEach(x => {
        datachange(x.ID, false)
    })
}

const createProject = () => {
    createData.value = {title: "", description: "", useTemp: false, temp: 0};
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
    createData.value = {title: selectp.title, description: selectp.description, useTemp: false, temp: 0};
    editModal.value = true;
    editUUID.value = uuid;
}

const dataexport = (uuid:string) => {
    if(!isElectron) return
    const p = props.projects.find(x => x.uuid == uuid)
    if(p != undefined)
    window.electronAPI.send('export_project', JSON.stringify(p))
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
    const ps:Array<Project> = props.projects.filter(x => selectps.includes(x.uuid)).map(y => JSON.parse(JSON.stringify(y)))
    ps.forEach(x => {
        x.uuid = uuidv6()
        x.title = x.title + " (克隆)"
        x.task.forEach(y => {
            y.uuid = uuidv6()
            y.jobs.forEach(z => {
                z.uuid = uuidv6()
            })
        })
    })
    emits('added', ps)
    nextTick(() => {
        updateProject();
    })
    items.value.forEach(x => {
        datachange(x.ID, false)
    })
}

const execute = (keep:boolean) => {
    emits('execute', items.value.filter(x => x.s).map(x => x.ID), keep)
    items.value.forEach(x => {
        datachange(x.ID, false)
    })
}

const confirmCreate = () => {
    createModal.value = false
    let buffer:Project = { 
        uuid: uuidv6(),
        title: createData.value.title, 
        description: createData.value.description,
        parameter: {
            numbers: [],
            strings: [],
            booleans: []
        },
        task: [

        ]
    }
    if (createData.value.useTemp && createData.value.temp == ProjectTemplate.DEFAULT){
        buffer = GetDefaultProjectTemplate(buffer)
    }
    else if (createData.value.useTemp && createData.value.temp == ProjectTemplate.FUNIQUE_GS4){
        buffer = GetFUNIQUE_GS4ProjectTemplate(buffer)
    }
    emits('added', 
        [buffer]
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

const ProjectTemplateTranslate = (t:number):string => {
    return i18n.global.t(ProjectTemplateText[t])
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

const updateLocate = () => {
    temps.value = Object.keys(ProjectTemplate).filter(key => isNaN(Number(key))).map((x, index) => {
        return {
            text: ProjectTemplateTranslate(index as ProjectTemplate),
            value: index
        }
    })
}

onMounted(() => {
    updateLocate()
    updateProject()
    emitter?.on('updateProject', updateProject)
    emitter?.on('recoverProject', recoverProject)
    emitter?.on('createProject', createProject)
    emitter?.on('updateLocate', updateLocate)
    if(!isElectron) return
    window.electronAPI.eventOn('createProject', createProject)
})

onUnmounted(() => {
    emitter?.off('updateProject', updateProject)
    emitter?.off('recoverProject', recoverProject)
    emitter?.off('createProject', createProject)
    emitter?.off('updateLocate', updateLocate)
    if(!isElectron) return
    window.electronAPI.eventOff('createProject', createProject)
})

</script>

<template>
    <div>
        <div class="py-3">
            <b-button-group>
                <b-button variant='primary' @click="createProject">{{ $t('create') }}</b-button>
                <b-button variant='primary' @click="cloneSelect" :disabled="!hasSelect">{{ $t('clone') }}</b-button>
                <b-button variant='danger' @click="deleteSelect" :disabled="!hasSelect">{{ $t('delete') }}</b-button>
                <b-button @click="execute(false)" :disabled="!hasSelect">{{ $t('execute') }}</b-button>
                <b-button @click="execute(true)" :disabled="!hasSelect">{{ $t('execute-keep') }}</b-button>
            </b-button-group>
        </div>
        <div>
            <b-table dark striped hover :items="items" :fields="fields">
                <template #head(ID)="data">
                    <v-tooltip location="top">
                        <template v-slot:activator="{ props }">
                            <span v-bind="props">ID</span>
                        </template>
                        <p class="text-body-1 text-indigo-darken-4">{{ $t('tooltip.project-id') }}</p>
                    </v-tooltip>
                </template>
                <template #head(taskCount)="data">
                    <v-tooltip location="top">
                        <template v-slot:activator="{ props }">
                            <span v-bind="props">TaskCount</span>
                        </template>
                        <p class="text-body-1 text-indigo-darken-4">{{ $t('tooltip.project-taskCount') }}</p>
                    </v-tooltip>
                </template>
                <template #cell(ID)="data">
                    <b-row>
                        <b-col cols="1">
                            <b-form-checkbox style="float:left; width:15px" v-model="data.item.s" @change="(v: boolean) => datachange(data.item.ID, v)"></b-form-checkbox>
                        </b-col>
                        <b-col>
                            <a href="#" @click="datachoose(data.item.ID)">{{ data.item.ID }}</a>
                        </b-col>
                    </b-row>
                </template>
                <template #cell(detail)="data">
                    <b-dropdown :text="$t('action')" class="text-white m-md-2">
                        <b-dropdown-item @click="datachoose(data.item.ID)">{{ $t('check') }}</b-dropdown-item>
                        <b-dropdown-item @click="dataedit(data.item.ID)">{{ $t('edit') }}</b-dropdown-item>
                        <b-dropdown-item @click="dataexport(data.item.ID)">{{ $t('export') }}</b-dropdown-item>
                        <b-dropdown-divider></b-dropdown-divider>
                        <b-dropdown-item :disabled="isFirst(data.item.ID)" @click="moveup(data.item.ID)">{{ $t('moveup') }}</b-dropdown-item>
                        <b-dropdown-item :disabled="isLast(data.item.ID)" @click="movedown(data.item.ID)">{{ $t('movedown') }}</b-dropdown-item>
                    </b-dropdown>
                </template>
            </b-table>
        </div>
        <b-modal :title="$t('modal.new-project')" v-model="createModal" hide-footer class="text-white" header-bg-variant="dark" header-text-variant="light" body-bg-variant="dark" body-text-variant="light" footer-text-variant="dark" footer-body-variant="light">
            <v-text-field v-model="createData.title" required :label="$t('modal.enter-project-name')" hide-details></v-text-field>
            <v-text-field class="mt-3" v-model="createData.description" :label="$t('modal.enter-project-description')" hide-details></v-text-field>
            <br />
            <b-form-checkbox v-model="createData.useTemp">{{ $t('useTemplate') }}</b-form-checkbox>
            <v-select v-if="createData.useTemp" class="mt-3" v-model="createData.temp" :items="temps" item-title="text" hide-details></v-select>
            <b-button class="mt-3" variant="primary" @click="confirmCreate">{{ $t('create') }}</b-button>
        </b-modal>
        <b-modal :title="$t('modal.modify-project')" v-model="editModal" hide-footer class="text-white" header-bg-variant="dark" header-text-variant="light" body-bg-variant="dark" body-text-variant="light" footer-text-variant="dark" footer-body-variant="light">
            <v-text-field v-model="createData.title" required :label="$t('modal.enter-project-name')" hide-details></v-text-field>
            <v-text-field class="mt-3" v-model="createData.description" :label="$t('modal.enter-project-description')" hide-details></v-text-field>
            <b-button class="mt-3" variant="primary" @click="confirmEdit">{{ $t('modify') }}</b-button>
        </b-modal>
    </div>
</template>

<style>

</style>
