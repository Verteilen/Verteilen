<script setup lang="ts">
//#region Module
import { Emitter } from 'mitt';
import { computed, inject, Ref, ref } from 'vue';
import { AuthDB, AuthService, AuthType, BusType, CreateServerSetupRequire, Preference, ServerSetupRequire } from 'verteilen-core/dist/interface';
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
const server_setting:Ref<ServerSetupRequire> = ref(CreateServerSetupRequire())
const setup_message = ref("")
const server = ref("http://")
//#endregion

//#region Computed
const config = computed(() => backend.value.config)
//#endregion

//#region Methods
const tryConnect = () => {
    return backend.value.create_console_host(server.value, emitter)
}
//#endregion
</script>

<template>
    <Layout>
        <!-- Top Appbar -->
        <AppBar :title="$t('setup.title')" />

        <div style="height: 25vh;"></div>
        <v-text-field v-model="server_setting.root!.root_username" width="40vw" :label="$t('setup.account')"></v-text-field>
        <v-text-field v-model="server_setting.root!.root_password" width="40vw" :label="$t('setup.password')"></v-text-field>
        <h2>{{ $t("setup.auth") }}</h2>
        <v-select :label="$t('setup.auth_type')" v-model="server_setting.setting!.auth.auth_db" width="40vw">

        </v-select>
        <v-select :label="$t('setup.auth_db')" width="40vw">

        </v-select>
        <v-select :label="$t('setup.auth_service')" width="40vw">

        </v-select>
        <h2>{{ $t("setup.content") }}</h2>
        <v-select :label="$t('setup.content_type')" v-model="server_setting.setting!.content.content_db" width="40vw">

        </v-select>
        <v-select :label="$t('setup.content_db')" width="40vw">

        </v-select>
        <v-select :label="$t('setup.content_service')" width="40vw">

        </v-select>

        <v-checkbox :label="$t('setup.open_guest')" v-model="server_setting.setting!.open_guest"></v-checkbox>
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