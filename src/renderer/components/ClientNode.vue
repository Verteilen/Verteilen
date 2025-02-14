<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { onMounted, onUnmounted, Ref, ref } from 'vue';
import { ClientLog } from '../interface';

const messages:Ref<Array<ClientLog>> = ref([
  {
      s: true,
      tag: "client",
      title: "客戶端訊息",
      text: []
  }
])
const myDiv:Ref<HTMLDivElement | null> = ref(null);
const panel:Ref<Array<number>> = ref([0])
const autoScroll = ref(true)

const msgAppend = (e:IpcRendererEvent, msg:string, tag?:string) => {
  if(tag == undefined){
    messages.value[0].text.push(msg)
  }else{
    const index = messages.value.findIndex(x => x.tag == tag)
    if(index == -1){
      messages.value.push({
        s: true,
        tag: tag,
        title: tag,
        text: [msg]
      })
      panel.value.push(messages.value.length - 1)
      
    }else{
      messages.value[index].text.push(msg)
      if(!panel.value.includes(index)) panel.value.push(index)
    }
  }
  if(autoScroll.value) myDiv.value?.scrollTo(0, myDiv.value?.scrollHeight);
}

const clearMessage = () => {
  messages.value = [
    {
      s: true,
      tag: "client",
      title: "客戶端訊息",
      text: [
        "[介面] 訊息清空"
      ]
    }
  ]
  panel.value = [0]
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
  <div class="float_button text-white" style="z-index: 5;">
    <b-button-group>
      <b-button variant="primary" @click="panel = []">{{ $t('close-all') }}</b-button>
      <b-button :variant="autoScroll ? 'success' : 'danger'" @click="autoScroll = !autoScroll">{{ $t('auto-scroll') }}</b-button>
      <b-button variant="primary" @click="clearMessage">{{ $t('clear') }}</b-button>
    </b-button-group>
  </div>
  <div class="flow text-white bg-grey-darken-4" ref="myDiv">
    <v-expansion-panels multiple v-model="panel">
      <v-expansion-panel v-for="(block, i) in messages" :key="i">
        <v-expansion-panel-title color="grey-darken-3">
          <h5>{{ block.title }}</h5>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <br />
          <p class="messages" v-for="(msg, j) in block.text" :key="j">
            {{ msg }}
          </p>
          <br />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
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
}
.messages {
  line-height: 15px;
}
</style>
