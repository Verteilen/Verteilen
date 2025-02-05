<script setup lang="ts">
import { inject, ref } from 'vue';

import { Emitter } from 'mitt';
import ClientNode from './components/ClientNode.vue';
import Messager from './components/Messager.vue';
import ServerClientSelection from './components/ServerClientSelection.vue';
import ServerNode from './components/ServerNode.vue';
import { BusType } from './interface';

const emitter:Emitter<BusType> | undefined = inject('emitter');
const mode = ref(-1)

window.electronAPI.send('message', 'Hello from App.vue!');

emitter?.on('modeSelect', (isclient) => {
  mode.value = isclient ? 0 : 1;
})

</script>

<template>
  <ServerClientSelection v-if="mode == -1" />
  <ClientNode v-else-if="mode == 0"/>
  <ServerNode v-else-if="mode == 1"/>
  <Messager />
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
