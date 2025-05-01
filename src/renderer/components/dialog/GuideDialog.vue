<script setup lang="ts">
import * as marked from 'marked';
import { Ref, ref, watch } from 'vue';
import { Preference } from '../../interface';

interface PROPS {
    preference: Preference
}

const modal = defineModel<boolean>({ required: true })
const props = defineProps<PROPS>()
const pages:Ref<Array<[string, number, string]>> = ref([
    ["guides.core", 0, "core"],
    ["guides.workflow", 0, "workflow"],
    ["guides.ui", 0, "ui"],
    ["guides.project", 0, "project"],
    ["guides.task", 0, "task"],
    ["guides.job", 0, "job"],
    ["guides.parameter", 0, "parameter"],
    ["guides.console", 0, "console"],
])
const page = ref(0)
const text = ref('')
const html = ref('')

watch(() => page.value, () => {
    const target = pages.value[page.value]
    const url = process.env.NODE_ENV === 'development' ? `./../../assets/guide/${props.preference.lan}/${target[2]}.md` : `./guide/${props.preference.lan}/${target[2]}.md`
    fetch(url).then(x => {
        x.text().then(y => {
            marked.use({
                pedantic: false,
                gfm: true,
                breaks: true
            })
            text.value = y
            html.value = marked.parse(y).toString()
        })
    })
})

</script>

<template>
    <v-dialog width="80vw" v-model="modal" class="text-white">
        <v-card>
            <v-card-title>
                <v-icon>mdi-book</v-icon>
                <span>{{ $t('guide') }}</span>
            </v-card-title>
            <v-card-text>
                <v-row style="min-height: 50vh; max-height: 70vh;">
                    <v-col cols="3" class="border-e-lg" style="max-height: 70vh; overflow-y: auto;">
                        <v-list v-model="page" :items="pages">
                            <div v-for="(p, i) in pages" :key="i">
                                <v-list-item v-if="p[1] == 0" :active="page == i" @click="page = i">
                                    {{ $t(p[0]) }}
                                </v-list-item>
                            </div>
                        </v-list>
                    </v-col>
                    <v-col cols="9" style="overflow-y: auto; max-height: 70vh;">
                        <div class="pl-3 md" v-html="html"></div>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>


<style scoped>
.md ::v-deep ul {
    margin-top: 10px;
    margin-bottom: 10px;
    margin-left: 20px;
}
.md ::v-deep li {
    padding-left: 10px;
}
.md ::v-deep p {
    line-height: 30px;
}
.md ::v-deep h1 {
    padding-bottom: 10px;
    margin-bottom: 20px;
    border-bottom: 1px solid;
}
.md ::v-deep h2 {
    padding-bottom: 10px;
    margin-bottom: 20px;
    border-bottom: 1px solid;
}
.md ::v-deep h3 {
    margin-bottom: 10px;
    margin-top: 10px;
}
</style>