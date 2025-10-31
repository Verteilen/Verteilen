<script setup lang="ts">
//#region Modules
import { Emitter } from 'mitt'
import { computed, inject, onMounted, onUnmounted, Ref, ref } from 'vue'
import { useTheme } from 'vuetify'
import { BackendType, BusType, Login, Preference } from './interface'
import { i18n } from './plugins/i18n'
import { BackendProxy } from './proxy'
import { vuetify } from './plugins/vuetify'
//#endregion

//#region Views
import ClientNodePage from './components/ClientNode.vue'
import LoginPage from './components/Login.vue'
import ServerClientSelectionPage from './components/ServerClientSelection.vue'
import ServerNodePage from './components/ServerNode.vue'
import ClusterNodePage from './components/ClusterNode.vue'
import SettingDialog from './components/dialog/SettingDialog.vue'
import Messager from './components/Messager.vue'
import { DATA, Util_App } from './App'
//#endregion

//#region Data
const $t = i18n.global.t
const theme = useTheme()
const emitter:Emitter<BusType> = inject('emitter')!
const backend:Ref<BackendProxy> = inject("backend")!
const preference:Ref<Preference> = inject("preference")!
const data:Ref<DATA> = ref({
  settingModal: false,
  defaultTransition: undefined
})
//#endregion

//#region Computed
const mode = computed(() => preference.value.mode)
const config = computed(() => backend.value.config)
const token = computed(() => backend.value.getCookie('token'))
const route = computed(() => {
  if(config.value.isElectron){
    if(mode.value == -1) return 0
    else if(mode.value == 0) return 2
    else if(mode.value == 1) return 3
    else if(mode.value == 2) return 4
    else return 0
  }
  else if(config.value.isExpress){
    if(config.value.backendType == BackendType.SERVER || config.value.backendType == BackendType.NONE){
      if(config.value.login) return 3
      else return 1
    }
    else if(config.value.backendType == BackendType.NODE) return 2
    else if(config.value.backendType == BackendType.CLUSTER) return 4
  }
  return 3
})
const util = new Util_App(data, theme, emitter, backend, preference, token)
//#endregion

//#region Methods
const setting = () => { data.value.settingModal = true }
const message = (e:string) => console.log(e)
const guide = () => {
  backend.value.send('open', 'https://verteilen.github.io/wiki/')
}
const relogin = () => {
  config.value.login = false
  backend.value.removeCookie('token')
}
const loginGuest = () => {
  config.value.login = true
  backend.value.removeCookie('token')
  backend.value.init().then(() => {
    backend.value.invoke('load_preference', token.value).then(x => util.load_preference(x))
  })
}
const trylogin = (v:Login) => {
  backend.value.invoke('load_preference', token.value).then(x => util.load_preference(x))
}
const UpdateSelection = (mode:number | undefined, url:string | undefined):void => {
  preference.value.mode = mode
  preference.value.url = url
  util.save_preference(preference.value)
}
//#endregion

onMounted(() => {
  backend.value.init().then(() => {
    console.log("isElectron", config.value.isElectron)
    console.log("isExpress", config.value.isExpress)
    console.log("isAdmin", config.value.isAdmin)
    console.log("env", process.env.NODE_ENV)
    backend.value.send('message', 'Welcome Compute Tool')
  })
  data.value.defaultTransition = vuetify.defaults.value?.global
  emitter.on('guide', guide)
  emitter.on('relogin', relogin)
  emitter.on('loginGuest', loginGuest)
  emitter.on('login', trylogin)
  emitter.on('savePreference', util.save_preference)
  emitter.on('setting', setting)
  backend.value.wait_init().then(() => {
    if(backend.value.config.haveBackend){
      backend.value.eventOn('locate', util.locate)
      backend.value.eventOn('message', message)
      backend.value.invoke('load_preference', true, token.value).then(x => util.load_preference(x)).then(() => console.log(i18n.global.t('project')))
    }
  })
})

onUnmounted(() => {
  emitter.off('guide', guide)
  emitter.off('savePreference', util.save_preference)
  emitter.off('setting', setting)
  backend.value.eventOff('locate', util.locate)
  backend.value.eventOff('message', message)
})
</script>

<template>
  <!-- The top level component -->
  <v-container fluid class="ma-0 pa-0" :style="{ 'fontSize': preference?.font + 'px' }">
    <span style="z-index: 1; color: white; position: fixed;">{{ route }}: {{ mode }}</span>
    <!-- This is like router -->
    <ServerClientSelectionPage v-if="route == 0" @selected="(e, e2) => UpdateSelection(e, e2)"/>
    <LoginPage v-else-if="route == 1" :preference="preference" :config="config"/>
    <ClientNodePage v-else-if="route == 2"/>
    <ServerNodePage v-else-if="route == 3"/>
    <ClusterNodePage v-else-if="route == 4"/>
    <span v-else>route: {{ route }} {{ JSON.stringify(config, null, 4) }}</span>
    <!-- Extra components -->
    <Messager />
    <SettingDialog v-model="data.settingModal" @update="e => util.update_preference(e)" />
  </v-container>
</template>