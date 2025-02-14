<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import ClientNode from './components/ClientNode.vue';
import Messager from './components/Messager.vue';
import ServerClientSelection from './components/ServerClientSelection.vue';
import ServerNode from './components/ServerNode.vue';
import { BusType, Preference } from './interface';
import { isElectron } from './main';
import { i18n } from './plugins/i18n';

const emitter:Emitter<BusType> | undefined = inject('emitter');
const preference:Ref<Preference> = ref({
  lan: 'en'
})
const mode = ref(isElectron ? -1 : 1)

console.log("isElectron", isElectron)

if (isElectron) window.electronAPI.send('message', '歡迎啟動自動化工廠');

const modeSelect = (isclient:boolean) => {
  mode.value = isclient ? 0 : 1
}

const locate = (e:IpcRendererEvent, v:string) => {
  const t = i18n.global
  // @ts-ignore
  t.locale = v
  preference.value.lan = v
  if(!isElectron) return
  window.electronAPI.send('save_preference', JSON.stringify(preference.value, null, 4))
}

onMounted(() => {
  emitter?.on('modeSelect', modeSelect)
  if(!isElectron) return
  window.electronAPI.eventOn('locate', locate)
  window.electronAPI.invoke('load_preference').then(x => {
    preference.value = JSON.parse(x)
    window.electronAPI.send('locate', preference.value.lan)
    const t = i18n.global
    // @ts-ignore
    t.locale = preference.value.lan
  })
})

onUnmounted(() => {
  emitter?.on('modeSelect', modeSelect)
  if(!isElectron) return
  window.electronAPI.eventOff('locate', locate)
})

</script>

<template>
  <ServerClientSelection v-if="mode == -1" />
  <ClientNode v-else-if="mode == 0"/>
  <ServerNode v-else-if="mode == 1"/>
  <Messager />
</template>