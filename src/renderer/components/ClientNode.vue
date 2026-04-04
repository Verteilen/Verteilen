<script setup lang="ts">
//#region Methods
import { Ref, ref } from 'vue'
import { 
  ClientLog, 
} from 'verteilen-core/dist/interface'
import { i18n } from '../plugins/i18n'
import Layout from './components/layout/Layout.vue'
import AppBar from './components/layout/AppBar.vue'
//#endregion

//#region Views
import ClientView from '../components/components/layout/ClientView.vue';
//#endregion

//#region Data
const $t = i18n.global.t
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
//#endregion

</script>

<template>
  <Layout>
    <AppBar :title="$t('node')" goback />
    <v-container fluid class="ma-0 pa-0 pt-12" style="height: 94vh">
      <ClientView class="w-100" :messages="messages" @clean="() => messages = []" />
    </v-container>
  </Layout>
</template>
