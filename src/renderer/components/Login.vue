<script setup lang="ts">
//#region Module
import { Emitter } from 'mitt';
import { computed, inject, ref } from 'vue';
import { AppConfig, BusType, Preference } from '../interface';
import { BackendProxy } from '../proxy';
import { i18n } from '../plugins/i18n';
import Layout from './components/layout/Layout.vue';
import AppBar from './components/layout/AppBar.vue';
//#endregion

//#region Data
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const backend:BackendProxy = inject("backend")!
const preference:Preference = inject("preference")!
const account = ref("")
const password = ref("")
//#endregion

//#region Computed
const config = computed(() => backend.config)
//#endregion

//#region Methods
const loginClick = () => {
    emitter?.emit('login', { username: account.value, password: password.value })
    account.value = ""
    password.value = ""
}
const guestClick = () => {
    emitter?.emit('loginGuest')
}
//#endregion
</script>

<template>
    <Layout>
        <!-- Top Appbar -->
        <AppBar :title="$t('login.title')" />

        <div style="height: 25vh;"></div>
        <v-text-field v-model="account" width="40vw" :label="$t('login.account')"></v-text-field>
        <v-text-field v-model="password" width="40vw" :label="$t('login.password')"></v-text-field>
        <v-row>
            <v-col>
                <v-btn @click="loginClick" width="150" color="success">{{ $t('login.submit') }}</v-btn>
            </v-col>
            <v-col>
                <v-btn @click="guestClick" width="150" color="success">{{ $t('login.guest') }}</v-btn>
            </v-col>
        </v-row>
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