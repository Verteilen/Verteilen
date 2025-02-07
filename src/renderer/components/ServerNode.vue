<script setup lang="ts">
import { inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, Job, Project, Task } from '../interface';

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
const nodes:Ref<Array<Node>> = ref([])

const allUpdate = () => {
  nextTick(() => {
    emitter?.emit('updateProject')
    emitter?.emit('updateTask')
    emitter?.emit('updateJob')
    emitter?.emit('updateParameter')
  })
}

//#region Project
const addProject = (v:Array<Project>) => {
  projects.value.push(...v)
  window.electronAPI.send('save_record', JSON.stringify(projects.value))
  allUpdate()
}

const editProject = (id:string, v:Project) => {
  const selectp = projects.value.findIndex(x => x.uuid == id)
  if(selectp == -1) return
  projects.value[selectp] = v
  if(selectProject.value?.uuid == id){
    selectProject.value = v
  }
  window.electronAPI.send('save_record', JSON.stringify(projects.value))
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
  window.electronAPI.send('save_record', JSON.stringify(projects.value))
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
  window.electronAPI.send('save_record', JSON.stringify(projects.value))
  allUpdate()
}

const movedownProject = (uuid:string) => {
  const index = projects.value.findIndex(x => x.uuid == uuid)
  if(index == -1) return
  const b = projects.value[index + 1]
  projects.value[index + 1] = projects.value[index]
  projects.value[index] = b
  window.electronAPI.send('save_record', JSON.stringify(projects.value))
  allUpdate()
}
//#endregion

//#region Task
const addTask = (v:Array<Task>) => {
  if(selectProject.value == undefined) return
  selectProject.value.task.push(...v)
  window.electronAPI.send('save_record', JSON.stringify(projects.value))
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
  window.electronAPI.send('save_record', JSON.stringify(projects.value))
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
  window.electronAPI.send('save_record', JSON.stringify(projects.value))
  allUpdate()
}

const chooseTask = (uuid:string) => {
  selectTask.value = selectProject.value?.task.find(x => x.uuid == uuid)
  page.value = 2
  allUpdate()
}

const moveupTask = (uuid:string) => {
  if(selectProject.value == undefined) return
  const index = selectProject.value.task.findIndex(x => x.uuid == uuid)
  if(index == -1) return
  const b = selectProject.value.task[index - 1]
  selectProject.value.task[index - 1] = selectProject.value.task[index]
  selectProject.value.task[index] = b
  window.electronAPI.send('save_record', JSON.stringify(projects.value))
  allUpdate()
}

const movedownTask = (uuid:string) => {
  if(selectProject.value == undefined) return
  const index = selectProject.value.task.findIndex(x => x.uuid == uuid)
  if(index == -1) return
  const b = selectProject.value.task[index + 1]
  selectProject.value.task[index + 1] = selectProject.value.task[index]
  selectProject.value.task[index] = b
  window.electronAPI.send('save_record', JSON.stringify(projects.value))
  allUpdate()
}
//#endregion

//#region Job
const addJob = (v:Array<Job>) => {
  if(selectTask.value == undefined) return
  selectTask.value.jobs.push(...v)
  window.electronAPI.send('save_record', JSON.stringify(projects.value))
  allUpdate()
}

const editJob = (v:Array<Job>) => {
  if(selectTask.value == undefined) return
  selectTask.value.jobs = v
  window.electronAPI.send('save_record', JSON.stringify(projects.value))
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
  window.electronAPI.send('save_record', JSON.stringify(projects.value))
  allUpdate()
}
//#endregion

const menuCreateProject = () => {
  page.value = 0
}

onMounted(() => {
  window.electronAPI.send('menu', true)
  window.electronAPI.eventOn('createProject', menuCreateProject)
  window.electronAPI.invoke('load_record').then(x => {
    projects.value = JSON.parse(x)
    nextTick(() => {
      emitter?.emit('updateProject')
    })
  })
})

onUnmounted(() => {
  window.electronAPI.eventOff('createProject', menuCreateProject)
})

</script>

<template>
  <b-nav tabs style="width: 100vw;">
    <b-nav-item @click="page = 0" :active="page == 0">專案管理</b-nav-item>
    <b-nav-item @click="page = 1" :active="page == 1">流程管理</b-nav-item>
    <b-nav-item @click="page = 6" :active="page == 6">參數管理</b-nav-item>
    <b-nav-item @click="page = 2" :active="page == 2">工作管理</b-nav-item>
    <b-nav-item @click="page = 3" :active="page == 3">節點管理</b-nav-item>
    <b-nav-item @click="page = 4" :active="page == 4">控制台</b-nav-item>
    <b-nav-item @click="page = 5" :active="page == 5">紀錄</b-nav-item>
  </b-nav>
  <div style="width: 100vw;">
    <ProjectPage v-show="page == 0" 
      :projects="projects" 
      @added="e => addProject(e)" 
      @edit="(id, e) => editProject(id, e)" 
      @select="e => chooseProject(e)" 
      @delete="e => deleteProject(e)"
      @moveup="e => moveupProject(e)"
      @movedown="e => movedownProject(e)" />

    <TaskPage v-show="page == 1" 
      :projects="projects" 
      :select="selectProject" 
      @added="e => addTask(e)" 
      @edit="(id, e) => editTask(id, e)" 
      @select="e => chooseTask(e)"
      @delete="e => deleteTask(e)"
      @moveup="e => moveupTask(e)"
      @movedown="e => movedownTask(e)"
      @parameter="page = 6" />

    <JobPage v-show="page == 2" 
      :projects="projects" 
      :select="selectTask"
      :owner="selectProject"
      @added="e => addJob(e)" 
      @edit="(e) => editJob(e)" 
      @delete="e => deleteJob(e)" />

    <NodePage v-show="page == 3" 
      :nodes="nodes" />

    <ConsolePage v-show="page == 4" />
    <LogPage v-show="page == 5" />

    <ParameterPage v-show="page == 6" 
      :select="selectProject" />
  </div>
</template>

<style scoped>

</style>
