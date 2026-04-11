<script setup lang="ts">
//#region Module
import { Emitter } from 'mitt';
import { computed, inject, onMounted, Ref, ref } from 'vue';
import { BusType, Preference, ServerSetting } from 'verteilen-core/dist/interface';
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
const login_message = ref("")
const server = ref("https://localhost:11080")
const connected:Ref<boolean> = ref(false)
const haveBackend:Ref<boolean> = ref(false)
const server_setting:Ref<ServerSetting | undefined> = ref(undefined)
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
    if(backend.value.consoleM?.connected){
        backend.value.consoleM.close();
        backend.value.consoleM = undefined
        login_message.value = ""
        connected.value = false
    }else{
        backend.value.create_console_host(server.value, emitter).then(x => {
            if(!x) login_message.value = $t("login.connect_failed")
            else login_message.value = $t("login.connect_success")
            connected.value = backend.value.consoleM?.connected ?? false
        }).catch(err => {
            login_message.value = err
            console.error(err)
            connected.value = false
        })
    }
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
onMounted(() => {
    cleanFields()
    backend.value.wait_init().then(() => {
        haveBackend.value = config.value.haveBackend
        server_setting.value = backend.value.setting
    })
})
//#endregion
</script>

<template>
    <Layout>
        <!-- Top Appbar -->
        <AppBar :title="$t('login.title')" />

        <div style="height: 25vh;"></div>
        <div v-if="!haveBackend">
            <v-text-field :disabled="connected" v-model="server" width="40vw" :label="$t('login.server')"></v-text-field>
            <v-btn class="w-100" @click="tryConnect" :disabled="haveBackend" width="150" color="success">
                {{ $t(connected ? 'login.disconnect' : 'login.connect') }}
            </v-btn>
            <br />
            <br />
        </div>
        <div v-if="connected || haveBackend">
            <v-text-field v-model="account" width="40vw" :label="$t('login.account')"></v-text-field>
            <v-text-field v-model="password" width="40vw" :label="$t('login.password')"></v-text-field>
            <v-row class="w-100" v-if="server_setting?.open_guest">
                <v-col>
                    <v-btn class="w-100" @click="loginClick" width="150" color="success">{{ $t('login.submit') }}</v-btn>
                </v-col>
                <v-col>
                    <v-btn class="w-100" @click="guestClick" width="150" color="success">{{ $t('login.guest') }}</v-btn>
                </v-col>
            </v-row>
            <v-btn v-else class="w-100" @click="loginClick" width="150" color="success">{{ $t('login.submit') }}</v-btn>
        </div>
        <br />
        <p>{{ login_message }}</p>
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