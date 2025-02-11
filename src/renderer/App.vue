<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, ref } from 'vue';
import ClientNode from './components/ClientNode.vue';
import Messager from './components/Messager.vue';
import ServerClientSelection from './components/ServerClientSelection.vue';
import ServerNode from './components/ServerNode.vue';
import { BusType } from './interface';
import { isElectron } from './main';
import { i18n } from './plugins/i18n';

const emitter:Emitter<BusType> | undefined = inject('emitter');
const mode = ref(-1)

console.log("isElectron", isElectron)

if (isElectron) window.electronAPI.send('message', '歡迎啟動自動化工廠');

const modeSelect = (isclient:boolean) => {
  mode.value = isclient ? 0 : 1
}

const locate = (e:IpcRendererEvent, v:string) => {
  const t = i18n.global
  // @ts-ignore
  t.locale = v
}

onMounted(() => {
  emitter?.on('modeSelect', modeSelect)
  window.electronAPI.eventOn('locate', locate)
})

onUnmounted(() => {
  emitter?.on('modeSelect', modeSelect)
  window.electronAPI.eventOff('locate', locate)
})

</script>

<template>
  <ServerClientSelection v-if="mode == -1" />
  <ClientNode v-else-if="mode == 0"/>
  <ServerNode v-else-if="mode == 1"/>
  <Messager />
</template>