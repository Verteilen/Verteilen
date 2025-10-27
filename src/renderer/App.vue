<script setup lang="ts">
//#region Modules
import { Emitter } from 'mitt'
import { computed, inject, onMounted, onUnmounted, Ref, ref } from 'vue'
import { useTheme } from 'vuetify'
import { BackendType, BusType, Login, Preference, Setter } from './interface'
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
//#endregion

//#region Data
const theme = useTheme()
const emitter:Emitter<BusType> = inject('emitter')!
const backend:BackendProxy = inject("backend")!
const preference:Preference = inject("preference")!
const settingModal = ref(false)
const defaultTransition = ref()
//#endregion

//#region Computed
const mode = computed(() => preference.mode)
const config = computed(() => backend.config)
const token = computed(() => backend.getCookie('token'))
const route = computed(() => {
  if(config.value.isElectron){
    if(mode.value == -1) return 0
    else if(mode.value == 0) return 2
    else if(mode.value == 1) return 3
    else return
  }
  if(config.value.isExpress){
    if(config.value.backendType == BackendType.SERVER || config.value.backendType == BackendType.NONE){
      if(config.value.login) return 3
      else return 1
    }
    else if(config.value.backendType == BackendType.NODE) return 2
    else if(config.value.backendType == BackendType.CLUSTER) return 4
  }
  return -1
})
//#endregion

//#region Methods
const savePreference = (v:Preference) => {
  backend.send('save_preference', JSON.stringify(v, null, 4), token.value)
}
const locate = (v:string) => {
  const t = i18n.global
  // @ts-ignore
  t.locale = v
  preference!.lan = v
  emitter.emit('updateLocate')
  backend.send('save_preference', JSON.stringify(preference, null, 4), token.value)
}
const setting = () => { settingModal.value = true }
const message = (e:string) => console.log(e)
const preferenceUpdate = (data:Preference) => {
  Object.assign(preference, data)
  locate(preference.lan)
  theme.change(data.theme)
  const t = i18n.global
  // @ts-ignore
  t.locale = preference.lan
  vuetify.defaults.value!.global = data.animation ? {} : defaultTransition.value
}
const load_preference = (x:string) => {
  Object.assign(preference, JSON.parse(x))
  preferenceUpdate(preference)
  backend.send('locate', preference.lan)  
}
const relogin = () => {
  config.value.login = false
  backend.removeCookie('token')
}
const loginGuest = () => {
  config.value.login = true
  backend.removeCookie('token')
  backend.init().then(() => {
    backend.invoke('load_preference', token.value).then(x => load_preference(x))
  })
}
const trylogin = (v:Login) => {
  backend.invoke('load_preference', token.value).then(x => load_preference(x))
}
const UpdateSelection = (mode:number | undefined, url:string | undefined):void => {
  preference.mode = mode
  preference.url = url
  savePreference(preference)
}
//#endregion

onMounted(() => {
  backend.init().then(() => {
    console.log("isElectron", config.value.isElectron)
    console.log("isExpress", config.value.isExpress)
    console.log("isAdmin", config.value.isAdmin)
    console.log("env", process.env.NODE_ENV)
    backend.send('message', 'Welcome Compute Tool')
  })
  defaultTransition.value = vuetify.defaults.value?.global
  emitter.on('relogin', relogin)
  emitter.on('loginGuest', loginGuest)
  emitter.on('login', trylogin)
  emitter.on('savePreference', savePreference)
  emitter.on('setting', setting)
  backend.wait_init().then(() => {
    if(backend.config.haveBackend){
      backend.eventOn('locate', locate)
      backend.invoke('load_preference', token.value).then(x => load_preference(x))
      backend.eventOn('message', message)
    }
  })
})

onUnmounted(() => {
  emitter.off('savePreference', savePreference)
  emitter.off('setting', setting)
  backend.eventOff('locate', locate)
  backend.eventOff('message', message)
})
</script>

<template>
  <!-- The top level component -->
  <v-container fluid class="ma-0 pa-0" :style="{ 'fontSize': preference?.font + 'px' }">
    <!-- This is like router -->
    <ServerClientSelectionPage v-if="route == 0" @selectd="UpdateSelection"/>
    <LoginPage v-else-if="route == 1" :preference="preference" :config="config"/>
    <ClientNodePage v-else-if="route == 2"/>
    <ServerNodePage v-else-if="route == 3"/>
    <ClusterNodePage v-else-if="route == 4"/>
    <span v-else>route: {{ route }} {{ JSON.stringify(config, null, 4) }}</span>
    <!-- Extra components -->
    <Messager />
    <SettingDialog v-model="settingModal" @update="preferenceUpdate" />
  </v-container>
</template>