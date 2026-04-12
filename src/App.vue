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
const init = ref(false)
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
/**
 * Because object cannot trigger vue update cycle, so we create a interval get update the state in the page\
 * This will decide the current showing page
 */
const updateState = () => {
  state.value = init ? backend.value.state() : FrontendState.NONE
}
//#endregion

onMounted(() => {
  /**
   * Trying to init the proxy component first
   * this will trying to figure out the current state
   */
  backend.value.init().then(() => {
    console.log("haveBackend", config.value.haveBackend)
    console.log("backendType", config.value.backendType)
    console.log("setup", config.value.setup)
    console.log("isAdmin", config.value.isAdmin)
    console.log("env", process.env.NODE_ENV)
    backend.value.send('message', 'Welcome Compute Tool')
    if(config.value.haveBackend){
      /**
       * This means this frontend is coming from server, it's not a static-website
       * In this case we could just connect it with socket-io client
       */
      backend.value.create_console_host(window.location.href, emitter).then(x => {
        console.debug("[Debug] create_console_host", x)
        init.value = true
        /**
         * After socket-io created
         * We can bind events now
         */
        backend.value.eventOn('locate', util.locate)
        backend.value.eventOn('message', util.message);
      }).catch(err => { console.error(err) })
      // 
    }else{
      init.value = true
    }
  })
  /**
   * Since the proxy object is a pure typescript class
   * This does not hook with vue computed easily
   * So i made this setInterval to fetch the state
   */
  state_updater = setInterval(updateState, 50);
  data.value.defaultTransition = vuetify.defaults.value?.global
  /**
   * Binding in vue eco-system events
   */
  emitter.on('guide', util.guide)
  emitter.on('loginGuest', loginGuest)
  emitter.on('savePreference', util.save_preference)
  emitter.on('setting', util.setting)
})

onUnmounted(() => {
  clearImmediate(state_updater)
  emitter.off('guide', util.guide)
  emitter.off('loginGuest', loginGuest)
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