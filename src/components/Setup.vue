<script setup lang="ts">
//#region Module
import { Emitter } from 'mitt';
import { computed, inject, Ref, ref } from 'vue';
import { BusType, Preference } from 'verteilen-core/dist/interface';
import { BackendProxy } from '../proxy';
import { i18n } from '../plugins/i18n';
import Layout from './components/layout/Layout.vue';
import AppBar from './components/layout/AppBar.vue';
//#endregion

//#region Data
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const backend:Ref<BackendProxy> = inject("backend")!
const preference:Ref<Preference> = inject("preference")!
const account = ref("")
const password = ref("")
const setup_message = ref("")
const server = ref("http://")
//#endregion

//#region Computed
const config = computed(() => backend.value.config)
//#endregion

//#region Methods
const cleanFields = () => {
    account.value = ""
    password.value = ""
}
const tryConnect = () => {
    return backend.value.create_console_host(server.value, emitter)
}
const loginClick = () => {
    if(config.value.haveBackend){
        emitter.emit('login', { username: account.value, password: password.value })
    }else {
        tryConnect();
    }
}
const guestClick = () => {
    if(config.value.haveBackend){
        emitter.emit('loginGuest')
    }else{
        tryConnect();
    }
}
//#endregion
</script>

<template>
    <Layout>
        <!-- Top Appbar -->
        <AppBar :title="$t('setup.title')" />
        <br />
        <p>{{ setup_message }}</p>
    </Layout>
</template>

<style scoped>
.buttonHeight {
    height: 90px
}
.bg-dark {
    background-image: linear-gradient(to bottom, rgb(33, 33, 33), rgb(33, 40, 48));
}
.bg-light {
    background-image: linear-gradient(to bottom, rgb(240, 240, 240), rgb(240, 247, 255));
}
</style>