<script setup lang="ts">
//#region Modules
import { ClientLog } from 'verteilen-core/dist/interface'
//#endregion

//#region Views
import ClientView from '../components/layout/ClientView.vue';
//#endregion

interface PROPS {
    messages: Array<ClientLog>
}
const props = defineProps<PROPS>()
</script>

<template>
  <v-container fluid class="ma-0 pa-0 pt-4" style="height: 94vh">
    <ClientView :messages="props.messages" />
  </v-container>
</template>

