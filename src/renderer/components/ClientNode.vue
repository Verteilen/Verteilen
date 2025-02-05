<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { onMounted, onUnmounted, Ref, ref } from 'vue';

const messages:Ref<Array<string>> = ref([])

const msgAppend = (e:IpcRendererEvent, msg:string) => {
  messages.value.push(msg);
}

onMounted(() => {
  window.electronAPI.eventOn('msgAppend', msgAppend);
})

onUnmounted(() => {
  window.electronAPI.eventOff('msgAppend', msgAppend);
})

</script>

<template>
  <p v-for="(msg, i) in messages" :key="i">{{ msg }}</p>
</template>

<style scoped>
</style>
