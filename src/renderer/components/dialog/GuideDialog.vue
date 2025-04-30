<script setup lang="ts">
import { Ref, ref, watch } from 'vue';
import { Preference } from '../../interface';

interface PROPS {
    preference: Preference
}

const modal = defineModel<boolean>({ required: true })
const props = defineProps<PROPS>()
const pages:Ref<Array<[string, number, string]>> = ref([
    ["guides.workflow", 0, "workflow"],
    ["guides.core", 0, "core"],
    ["guides.ui", 0, "ui"],
    ["guides.project", 0, "project"],
    ["guides.task", 0, "task"],
    ["guides.job", 0, "job"],
    ["guides.parameter", 0, "parameter"],
    ["guides.console", 0, "console"],
])
const page = ref(0)
const text = ref('')

watch(() => page.value, () => {
    const target = pages.value[page.value]
    const url = process.env.NODE_ENV === 'development' ? `./../../assets/guide/${props.preference.lan}/${target[2]}.md` : `./guide/${props.preference.lan}/${target[2]}.md`
    fetch(url).then(x => {
        x.text().then(y => {
            text.value = y
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
                <v-row style="min-height: 200px; max-height: 80vh; overflow-y:auto">
                    <v-col cols="3" class="border-e-lg">
                        <v-list v-model="page" :items="pages">
                            <div v-for="(p, i) in pages" :key="i">
                                <v-list-item v-if="p[1] == 0" :active="page == i" @click="page = i">
                                    {{ $t(p[0]) }}
                                </v-list-item>
                            </div>
                        </v-list>
                    </v-col>
                    <v-col cols="9">
                        <vue-markdown :source="text" />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>