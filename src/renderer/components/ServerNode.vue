<script setup lang="ts">
import { inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, Project, Task } from '../interface';

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

const addProject = (v:Project) => {
  projects.value.push(v)
  window.electronAPI.send('save_record', JSON.stringify(projects.value))
}

const chooseProject = (uuid:string) => {
  selectProject.value = projects.value.find(x => x.uuid == uuid)
  page.value = 1
}

const chooseTask = (uuid:string) => {
  selectTask.value = selectProject.value?.task.find(x => x.uuid == uuid)
  page.value = 2
}

const menuCreateProject = () => {
  page.value = 0
}

const deleteProject = (uuids:Array<string>) => {
  uuids.forEach(id => {
    const index = projects.value.findIndex(x => x.uuid == id)
    if(index != -1) projects.value.splice(index, 1)
    if(selectProject.value?.uuid == id){
      selectProject.value = undefined
    }
  })
  window.electronAPI.send('save_record', JSON.stringify(projects.value))
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
      @select="e => chooseProject(e)" 
      @delete="e => deleteProject(e)" />

    <TaskPage v-show="page == 1" 
      :projects="projects" 
      :select="selectProject" 
      @added="e => selectProject?.task.push(e)" 
      @select="e => chooseTask(e)"
      @parameter="page = 6" />

    <JobPage v-show="page == 2" 
      :projects="projects" 
      :select="selectTask" />

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
