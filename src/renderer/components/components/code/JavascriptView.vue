<script setup lang="ts">
import { keymap } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';
import { javascript, snippets } from '@codemirror/lang-javascript';
import { defaultKeymap } from "@codemirror/commands"
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';
import { computed } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { useTheme } from 'vuetify/lib/framework.mjs';
import { linter } from '@codemirror/lint';

const data = defineModel<string>({required: true})
const theme = useTheme()

const extensions = computed(() => {
    return theme.global.name.value == "dark" ?
    [basicSetup, keymap.of(defaultKeymap), javascript(), autocompletion(), oneDark] :
    [basicSetup, keymap.of(defaultKeymap), javascript(), autocompletion()]
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