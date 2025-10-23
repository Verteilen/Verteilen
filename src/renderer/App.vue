<script setup lang="ts">
import { Emitter } from 'mitt'
import { computed, inject, onMounted, onUnmounted, Ref, ref } from 'vue'
import { useTheme } from 'vuetify'
import ClientNode from './components/ClientNode.vue'
import Messager from './components/Messager.vue'
import Login from './components/Login.vue'
import ServerClientSelection from './components/ServerClientSelection.vue'
import ServerNode from './components/ServerNode.vue'
import SettingDialog from './components/dialog/SettingDialog.vue'
import { BusType, Preference, Setter, WebPORT } from 'verteilen-core'
import { I18N } from 'verteilen-core'
import { BackendProxy } from './proxy'
import { vuetify } from './plugins/vuetify'

const theme = useTheme()
const i18n = I18N.i18n
const emitter:Emitter<BusType> | undefined = inject('emitter');
const preference:Ref<Preference> = ref({
  lan: 'en',
  log: false,
  font: 16,
  notification: false,
  theme: "dark",
  plugin_token: [],
  animation: true,
})
const backend:Ref<BackendProxy> = ref(new BackendProxy())
const config = computed(() => backend.value.config)

const login = ref(false)
const mode = ref(config.value.isElectron ? -1 : 1)
const settingModal = ref(false)
const defaultTransition = ref()

const token = computed(() => {
  return backend.value.getCookie('token')
})

backend.value.init().then(() => {
  console.log("isElectron", config.value.isElectron)
  console.log("isExpress", config.value.isExpress)
  console.log("isAdmin", config.value.isAdmin)
  console.log("env", process.env.NODE_ENV)
  backend.value.send('message', 'Welcome Compute Tool')
})

const modeSelect = (isclient:boolean) => {
  mode.value = isclient ? 0 : 1
}

const savePreference = (v:Preference) => {
  backend.value.send('save_preference', JSON.stringify(preference.value, null, 4), token.value)
}

const locate = (v:string) => {
  const t = i18n.global
  // @ts-ignore
  t.locale = v
  preference.value.lan = v
  emitter?.emit('updateLocate')
  backend.value.send('save_preference', JSON.stringify(preference.value, null, 4), token.value)
}

const setting = () => { settingModal.value = true }
const message = (e:string) => console.log(e)

const preferenceUpdate = (data:Preference) => {
  Object.assign(preference.value, data)
  locate(preference.value.lan)
  theme.global.name.value = data.theme
  const t = i18n.global
  // @ts-ignore
  t.locale = preference.value.lan
  vuetify.defaults.value!.global = data.animation ? {} : defaultTransition.value
}

const load_preference = (x:string) => {
  preference.value = JSON.parse(x)
  console.log("load_preference", preference.value)
  preferenceUpdate(preference.value)
  backend.value.send('locate', preference.value.lan)  
}

const relogin = () => {
  config.value.login = false
  mode.value = -1
  backend.value.removeCookie('token')
  login.value = true
}

const loginGuest = () => {
  login.value = false
  backend.value.removeCookie('token')
  backend.value.init().then(() => {
    backend.value.invoke('load_preference', token.value).then(x => load_preference(x))
    mode.value = 1
  })
}

const trylogin = (v:Setter) => {
  backend.value.invoke('load_preference', token.value).then(x => load_preference(x))
}

onMounted(() => {
  defaultTransition.value = vuetify.defaults.value?.global
  emitter?.on('relogin', relogin)
  emitter?.on('loginGuest', loginGuest)
  emitter?.on('login', trylogin)
  emitter?.on('savePreference', savePreference)
  emitter?.on('modeSelect', modeSelect)
  emitter?.on('setting', setting)
  backend.value.wait_init().then(() => {
    if(backend.value.config.haveBackend){
      backend.value.eventOn('locate', locate)
      backend.value.invoke('load_preference', token.value).then(x => load_preference(x))
      backend.value.eventOn('message', message)
    }
  })
  
})

onUnmounted(() => {
  emitter?.off('savePreference', savePreference)
  emitter?.off('modeSelect', modeSelect)
  emitter?.off('setting', setting)
  backend.value.eventOff('locate', locate)
  backend.value.eventOff('message', message)
})

</script>

<template>
  <v-container fluid class="ma-0 pa-0" :style="{ 'fontSize': preference.font + 'px' }">
    <ServerClientSelection v-model.number="mode" v-if="mode == -1 && config.isElectron" :preference="preference" :config="config"/>
    <Login v-else-if="config.isExpress && !config.login && login" :preference="preference" :config="config"/>
    <ClientNode v-else-if="config.isElectron && mode == 0" :preference="preference" :backend="backend"/>
    <ServerNode v-else-if="mode == 1" :preference="preference" :backend="backend"/>
    <Messager :preference="preference" :backend="backend" />
    <SettingDialog v-model="settingModal" :item="preference" @update="preferenceUpdate" />
  </v-container>
</template>

<style lang="css">

</style>