<script setup lang="ts">
import { inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, Job, Node, NodeTable, Parameter, Project, Record, Task } from '../interface';

import { IpcRendererEvent } from 'electron';
import { Emitter } from 'mitt';
import ConsolePage from './server/Console.vue';
import JobPage from './server/Job.vue';
import LogPage from './server/Log.vue';
import NodePage from './server/Node.vue';
import ParameterPage from './server/Parameter.vue';
import ProjectPage from './server/Project.vue';
import TaskPage from './server/Task.vue';

const emitter:Emitter<BusType> | undefined = inject('emitter');

const page = ref(0)
const projects:Ref<Array<Project>> = ref([])
const selectProject:Ref<Project | undefined> = ref(undefined)
const selectTask:Ref<Task | undefined> = ref(undefined)
const nodes:Ref<Array<NodeTable>> = ref([])

const allUpdate = () => {
  nextTick(() => {
    emitter?.emit('updateProject')
    emitter?.emit('updateTask')
    emitter?.emit('updateJob')
    emitter?.emit('updateParameter')
  })
}

const saveRecord = ():Record => {
  const record:Record = {
    projects: projects.value,
    nodes: nodes.value as Array<Node>
  }
  const k = JSON.stringify(record, null, 4)
  window.electronAPI.send('save_record', k)
  return record
}

//#region Project
const addProject = (v:Array<Project>) => {
  projects.value.push(...v)
  saveRecord()
  allUpdate()
}

const editProject = (id:string, v:Project) => {
  const selectp = projects.value.findIndex(x => x.uuid == id)
  if(selectp == -1) return
  projects.value[selectp] = v
  if(selectProject.value?.uuid == id){
    selectProject.value = v
  }
  saveRecord()
  allUpdate()
}

const deleteProject = (uuids:Array<string>) => {
  uuids.forEach(id => {
    const index = projects.value.findIndex(x => x.uuid == id)
    if(index != -1) {
      projects.value[index].task.forEach(tid => {
        if(selectTask.value?.uuid == tid.uuid){
          selectTask.value = undefined
        }
      })
      projects.value.splice(index, 1)
    }
    if(selectProject.value?.uuid == id){
      selectProject.value = undefined
    }
  })
  saveRecord()
  allUpdate()
}

const chooseProject = (uuid:string) => {
  selectProject.value = projects.value.find(x => x.uuid == uuid)
  page.value = 1
  allUpdate()
}

const moveupProject = (uuid:string) => {
  const index = projects.value.findIndex(x => x.uuid == uuid)
  if(index == -1) return
  const b = projects.value[index - 1]
  projects.value[index - 1] = projects.value[index]
  projects.value[index] = b
  saveRecord()
  allUpdate()
}

const movedownProject = (uuid:string) => {
  const index = projects.value.findIndex(x => x.uuid == uuid)
  if(index == -1) return
  const b = projects.value[index + 1]
  projects.value[index + 1] = projects.value[index]
  projects.value[index] = b
  saveRecord()
  allUpdate()
}

const executeProjects = (uuids:Array<string>, keep:boolean) => {
  const selection = projects.value.filter(x => uuids.includes(x.uuid))
  if(!keep){
    projects.value = projects.value.filter(x => !uuids.includes(x.uuid))
    saveRecord()
    allUpdate()
  }
  const record:Record = {
    projects: selection,
    nodes: nodes.value as Array<Node>
  }
  emitter?.emit('execute', record)
  page.value = 4
}
//#endregion

//#region Task
const addTask = (v:Array<Task>) => {
  if(selectProject.value == undefined) return
  selectProject.value.task.push(...v)
  saveRecord()
  allUpdate()
}

const editTask = (id:string, v:Task) => {
  if(selectProject.value == undefined) return
  const selectt = selectProject.value.task.findIndex(x => x.uuid == id)
  if(selectt == -1) return
  selectProject.value.task[selectt] = v
  if(selectTask.value?.uuid == id){
    selectTask.value = v
  }
  saveRecord()
  allUpdate()
}

const deleteTask = (uuids:Array<string>) => {
  uuids.forEach(id => {
    if(selectProject.value == undefined) return
    const index = selectProject.value.task.findIndex(x => x.uuid == id)
    if(index != -1) selectProject.value.task.splice(index, 1)
    if(selectTask.value?.uuid == id){
      selectTask.value = undefined
    }
  })
  saveRecord()
  allUpdate()
}

const chooseTask = (uuid:string) => {
  selectTask.value = selectProject.value?.task.find(x => x.uuid == uuid)
  page.value = 3
  allUpdate()
}

const moveupTask = (uuid:string) => {
  if(selectProject.value == undefined) return
  const index = selectProject.value.task.findIndex(x => x.uuid == uuid)
  if(index == -1) return
  const b = selectProject.value.task[index - 1]
  selectProject.value.task[index - 1] = selectProject.value.task[index]
  selectProject.value.task[index] = b
  saveRecord()
  allUpdate()
}

