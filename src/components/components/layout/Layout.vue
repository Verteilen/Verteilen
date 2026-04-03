<script lang="ts" setup>
import { Preference } from 'verteilen-core/dist/interface';
import { inject, Ref } from 'vue';

const preference:Ref<Preference> = inject("preference")!
</script>

<template>
    <div style="margin: 0; padding-top: 16px; width: 100vw; height: 100vh; place-items: center;"
        :class="{ 'bg-dark': preference.theme == 'dark', 'bg-light': preference.theme == 'light' }">
        <slot></slot>
    </div>
</template>