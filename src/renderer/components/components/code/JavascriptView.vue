<script setup lang="ts">
import { hoverTooltip, keymap, tooltips } from '@codemirror/view';
import { autocompletion, Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
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


    {label: "path", type: "variable", info: i18n.global.t('codehint.v_path')},
    {label: "os", type: "variable", info: i18n.global.t('codehint.v_os')},
    {label: "env", type: "variable", info: i18n.global.t('codehint.v_env')},
    {label: "message", type: "variable", info: i18n.global.t('codehint.v_message')},
    {label: "http", type: "variable", info: i18n.global.t('codehint.v_http')},
    {label: "setTimeout", apply: "setTimeout(() => {\n\n}, 1000)", type: "function", info: i18n.global.t('codehint.v_setTimeout')},
    {label: "wait", apply: "wait()", type: "function", info: i18n.global.t('codehint.v_wait')},
    {label: "sleep", apply: "sleep()", type: "function", info: i18n.global.t('codehint.v_sleep')},
    {label: "console", type: "variable", info: i18n.global.t('codehint.v_console')},
    {label: "JSON", type: "variable", info: i18n.global.t('codehint.v_json')},
];

const completions_json:Array<Completion> = [
    {label: "parse", apply: "parse(\"\")", type: "function", section: "JSON.", info: i18n.global.t('codehint.json.parse')},
    {label: "stringify", apply: "stringify(obj, null, 2)", type: "function", section: "JSON.", info: i18n.global.t('codehint.json.stringify')},
]

const completions_log:Array<Completion> = [
    {label: "log", apply: "log(\"\")", type: "function", section: "console.", info: i18n.global.t('codehint.console.log')},
]

const completions_path:Array<Completion> = [
    {label: "filename", apply: "filename(\"\", true", type: "function", section: "path.", info: i18n.global.t('codehint.path.filename')},
    {label: "extname", apply: "extname(\"\")", type: "function", section: "path.", info: i18n.global.t('codehint.path.extname')},
    {label: "dirname", apply: "dirname(\"\")", type: "function", section: "path.", info: i18n.global.t('codehint.path.dirname')},
]

const completions_os:Array<Completion> = [
    {label: "exec", apply: "exec(\"command\", \"arg\", \"cwd?\")", type: "function", section: "os.", info: i18n.global.t('codehint.os.exec')},
    {label: "command", apply: "command(\"command\", \"arg\", \"cwd?\")", type: "function", section: "os.", info: i18n.global.t('codehint.os.command')},
    {label: "plugin_exec", apply: "plugin_exec(\"command\", \"arg\")", type: "function", section: "os.", info: i18n.global.t('codehint.os.plugin_exec')},
    {label: "plugin_command", apply: "plugin_command(\"command\", \"arg\")", type: "function", section: "os.", info: i18n.global.t('codehint.os.plugin_command')},
    {label: "copyfile", apply: "copyfile(\"from\", \"to\")", type: "function", section: "os.", info: i18n.global.t('codehint.os.copyfile')},
    {label: "copydir", apply: "copydir(\"from\", \"to\")", type: "function", section: "os.", info: i18n.global.t('codehint.os.copydir')},
    {label: "deletefile", apply: "deletefile(\"path\")", type: "function", section: "os.", info: i18n.global.t('codehint.os.deletefile')},
    {label: "deletedir", apply: "deletedir(\"path\")", type: "function", section: "os.", info: i18n.global.t('codehint.os.deletedir')},
    {label: "exist", apply: "exist(\"path\")", type: "function", section: "os.", info: i18n.global.t('codehint.os.exist')},
    {label: "listfile", apply: "listfile(\"path\")", type: "function", section: "os.", info: i18n.global.t('codehint.os.listfile')},
    {label: "listdir", apply: "listdir(\"path\")", type: "function", section: "os.", info: i18n.global.t('codehint.os.listdir')},
    {label: "createdir", apply: "createdir(\"path\")", type: "function", section: "os.", info: i18n.global.t('codehint.os.createdir')},
    {label: "writefile", apply: "writefile(\"path\", \"content\")", type: "function", section: "os.", info: i18n.global.t('codehint.os.writefile')},
    {label: "readfile", apply: "readfile(\"path\")", type: "function", section: "os.", info: i18n.global.t('codehint.os.readfile')},
    {label: "rename", apply: "rename(\"from\", \"to\")", type: "function", section: "os.", info: i18n.global.t('codehint.os.rename')},
]

