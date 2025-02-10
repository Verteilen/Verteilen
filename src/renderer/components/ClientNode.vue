<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { onMounted, onUnmounted, Ref, ref } from 'vue';

const messages:Ref<Array<string>> = ref([])
const myDiv:Ref<HTMLDivElement | null> = ref(null);

const msgAppend = (e:IpcRendererEvent, msg:string) => {
  messages.value.push(msg)
  myDiv.value?.scrollTo(0, myDiv.value?.scrollHeight);
}

const clearMessage = () => {
  messages.value.splice(0, messages.value.length)
}

onMounted(() => {
  window.electronAPI.eventOn('msgAppend', msgAppend);
  window.electronAPI.send('menu', false)
  window.electronAPI.send('client_start');
})

onUnmounted(() => {
  window.electronAPI.eventOff('msgAppend', msgAppend);
  window.electronAPI.send('client_stop');
})

</script>

<template>
  <div class="float_button">
    <b-button-group>
      <b-button @click="clearMessage">清除</b-button>
    </b-button-group>
  </div>
  <div class="flow" ref="myDiv">
    <p class="messages" v-for="(msg, i) in messages" :key="i">{{ msg }}</p>
  </div>
</template>

<style scoped>
.float_button{
  position: fixed;
  top: 20px;
  right: 20px;
}
.flow {
  padding-top: 20px;
  padding-left: 10px;
  width: 100vw; 
  height: 100vh;
  overflow-y: auto;
  text-align: left;
  background-color: rgb(12,12,12);
}
.messages {
  line-height: 15px;
  color: white
}
</style>
