<script setup lang="ts">
import { autocompletion } from '@codemirror/autocomplete';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';
import { computed } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { useTheme } from 'vuetify/lib/framework.mjs';

const data = defineModel<string>({required: true})
const theme = useTheme()

const extensions = computed(() => {
    return theme.global.name.value == "dark" ?
    [basicSetup, json(), autocompletion(), oneDark] :
    [basicSetup, json(), autocompletion()]
})

</script>
<template>
    <Codemirror 
        v-model="data" 
        placeholder="Code goes here..."
        :style="{ height: '400px' }"
        :autofocus="true"
        :indent-with-tab="true"
        :tab-size="2"
        :extensions="extensions"/>
</template>