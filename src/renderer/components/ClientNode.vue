<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { onMounted, onUnmounted, Ref, ref } from 'vue';

const messages:Ref<Array<string>> = ref([])
const myDiv = ref<HTMLDivElement | null>(null);

const msgAppend = (e:IpcRendererEvent, msg:string) => {
  messages.value.push(msg)
  window.scrollTo(0, document.body.scrollHeight);
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
  margin-top: 20px;
  padding-left: 10px;
  width: 100vw; 
  text-align: left;
}
.messages {
  line-height: 10px;
}
</style>
