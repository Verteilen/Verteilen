<script setup lang="ts">
import { keymap } from '@codemirror/view';
import { autocompletion, Completion, CompletionContext, CompletionResult, snippetCompletion } from '@codemirror/autocomplete';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { defaultKeymap } from "@codemirror/commands"
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';
import { computed } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { useTheme } from 'vuetify/lib/framework.mjs';
import { i18n } from '../../../plugins/i18n';

const data = defineModel<string>({required: true})
const theme = useTheme()

const completions:Array<Completion> = [
    {label: "abstract", type: "keyword"},
    {label: "break", type: "keyword"},
    {label: "char", type: "keyword"},
    {label: "debugger", type: "keyword"},
    {label: "double", type: "keyword"},
    {label: "export", type: "keyword"},
    {label: "finally", type: "keyword"},
    {label: "goto", type: "keyword"},
    {label: "in", type: "keyword"},
    {label: "let", type: "keyword"},
    {label: "null", type: "keyword"},
    {label: "public", type: "keyword"},
    {label: "super", type: "keyword"},
    {label: "throw", type: "keyword"},
    {label: "try", type: "keyword"},
    {label: "volatile", type: "keyword"},


    {label: "arguments", type: "keyword"},
    {label: "byte", type: "keyword"},
    {label: "class", type: "keyword"},
    {label: "default", type: "keyword"},
    {label: "else", type: "keyword"},
    {label: "extends", type: "keyword"},
    {label: "float", type: "keyword"},
    {label: "if", type: "keyword"},
    {label: "instanceof", type: "keyword"},
    {label: "long", type: "keyword"},
    {label: "package", type: "keyword"},
    {label: "return", type: "keyword"},
    {label: "return", type: "keyword"},
    {label: "throws", type: "keyword"},
    {label: "typeof", type: "keyword"},
    {label: "while", type: "keyword"},


    {label: "await", type: "keyword"},
    {label: "case", type: "keyword"},
    {label: "const", type: "keyword"},
    {label: "delete", type: "keyword"},
    {label: "enum", type: "keyword"},
    {label: "false", type: "keyword"},
    {label: "for", type: "keyword"},
    {label: "implements", type: "keyword"},
    {label: "int", type: "keyword"},
    {label: "native", type: "keyword"},
    {label: "private", type: "keyword"},
    {label: "short", type: "keyword"},
    {label: "synchronized", type: "keyword"},
    {label: "transient", type: "keyword"},
    {label: "var", type: "keyword"},
    {label: "with", type: "keyword"},

    {label: "boolean", type: "keyword"},
    {label: "catch", type: "keyword"},
    {label: "continue", type: "keyword"},
    {label: "do", type: "keyword"},
    {label: "eval", type: "keyword"},
    {label: "final", type: "keyword"},
    {label: "function", type: "keyword"},
    {label: "import", type: "keyword"},
    {label: "interface", type: "keyword"},
    {label: "new", type: "keyword"},
    {label: "protected", type: "keyword"},
    {label: "static", type: "keyword"},
    {label: "this", type: "keyword"},
    {label: "true", type: "keyword"},
    {label: "void", type: "keyword"},
    {label: "yield", type: "keyword"},


    {label: "path", type: "variable", info: i18n.global.t('codehint.path')},
    {label: "os", type: "variable", info: i18n.global.t('codehint.os')},
    {label: "env", type: "variable", info: i18n.global.t('codehint.env')},
    {label: "message", type: "variable", info: i18n.global.t('codehint.message')},
    {label: "http", type: "variable", info: i18n.global.t('codehint.http')},
    {label: "setTimeout", type: "variable", info: i18n.global.t('codehint.setTimeout')},
    {label: "wait", type: "variable", info: i18n.global.t('codehint.wait')},
    {label: "sleep", type: "variable", info: i18n.global.t('codehint.sleep')},
    {label: "console", type: "variable", info: i18n.global.t('codehint.console')},
    {label: "JSON", type: "variable", info: i18n.global.t('codehint.json')},
];

