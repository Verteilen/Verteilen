<script setup lang="ts">
//#region Modules
import { Emitter } from 'mitt'
import { computed, inject, onMounted, onUnmounted, Ref, ref } from 'vue'
import { useTheme } from 'vuetify'
import { BusType, FrontendState, Login, Preference } from 'verteilen-core/dist/interface'
import { BackendProxy } from './proxy'
import { vuetify } from './plugins/vuetify'
//#endregion

//#region Views
import ClientNodePage from './components/ClientNode.vue'
import LoginPage from './components/Login.vue'
import SetupPage from './components/Setup.vue'
import ServerNodePage from './components/ServerNode.vue'
import ClusterNodePage from './components/ClusterNode.vue'
import SettingDialog from './components/dialog/SettingDialog.vue'
import Messager from './components/Messager.vue'
import { DATA, Util_App } from './App'
//#endregion

//#region Data
const theme = useTheme()
const emitter:Emitter<BusType> = inject('emitter')!
const backend:Ref<BackendProxy> = inject("backend")!
const preference:Ref<Preference> = inject("preference")!
const data:Ref<DATA> = ref({
  settingModal: false,
  defaultTransition: undefined
})
const state:Ref<FrontendState> = ref(FrontendState.NONE)
let state_updater:any = undefined
//#endregion

//#region Computed
const mode = computed(() => preference.value.mode)
const config = computed(() => backend.value.config)
const token = computed(() => backend.value.getCookie('token'))
const util = new Util_App(data, theme, emitter, backend, preference, token)
//#endregion

//#region Methods
const loginGuest = () => {
  config.value.login = true
  backend.value.removeCookie('token')
  backend.value.init().then(() => {
    backend.value.invoke('load_preference', token.value).then(x => util.load_preference(x))
  })
}
const trylogin = (v:Login) => {
  backend.value.invoke('load_preference', token.value).then(x => util.load_preference(x))
  backend.value.invoke('login')
}
/**
 * Because object cannot trigger vue update cycle, so we create a interval get update the state in the page\
 * This will decide the current showing page
 */
const updateState = () => {
  state.value = backend.value.state()
}
//#endregion

onMounted(() => {
  backend.value.init().then(() => {
    console.log("haveBackend", config.value.haveBackend)
    console.log("backendType", config.value.backendType)
    console.log("setup", config.value.setup)
    console.log("isAdmin", config.value.isAdmin)
    console.log("env", process.env.NODE_ENV)
    backend.value.send('message', 'Welcome Compute Tool')
    if(config.value.haveBackend){
      backend.value.create_console_host(window.location.href, emitter).then(x => {
        console.debug("[Debug] create_console_host", x)
      }).catch(err => { console.error(err) })
    }
  })
  state_updater = setInterval(updateState, 50);
  data.value.defaultTransition = vuetify.defaults.value?.global
  emitter.on('guide', util.guide)
  emitter.on('loginGuest', loginGuest)
  emitter.on('login', trylogin)
  emitter.on('savePreference', util.save_preference)
  emitter.on('setting', util.setting)
  backend.value.wait_init().then(() => {
    if(backend.value.config.haveBackend){
      backend.value.eventOn('locate', util.locate)
      backend.value.eventOn('message', util.message);
    }
  })
})

onUnmounted(() => {
  clearImmediate(state_updater)
  emitter.off('guide', util.guide)
  emitter.off('savePreference', util.save_preference)
  emitter.off('setting', util.setting)
  backend.value.eventOff('locate')
  backend.value.eventOff('message')
})
</script>

<template>
  <!-- The top level component -->
  <v-container fluid class="ma-0 pa-0" :style="{ 'fontSize': preference?.font + 'px' }">
    <!-- This is like router -->
    <LoginPage v-if="state == FrontendState.LOGOUT_BACKEND || state == FrontendState.LOGOUT_STATIC" :preference="preference" :config="config"/>
    <ClientNodePage v-else-if="state == FrontendState.NODE"/>
    <ServerNodePage v-else-if="state == FrontendState.LOGIN_BACKEND || state == FrontendState.LOGIN_STATIC" />
    <ClusterNodePage v-else-if="state == FrontendState.CLUSTER"/>
    <SetupPage v-else-if="state == FrontendState.SETUP_BACKEND || state == FrontendState.SETUP_STATIC"/>
    <span v-else>route: {{ state }} {{ JSON.stringify(config, null, 4) }}</span>
    <!-- Extra components -->
    <Messager />
    <SettingDialog v-model="data.settingModal" @update="e => util.update_preference(e)" />
  </v-container>
</template>