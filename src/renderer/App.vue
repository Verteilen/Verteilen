<script setup lang="ts">
import { Emitter } from 'mitt';
import { computed, inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { useTheme } from 'vuetify';
import ClientNode from './components/ClientNode.vue';
import Messager from './components/Messager.vue';
import ServerClientSelection from './components/ServerClientSelection.vue';
import ServerNode from './components/ServerNode.vue';
import GuideDialog from './components/dialog/GuideDialog.vue';
import SettingDialog from './components/dialog/SettingDialog.vue';
import { BusType, Preference, WebPORT } from './interface';
import { i18n } from './plugins/i18n';
import { BackendProxy } from './proxy';

const theme = useTheme()
const emitter:Emitter<BusType> | undefined = inject('emitter');
const preference:Ref<Preference> = ref({
  lan: 'en',
  log: false,
  font: 16,
  notification: false,
  theme: "dark"
})
const backend:Ref<BackendProxy> = ref(new BackendProxy())
const config = computed(() => backend.value.config)

const mode = ref(config.value.isElectron ? -1 : 1)
const settingModal = ref(false)
const guideModal = ref(false)

backend.value.init().then(() => {
  console.log("isElectron", config.value.isElectron)
  console.log("isExpress", config.value.isExpress)
  console.log("env", process.env.NODE_ENV)
  backend.value.send('message', 'Welcome Compute Tool')
})

const modeSelect = (isclient:boolean) => {
  mode.value = isclient ? 0 : 1
}

const locate = (v:string) => {
  const t = i18n.global
  // @ts-ignore
  t.locale = v
  preference.value.lan = v
  emitter?.emit('updateLocate')
  backend.value.send('save_preference', JSON.stringify(preference.value, null, 4))
}

const setting = () => { settingModal.value = true }
const guide = () => { guideModal.value = true }

const preferenceUpdate = (data:Preference) => {
  Object.assign(preference.value, data)
  locate(preference.value.lan)
  theme.global.name.value = data.theme
  const t = i18n.global
  // @ts-ignore
  t.locale = preference.value.lan
}

const load_preference = (x:string) => {
  preference.value = JSON.parse(x)
  console.log("load_preference", preference.value)
  backend.value.send('locate', preference.value.lan)
  preferenceUpdate(preference.value)
}

onMounted(() => {
  emitter?.on('modeSelect', modeSelect)
  emitter?.on('setting', setting)
  emitter?.on('guide', guide)
  backend.value.wait_init().then(() => {
    if(backend.value.config.haveBackend){
      setTimeout(() => {
        backend.value.eventOn('locate', locate)
        backend.value.invoke('load_preference').then(x => load_preference(x))
      }, 150);
    }
  })
  
})

onUnmounted(() => {
  emitter?.off('modeSelect', modeSelect)
  emitter?.off('setting', setting)
  emitter?.off('guide', guide)
  backend.value.eventOff('locate', locate)
})

</script>

<template>
  <v-container fluid class="ma-0 pa-0" :style="{ 'fontSize': preference.font + 'px' }">
    <ServerClientSelection v-model.number="mode" v-if="mode == -1" :preference="preference" :config="config"/>
    <ClientNode v-else-if="mode == 0" :preference="preference" :backend="backend"/>
    <ServerNode v-else-if="mode == 1" :preference="preference" :backend="backend"/>
    <Messager :preference="preference" />
    <SettingDialog v-model="settingModal" :item="preference" @update="preferenceUpdate" />
    <GuideDialog v-model="guideModal" :preference="preference" />
  </v-container>
</template>

<style lang="css">

</style>