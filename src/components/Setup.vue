<script setup lang="ts">
//#region Module
import { Emitter } from 'mitt';
import { computed, inject, onMounted, Ref, ref } from 'vue';
import { AuthDB, AuthService, AuthType, BusType, ContentDB, ContentService, ContentType, CreateServerSetupRequire, Preference, ServerSetupRequire } from 'verteilen-core/dist/interface';
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
//#endregion

//#region Computed
const config = computed(() => backend.value.config)
//#endregion

//#region Methods
const clean_message = () => {
    setup_message.value = ""
}
const confirm = () => {
    if(server_setting.value.root!.root_username.length == 0){
        setup_message.value = $t("setup.message.username_empty")
        return;
    }
    if(server_setting.value.root!.root_password.length == 0){
        setup_message.value = $t("setup.message.password_empty")
        return;
    }
    if(server_setting.value.root!.root_username.length == 8){
        setup_message.value = $t("setup.message.username_limit")
        return;
    }
    if(server_setting.value.root!.root_password.length == 8){
        setup_message.value = $t("setup.message.password_limit")
        return;
    }
    backend.value.invoke("setup_server", server_setting.value).then(x => {
        alert($t('setup.success'))
        location.reload()
    })
}
//#endregion

onMounted(() => {
    server_setting.value.root.root_username = "root";
})
</script>

<template>
    <Layout>
        <!-- Top Appbar -->
        <AppBar :title="$t('setup.title')" />

        <div style="height: 25vh;"></div>
        <v-text-field v-model="server_setting.root!.root_username" 
            @onchange="clean_message"
            width="40vw" 
            :label="$t('setup.account')"></v-text-field>
        <v-text-field v-model="server_setting.root!.root_password" 
            @onchange="clean_message"
            width="40vw" 
            :label="$t('setup.password')"></v-text-field>
        <h2>{{ $t("setup.auth") }}</h2>
        <v-select 
            @onchange="clean_message"
            :label="$t('setup.auth_type')" 
            v-model="server_setting.setting!.auth.auth_type" 
            width="40vw" :items="[
                { title: $t('setup.auth_types.self'), value: AuthType.SELF, disabled: false },
                { title: $t('setup.auth_types.external'), value: AuthType.EXTERNAL, disabled: true },
                { title: $t('setup.auth_types.service'), value: AuthType.SERVICE, disabled: true },
        ]">
            <template v-slot:item="{ props, item }">
                <v-list-item
                    v-bind="props"
                    :disabled="item.raw.disabled">
                </v-list-item>
            </template>
        </v-select>
        <v-select v-if="server_setting.setting!.auth.auth_type == 1" 
            @onchange="clean_message"
            v-model="server_setting.setting!.auth.auth_db" 
            :label="$t('setup.auth_db')" 
            width="40vw" 
            :items="[
                { title: 'MongoDB', value: AuthDB.MONGODB, disabled: false },
                { title: 'Sqlite3', value: AuthDB.SQLITE3, disabled: true },
        ]">
            <template v-slot:item="{ props, item }">
                <v-list-item
                    v-bind="props"
                    :disabled="item.raw.disabled">
                </v-list-item>
            </template>
        </v-select>
        <v-select v-if="server_setting.setting!.auth.auth_type == 2" 
            @onchange="clean_message"
            v-model="server_setting.setting!.auth.auth_service" 
            :label="$t('setup.auth_service')" 
            width="40vw" 
            :items="[
                { title: 'Auth0', value: AuthService.AUTH0, disabled: true },
                { title: 'Clerk', value: AuthService.CLERK, disabled: true },
                { title: 'Firebase', value: AuthService.FIREBASE, disabled: false },
                { title: 'Supabase', value: AuthService.SUPABASE, disabled: true },
        ]">
            <template v-slot:item="{ props, item }">
                <v-list-item
                    v-bind="props"
                    :disabled="item.raw.disabled">
                </v-list-item>
            </template>
        </v-select>
        <h2>{{ $t("setup.content") }}</h2>
        <v-select 
            @onchange="clean_message"
            :label="$t('setup.content_type')" 
            v-model="server_setting.setting!.content.content_type" 
            width="40vw" :items="[
                { title: $t('setup.content_types.local'), value: ContentType.LOCAL, disabled: false },
                { title: $t('setup.content_types.external'), value: ContentType.EXTERNAL, disabled: true },
                { title: $t('setup.content_types.service'), value: ContentType.SERVICE, disabled: true },
        ]">
            <template v-slot:item="{ props, item }">
                <v-list-item
                    v-bind="props"
                    :disabled="item.raw.disabled">
                </v-list-item>
            </template>
        </v-select>
        <v-select v-if="server_setting.setting!.content.content_type == 1" 
            @onchange="clean_message"
            v-model="server_setting.setting!.content.content_db" 
            :label="$t('setup.content_db')" 
            width="40vw" 
            :items="[
                { title: 'MongoDB', value: ContentDB.MONGODB, disabled: false },
                { title: 'FTP', value: ContentDB.FTP, disabled: false },
        ]">
        </v-select>
        <v-select v-if="server_setting.setting!.content.content_type == 2" 
            @onchange="clean_message"
            v-model="server_setting.setting!.content.content_service" 
            :label="$t('setup.content_service')" 
            width="40vw" 
            :items="[
                { title: 'BigTable', value: ContentService.BIGTABLE, disabled: true },
                { title: 'Cosmos', value: ContentService.COSMOS, disabled: true },
                { title: 'DynamoDB', value: ContentService.DYNAMODB, disabled: true },
                { title: 'MongoDB', value: ContentService.MONGODB, disabled: false },
        ]">
            <template v-slot:item="{ props, item }">
                <v-list-item
                    v-bind="props"
                    :disabled="item.raw.disabled">
                </v-list-item>
            </template>
        </v-select>

        <v-checkbox 
            @onchange="clean_message"
            :label="$t('setup.open_guest')" 
            v-model="server_setting.setting!.open_guest"></v-checkbox>
        <v-checkbox 
            @onchange="clean_message"
            :label="$t('setup.open_register')" 
            v-model="server_setting.setting!.open_register"></v-checkbox>

        <v-btn @click="confirm" width="40vw" color="success">{{ $t('confirm') }}</v-btn>

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