const completions_env:Array<Completion> = [
    {label: "has", apply: "has(\"key\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.has')},
    {label: "get", apply: "get(\"key\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.get')},
    {label: "set", apply: "set(\"key\", \"value\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.set')},
    {label: "hasboolean", apply: "hasboolean(\"key\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.hasboolean')},
    {label: "getboolean", apply: "getboolean(\"key\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.getboolean')},
    {label: "setboolean", apply: "setboolean(\"key\", true)", type: "function", section: "env.", info: i18n.global.t('codehint.env.setboolean')},
    {label: "hasnumber", apply: "hasnumber(\"key\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.hasnumber')},
    {label: "getnumber", apply: "getnumber(\"key\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.getnumber')},
    {label: "setnumber", apply: "setnumber(\"key\", 0)", type: "function", section: "env.", info: i18n.global.t('codehint.env.setnumber')},
    {label: "hasstring", apply: "hasstring(\"key\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.hasstring')},
    {label: "getstring", apply: "getstring(\"key\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.getstring')},
    {label: "setstring", apply: "setstring(\"key\", \"value\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.setstring')},
    {label: "hasobject", apply: "hasobject(\"key\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.hasobject')},
    {label: "getobject", apply: "getobject(\"key\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.getobject')},
    {label: "setobject", apply: "setobject(\"key\", {})", type: "function", section: "env.", info: i18n.global.t('codehint.env.setobject')},
    {label: "haslist", apply: "haslist(\"key\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.haslist')},
    {label: "getlist", apply: "getlist(\"key\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.getlist')},
    {label: "setlist", apply: "setlist(\"key\", [])", type: "function", section: "env.", info: i18n.global.t('codehint.env.setlist')},
    {label: "hasselect", apply: "hasselect(\"key\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.hasselect')},
    {label: "getselect", apply: "getselect(\"key\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.getselect')},
    {label: "setselect", apply: "setselect(\"key\", 0)", type: "function", section: "env.", info: i18n.global.t('codehint.env.setselect')},
    {label: "getselectlength", apply: "getselectlength(\"key\")", type: "function", section: "env.", info: i18n.global.t('codehint.env.getselectlength')},
]

const completions_message:Array<Completion> = [
    {label: "messager", apply: "messager(\"message\")", type: "function", section: "m.", info: i18n.global.t('codehint.m.messager')},
    {label: "messager_log", apply: "messager_log(\"message\")", type: "function", section: "m.", info: i18n.global.t('codehint.m.messager_log')},
]

const sections = [
    { label: "JSON.", data: completions_json },
    { label: "console.", data: completions_log },
    { label: "path.", data: completions_path },
    { label: "os.", data: completions_os },
    { label: "env.", data: completions_env },
    { label: "m.", data: completions_message }
]

const keywordCompletions = (context:CompletionContext):CompletionResult | null => {
    let full = context.matchBefore(/.+/g)
    let word = context.matchBefore(/\w*/)
    let bword = context.matchBefore(/[\w]+[.&]/g)
    if(word == null) return null
    if (word.from == word.to && !context.explicit) {
        const a:Array<Completion> = []
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
    const k = keymap.of(defaultKeymap)
    const j = javascript()
    const a = autocompletion({override: [keywordCompletions]})
    return theme.global.name.value == "dark" ?
    [basicSetup, k, j, a, oneDark] :
    [basicSetup, k, j, a]
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