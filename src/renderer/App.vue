<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ClientNode from './components/ClientNode.vue';
import Helper from './components/Helper.vue';
import Messager from './components/Messager.vue';
import ServerClientSelection from './components/ServerClientSelection.vue';
import ServerNode from './components/ServerNode.vue';
import { BusType } from './interface';

const emitter:Emitter<BusType> | undefined = inject('emitter');
const mode = ref(-1)
const helper = ref(false)

window.electronAPI.send('message', '歡迎啟動自動化工廠');

const modeSelect = (isclient:boolean) => {
  mode.value = isclient ? 0 : 1;
}

const show_helper = () => {
  helper.value = true
}

const locate = (e:IpcRendererEvent, v:string) => {
  const t = useI18n({ useScope: "global" });
  t.locale.value = v
}

onMounted(() => {
  emitter?.on('modeSelect', modeSelect)
  window.electronAPI.eventOn('show_helper', show_helper)
  window.electronAPI.eventOn('locate', locate)
})

onUnmounted(() => {
  emitter?.on('modeSelect', modeSelect)
  window.electronAPI.eventOff('show_helper', show_helper)
  window.electronAPI.eventOff('locate', locate)
})

</script>

<template>
  <ServerClientSelection v-if="mode == -1" />
  <ClientNode v-else-if="mode == 0"/>
  <ServerNode v-else-if="mode == 1"/>
  <Messager />
  <Helper v-model="helper" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
