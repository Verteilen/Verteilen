<script setup lang="ts">
import { Emitter } from 'mitt';
import { computed, inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, ClientLog, MESSAGE_LIMIT, Preference, RENDER_UPDATETICK } from '../interface';
import { BackendProxy } from '../proxy';

const emitter:Emitter<BusType> | undefined = inject('emitter');
let updateHandle:any = undefined

interface PROPS {
    backend: BackendProxy
    preference: Preference
}

const messages:Ref<Array<ClientLog>> = ref([
  {
    s: true,
    tag: "Main Information",
    title: "Main Information",
    text: [
        "[Interfaca] Clean messages"
    ]
  }
])
const config = computed(() => props.backend.config)
const props = defineProps<PROPS>()
const myDiv:Ref<HTMLDivElement | null> = ref(null);
const panel:Ref<Array<number>> = ref([0])
const autoScroll = ref(true)

const msgAppend = (d:Array<string | undefined>) => {
  if(d[1] == undefined){
    messages.value[0].text.push(d[0]!)
    if(messages.value[0].text.length > MESSAGE_LIMIT){
      messages.value[0].text.shift()
    }
  }else{
    const index = messages.value.findIndex(x => x.tag == d[1])
    if(index == -1){
      messages.value.push({
        s: true,
        tag: d[1],
        title: d[1],
        text: [d[0]!]
      })
      panel.value.push(messages.value.length - 1)
      
    }else{
      messages.value[index].text.push(d[0]!)
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

const popSetting = () => { emitter?.emit('setting') }

onMounted(() => {
  updateHandle = setInterval(() => emitter?.emit('updateHandle'), RENDER_UPDATETICK);
  props.backend.wait_init().then(() => {
    if(config.value.isElectron){
      props.backend.eventOn('msgAppend', msgAppend);
      props.backend.send('menu', false)
      props.backend.send('client_start');
    }
  })
})

onUnmounted(() => {
  props.backend.eventOff('msgAppend', msgAppend);
  props.backend.send('client_stop');
})

</script>

<template>
  <div class="text-white bg" style="margin: 0; width: 100vw; height: 100vh; place-items: center;">
    <v-layout>
      <v-app-bar :elevation="2">
          <v-app-bar-title>{{ $t('node') }}</v-app-bar-title>
          <template v-slot:append>
          <v-menu location="left">
              <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="mdi-dots-vertical"></v-btn>
              </template>
              <v-list width="120px">
              <v-list-item @click="popSetting">{{ $t('setting') }}</v-list-item>
              </v-list>
          </v-menu>
          </template>
      </v-app-bar>
    </v-layout>
    <v-toolbar density="compact" class="pr-3" style="padding-top: 65px">
      <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
              <v-btn color="primary" icon v-bind="props" @click="panel = []">
                  <v-icon>mdi-folder-arrow-up</v-icon>
              </v-btn>
          </template>
          {{ $t('close-all') }}
      </v-tooltip>
      <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props" :color="autoScroll ? 'success' : 'error'" @click="autoScroll = !autoScroll">
                  <v-icon>mdi-pan-vertical</v-icon>
              </v-btn>
          </template>
          {{ $t('auto-scroll') }}
      </v-tooltip>
      <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
              <v-btn color="error" icon v-bind="props" @click="clearMessage">
                  <v-icon>mdi-close</v-icon>
              </v-btn>
          </template>
          {{ $t('clear') }}
      </v-tooltip>
    </v-toolbar>
    <div class="flow text-white" ref="myDiv">
      <v-expansion-panels multiple v-model="panel">
        <v-expansion-panel v-for="(block, i) in messages" :key="i" style="background: transparent">
          <v-expansion-panel-title color="grey-darken-3">
            <h3>{{ block.title }}</h3>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <p class="messages" v-for="(msg, j) in block.text" :key="j" 
              :style="{ 'fontSize': props.preference.font + 'px', 'line-height': (props.preference.font) + 'px' }">
              {{ msg }}
            </p>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
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
  line-height: 18px;
}
.bg {
    background-image: linear-gradient(to bottom right, rgb(33, 33, 33), rgb(33, 40, 48));
}
</style>
