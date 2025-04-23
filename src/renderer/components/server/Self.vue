<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { AppConfig, BusType, ClientLog, MESSAGE_LIMIT, Preference } from '../../interface';

const emitter:Emitter<BusType> | undefined = inject('emitter');
let updateHandle:any = undefined

interface PROPS {
    config: AppConfig
    preference: Preference
}

const messages:Ref<Array<ClientLog>> = ref([
  {
      s: true,
      tag: "client",
      title: "Main Information",
      text: []
  }
])
const props = defineProps<PROPS>()
const myDiv:Ref<HTMLDivElement | null> = ref(null);
const panel:Ref<Array<number>> = ref([0])
const autoScroll = ref(true)

const msgAppend = (e:IpcRendererEvent, msg:string, tag?:string) => {
  if(tag == undefined){
    messages.value[0].text.push(msg)
    if(messages.value[0].text.length > MESSAGE_LIMIT){
      messages.value[0].text.shift()
    }
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
      if(messages.value[index].text.length > MESSAGE_LIMIT){
        messages.value[index].text.shift()
      }
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
  updateHandle = setInterval(() => emitter?.emit('updateHandle'), 1000);
  if(props.config.isElectron){
    window.electronAPI.eventOn('msgAppend', msgAppend);
  }
})

onUnmounted(() => {
    if(props.config.isElectron){
        window.electronAPI.eventOff('msgAppend', msgAppend);
    }
})

</script>

<template>
  <v-container fluid>
    <div class="float_button text-white" style="z-index: 5;">
      <v-btn-group>
        <v-btn color="primary" @click="panel = []">{{ $t('close-all') }}</v-btn>
        <v-btn :color="autoScroll ? 'success' : 'error'" @click="autoScroll = !autoScroll">{{ $t('auto-scroll') }}</v-btn>
        <v-btn color="primary" @click="clearMessage">{{ $t('clear') }}</v-btn>
      </v-btn-group>
    </div>
    <div class="flow text-white bg-grey-darken-4" ref="myDiv">
      <v-expansion-panels multiple v-model="panel">
        <v-expansion-panel v-for="(block, i) in messages" :key="i">
          <v-expansion-panel-title color="grey-darken-3">
            <h3>{{ block.title }}</h3>
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
  </v-container>
</template>

<style scoped>
.float_button{
  position: fixed;
  top: 80px;
  right: 20px;
}
.flow {
  padding-top: 20px;
  padding-left: 10px;
  height: calc(100vh - 100px);
  overflow-y: scroll;
  text-align: left;
}
.messages {
  line-height: 18px;
}
</style>
