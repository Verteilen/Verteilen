<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, ref } from 'vue';
import { AppConfig, BusType, Preference, ToastData } from '../interface';

interface PROPS {
    config: AppConfig
    preference: Preference
}

const emitter:Emitter<BusType> | undefined = inject('emitter');
const propss = defineProps<PROPS>()
const account = ref("")
const password = ref("")

const loginClick = () => {

}

</script>

<template>
    <div style="margin: 0; padding:35vh 10vw; width: 100vw; height: 100vh; place-items: center;"
        :class="{ 'bg-dark': propss.preference.theme == 'dark', 'bg-light': propss.preference.theme == 'light' }">
        <h3 class="text-info mb-4" :style="{ 'fontSize': (propss.preference.font + 6) + 'px' }">{{ $t('login.title') }}</h3>
        <v-text-field v-model="account" width="40vw" :label="$t('login.account')"></v-text-field>
        <v-text-field v-model="password" width="40vw" :label="$t('login.password')"></v-text-field>
        <v-btn @click="loginClick" width="150" color="success">{{ $t('login.submit') }}</v-btn>
    </div>
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