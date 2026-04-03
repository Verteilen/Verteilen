<script lang="ts" setup>
import { inject, Ref } from 'vue';
import { Preference } from 'verteilen-core/dist/interface';

const preference:Ref<Preference> = inject("preference")!

</script>

<template>
    <div style="margin: 0; padding-top: 16px; width: 100vw; height: calc(100vh - 56px); place-items: center;"
        :class="{ 'bg-dark': preference.theme == 'dark', 'bg-light': preference.theme == 'light' }">
        <!-- Top Appbar -->
        <AppBar />
    </div>
</template>