const movedownTask = (uuid:string) => {
  if(selectProject.value == undefined) return
  const index = selectProject.value.task.findIndex(x => x.uuid == uuid)
  if(index == -1) return
  const b = selectProject.value.task[index + 1]
  selectProject.value.task[index + 1] = selectProject.value.task[index]
  selectProject.value.task[index] = b
  saveRecord()
  allUpdate()
}
//#endregion

//#region Job
const addJob = (v:Array<Job>) => {
  if(selectTask.value == undefined) return
  selectTask.value.jobs.push(...v)
  saveRecord()
  allUpdate()
}

const editJob = (v:Array<Job>) => {
  if(selectTask.value == undefined) return
  selectTask.value.jobs = v
  saveRecord()
  allUpdate()
}

const deleteJob = (uuids:Array<string>) => {
  uuids.forEach(id => {
    if(selectTask.value == undefined) return
    const index = selectTask.value.jobs.findIndex(x => x.uuid == id)
    if(index != -1) selectTask.value.jobs.splice(index, 1)
    if(selectTask.value?.uuid == id){
      selectTask.value = undefined
    }
  })
  saveRecord()
  allUpdate()
}
//#endregion

//#region Node
const server_clients_update = (e:IpcRendererEvent, v:Array<NodeTable>) => {
    const old:Array<NodeTable> = Object.create(nodes.value)
    nodes.value = v
    old.filter(x => x.s).forEach(x => {
        const index = nodes.value.findIndex(y => y.ID == x.ID)
        if(index != -1){
            nodes.value[index].s = true
        }
    })
    saveRecord()
}
//#endregion

//#region Parameter
const editParameter = (e:Parameter) => {
  if(selectProject.value == undefined) return
  selectProject.value.parameter = e
  saveRecord()
  allUpdate()
}
//#endregion

const menuCreateProject = () => {
  page.value = 0
}

onMounted(() => {
  window.electronAPI.send('menu', true)
  window.electronAPI.eventOn('createProject', menuCreateProject)
  window.electronAPI.eventOn('server_clients_update', server_clients_update)
  window.electronAPI.invoke('load_record').then(x => {
    const record:Record = JSON.parse(x)
    projects.value = record.projects
    nodes.value = record.nodes.map(x => {
      return Object.assign(x, {
        s: false,
        state: 0,
        connection_rate: 0
      })
    })
    nodes.value.forEach(x => {
      window.electronAPI.send('server_record', JSON.stringify(record.nodes))
    })
    nextTick(() => {
      allUpdate()
    })
  })
})

onUnmounted(() => {
  window.electronAPI.eventOff('createProject', menuCreateProject)
  window.electronAPI.eventOff('server_clients_update', server_clients_update)
})

</script>

<template>
  <v-tabs v-model="page" tabs style="width: 100vw; height:50px;" class="bg-grey-darken-4">
    <v-tab>專案管理</v-tab>
    <v-tab>流程管理</v-tab>
    <v-tab>參數管理</v-tab>
    <v-tab>工作管理</v-tab>
    <v-tab>節點管理</v-tab>
    <v-tab>控制台</v-tab>
    <v-tab>紀錄</v-tab>
  </v-tabs>
  <div style="width: 100vw; height:calc(100vh - 50px); background-color: red;" class="bg-grey-darken-4 text-white">
    <ProjectPage v-show="page == 0" 
      :projects="projects" 
      @added="e => addProject(e)" 
      @edit="(id, e) => editProject(id, e)" 
      @select="e => chooseProject(e)" 
      @delete="e => deleteProject(e)"
      @moveup="e => moveupProject(e)"
      @movedown="e => movedownProject(e)" 
      @execute="(e, keep) => executeProjects(e, keep)"/>

    <TaskPage v-show="page == 1" 
      :projects="projects" 
      :select="selectProject" 
      @added="e => addTask(e)" 
      @edit="(id, e) => editTask(id, e)" 
      @select="e => chooseTask(e)"
      @delete="e => deleteTask(e)"
      @moveup="e => moveupTask(e)"
      @movedown="e => movedownTask(e)"
      @parameter="page = 2" />

    <ParameterPage v-show="page == 2" 
      :select="selectProject"
      @edit="e => editParameter(e)" />

    <JobPage v-show="page == 3" 
      :projects="projects" 
      :select="selectTask"
      :owner="selectProject"
      @added="e => addJob(e)" 
      @edit="(e) => editJob(e)" 
      @delete="e => deleteJob(e)" />

    <NodePage v-show="page == 4" 
      :nodes="nodes" />

    <ConsolePage v-show="page == 5" />
    <LogPage v-show="page == 6" />
  </div>
</template>

<style scoped>

</style>
