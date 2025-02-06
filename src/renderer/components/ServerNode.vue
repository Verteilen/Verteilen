<script setup lang="ts">
import { onMounted, onUnmounted, Ref, ref } from 'vue';
import { Project, Task } from '../interface';

import ConsolePage from './server/Console.vue';
import JobPage from './server/Job.vue';
import LogPage from './server/Log.vue';
import NodePage from './server/Node.vue';
import ProjectPage from './server/Project.vue';
import TaskPage from './server/Task.vue';

const page = ref(0)
const projects:Ref<Array<Project>> = ref([])
const selectProject:Ref<Project | undefined> = ref(undefined)
const selectTask:Ref<Task | undefined> = ref(undefined)
const nodes:Ref<Array<Node>> = ref([])

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
}

onMounted(() => {
  window.electronAPI.send('menu', true)
  window.electronAPI.eventOn('createProject', menuCreateProject)
})

onUnmounted(() => {
  window.electronAPI.eventOff('createProject', menuCreateProject)
})

</script>

<template>
  <b-nav tabs style="width: 100vw;">
    <b-nav-item @click="page = 0" :active="page == 0">專案管理</b-nav-item>
    <b-nav-item @click="page = 1" :active="page == 1">流程管理</b-nav-item>
    <b-nav-item @click="page = 2" :active="page == 2">工作管理</b-nav-item>
    <b-nav-item @click="page = 3" :active="page == 3">節點管理</b-nav-item>
    <b-nav-item @click="page = 4" :active="page == 4">控制台</b-nav-item>
    <b-nav-item @click="page = 5" :active="page == 5">紀錄</b-nav-item>
  </b-nav>
  <div style="width: 100vw;">
    <ProjectPage v-show="page == 0" 
      :projects="projects" 
      @added="e => projects.push(e)" 
      @select="e => chooseProject(e)" 
      @delete="e => deleteProject(e)" />

    <TaskPage v-show="page == 1" 
      :projects="projects" 
      :select="selectProject" 
      @added="e => selectProject?.task.push(e)" 
      @select="e => chooseTask(e)" />

    <JobPage v-show="page == 2" 
      :projects="projects" 
      :select="selectTask" />

    <NodePage v-show="page == 3" 
      :nodes="nodes" />

    <ConsolePage v-show="page == 4" />
    <LogPage v-show="page == 5" />
  </div>
</template>

<style scoped>

</style>