const completions_json:Array<Completion> = [
    {label: "parse", type: "variable", section: "JSON.", info: i18n.global.t('codehint.json')},
    {label: "stringify", type: "variable", section: "JSON.", info: i18n.global.t('codehint.json')},
]

const completions_log:Array<Completion> = [
    {label: "log", type: "variable", section: "console.", info: i18n.global.t('codehint.json')},
]

const completions_path:Array<Completion> = [
    {label: "filename", type: "variable", section: "path.", info: i18n.global.t('codehint.json')},
    {label: "extname", type: "variable", section: "path.", info: i18n.global.t('codehint.json')},
    {label: "dirname", type: "variable", section: "path.", info: i18n.global.t('codehint.json')},
]

const completions_os:Array<Completion> = [
    {label: "exec", type: "variable", section: "os.", info: i18n.global.t('codehint.json')},
    {label: "command", type: "variable", section: "os.", info: i18n.global.t('codehint.json')},
    {label: "plugin_exec", type: "variable", section: "os.", info: i18n.global.t('codehint.json')},
    {label: "plugin_command", type: "variable", section: "os.", info: i18n.global.t('codehint.json')},
    {label: "copyfile", type: "variable", section: "os.", info: i18n.global.t('codehint.json')},
    {label: "deletefile", type: "variable", section: "os.", info: i18n.global.t('codehint.json')},
    {label: "deletedir", type: "variable", section: "os.", info: i18n.global.t('codehint.json')},
    {label: "exist", type: "variable", section: "os.", info: i18n.global.t('codehint.json')},
    {label: "listfile", type: "variable", section: "os.", info: i18n.global.t('codehint.json')},
    {label: "listdir", type: "variable", section: "os.", info: i18n.global.t('codehint.json')},
    {label: "createdir", type: "variable", section: "os.", info: i18n.global.t('codehint.json')},
    {label: "writefile", type: "variable", section: "os.", info: i18n.global.t('codehint.json')},
    {label: "readfile", type: "variable", section: "os.", info: i18n.global.t('codehint.json')},
    {label: "rename", type: "variable", section: "os.", info: i18n.global.t('codehint.json')},
]

const completions_env:Array<Completion> = [
    {label: "has", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "get", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "set", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "hasboolean", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "getboolean", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "setboolean", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "hasnumber", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "getnumber", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "setnumber", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "hasstring", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "getstring", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "setstring", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "hasobject", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "getobject", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "setobject", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "haslist", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "getlist", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "setlist", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "hasselect", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "getselect", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "setselect", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
    {label: "getselectlength", type: "variable", section: "env.", info: i18n.global.t('codehint.json')},
]

const completions_message:Array<Completion> = [
    {label: "messager", type: "variable", section: "m.", info: i18n.global.t('codehint.json')},
    {label: "messager_log", type: "variable", section: "m.", info: i18n.global.t('codehint.json')},
]

const sections = [
    { label: "JSON.", data: completions_json },
    { label: "log.", data: completions_log },
    { label: "path.", data: completions_path },
    { label: "os.", data: completions_os },
    { label: "env.", data: completions_env },
    { label: "m.", data: completions_message }
]

const keywordCompletions = (context:CompletionContext):CompletionResult | null => {
    let word = context.matchBefore(/\w*/)
    let bword = context.matchBefore(/[\w]+[.&]/g)
    if(word == null) return null
    if (word.from == word.to && !context.explicit) {
        for(let section of sections){
            if(bword?.text != section.label) continue;
            return {
                from: word.from,
                options: section.data
            }
        }
        return null
    }
    return {
        from: word.from,
        options: completions
    }
}

const extensions = computed(() => {
    const j = javascript()
    const a = autocompletion({override: [keywordCompletions]})
    return theme.global.name.value == "dark" ?
    [basicSetup, keymap.of(defaultKeymap), j, a, oneDark] :
    [basicSetup, keymap.of(defaultKeymap), j, a]
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