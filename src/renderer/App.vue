<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import ClientNode from './components/ClientNode.vue';
import Messager from './components/Messager.vue';
import ServerClientSelection from './components/ServerClientSelection.vue';
import ServerNode from './components/ServerNode.vue';
import { AppConfig, BusType, Preference } from './interface';
import { checkifElectron, checkIfExpress } from './platform';
import { i18n } from './plugins/i18n';

const emitter:Emitter<BusType> | undefined = inject('emitter');
const preference:Ref<Preference> = ref({
  lan: 'en'
})
const config:Ref<AppConfig> = ref({
  isElectron: checkifElectron(),
  isExpress: false,
  haveBackend: false
})
const isExpress:Ref<boolean | undefined> = ref(undefined)
const mode = ref(config.value.isElectron ? -1 : 1)

checkIfExpress((e) => {
  isExpress.value = e
  console.log("isElectron", config.value.isElectron)
  console.log("isExpress", isExpress.value)
  if (config.value.isElectron) window.electronAPI.send('message', '歡迎啟動自動化工廠');
})

const modeSelect = (isclient:boolean) => {
  mode.value = isclient ? 0 : 1
}

const locate = (e:IpcRendererEvent, v:string) => {
  const t = i18n.global
  // @ts-ignore
  t.locale = v
  preference.value.lan = v
  emitter?.emit('updateLocate')
  if(config.value.isElectron){
    window.electronAPI.send('save_preference', JSON.stringify(preference.value, null, 4))
  }
}

const load_preference = (x:string) => {
  preference.value = JSON.parse(x)
  console.log("lan: ", preference.value)
  window.electronAPI.send('locate', preference.value.lan)
  const t = i18n.global
  // @ts-ignore
  t.locale = preference.value.lan
}

onMounted(() => {
  emitter?.on('modeSelect', modeSelect)
  if(config.value.isElectron){
    window.electronAPI.eventOn('locate', locate)
    window.electronAPI.invoke('load_preference').then(x => load_preference(x))
  }
})

onUnmounted(() => {
  emitter?.on('modeSelect', modeSelect)
  if(config.value.isElectron){
    window.electronAPI.eventOff('locate', locate)
  }
})

</script>

<template>
  <v-container fluid class="ma-0 pa-0">
    <ServerClientSelection v-model.number="mode" v-if="mode == -1" :config="config"/>
    <ClientNode v-else-if="mode == 0" :preference="preference" :config="config"/>
    <ServerNode v-else-if="mode == 1" :preference="preference" :config="config"/>
    <Messager />
  </v-container>
</template>