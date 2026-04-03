<script setup lang="ts">
//#region Modules
import { Emitter } from 'mitt'
import { computed, inject, ref } from 'vue'
import { 
    BusType, 
    Preference, 
    ToastData 
} from './../interface'
import { i18n } from './../plugins/i18n'
//#endregion

//#region Views
import AppBar from './components/layout/AppBar.vue'
import Layout from './components/layout/Layout.vue'
//#endregion

//#region Data
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const preference:Preference = inject("preference")!
const model = defineModel<number>()
const emit = defineEmits<{
    (e: 'selected', mode:number | undefined, url:string | undefined):void
}>()
const data = ref({
    page: 0,
    is_server: -1,
    url: "",
    mode: -1
})
//#endregion

//#region 
const is_server = computed(() => (data.value.is_server == 1 && data.value.url.trimStart().trimEnd().length > 0) ? i18n.global.t('yes') : i18n.global.t('no'))
const mode = computed(() => {
    if(data.value.mode == 0) return i18n.global.t('server')
    else if(data.value.mode == 1) return i18n.global.t('node')
    else return i18n.global.t('cluster')
})
//#endregion

//#region Methods
const serverChoice = (e:boolean, v:string) => {
    data.value.is_server = (e) ? 1 : 0
    if (!e){
        data.value.page += 1
    }
}
const previousClick = (e:number) => {
    data.value.page -= 1
    if(e == 0) data.value.is_server = -1
}
const selectMode = (e:number) => {
    data.value.page += 1
    data.value.mode = e
}
const serverClick = () => {
    const d:ToastData = {
        title: i18n.global.t("toast.server"),
        type: "primary",
        message: i18n.global.t("toast.server_d")
    }
    emitter.emit('makeToast', d)
    model.value = 1
    emit('selected', data.value.mode, data.value.url)
}
const clientClick = () => {
    const d:ToastData = {
        title: i18n.global.t("toast.cluster"),
        type: "primary",
        message: i18n.global.t("toast.cluster_d")
    }
    emitter.emit('makeToast', d)
    model.value = 0
    emit('selected', data.value.mode, data.value.url)
}
const clusterClick = () => {
    const d:ToastData = {
        title: i18n.global.t("toast.node"),
        type: "primary",
        message: i18n.global.t("toast.node_d")
    }
    emitter.emit('makeToast', d)
    model.value = 2
    emit('selected', data.value.mode, is_server ? data.value.url : undefined)
}
const confirm = () => {
    if(data.value.mode == 1) serverClick()
    else if(data.value.mode == 0) clientClick()
    else clusterClick()
}
//#endregion
</script>

<template>
    <Layout>
        <!-- Top Appbar -->
        <AppBar :title="$t('modeselect.titlebar')" />

        <v-carousel
            style="margin-top: 50px;"
            v-model.number="data.page"
            progress="primary"
            height="calc(100% - 55px)"
            disabled
            hide-delimiter-background
            :show-arrows="false"
            :transition-duration="700" 
            crossfade
        >
            <v-carousel-item cover :key="0" class="my-auto py-auto h-100">
                <div style="height: 42%"></div>
                <h3 class="mb-2">{{ $t('modeselect.welcome') }}</h3>
                <p>{{ $t('modeselect.welcome2') }}</p>
                <br/>
                <v-btn color="success" append-icon="mdi-arrow-right" @click="data.page++">{{ $t("next") }}</v-btn>
            </v-carousel-item>
            <v-carousel-item cover :key="1" class="my-auto py-auto h-100">
                <div style="height: 42%"></div>
                <h3 class="mb-2">{{ $t('modeselect.server') }}</h3>
                <p>{{ $t('modeselect.server2') }}</p>
                <br v-if="data.is_server == -1"/>
                <v-btn v-if="data.is_server == -1" class="mx-2" color="success" append-icon="mdi-arrow-right" @click="serverChoice(true, data.url)">{{ $t("yes") }}</v-btn>
                <v-btn v-if="data.is_server == -1" class="mx-2" color="warning" append-icon="mdi-arrow-right" @click="serverChoice(false, data.url)">{{ $t("no") }}</v-btn>
                <br />
                <v-text-field v-if="data.is_server == 1" density="comfortable" class="w-50 mx-auto" hide-details v-model="data.url" :placeholder="$t('modeselect.url')"></v-text-field>
                <br />
                <v-btn v-if="data.is_server == 1" class="mx-2" color="success" append-icon="mdi-arrow-right" @click="data.page++">{{ $t("confirm") }}</v-btn>
            </v-carousel-item>
            <v-carousel-item cover :key="2" class="my-auto py-auto h-100 w-75 mx-auto">
                <div style="height: 42%"></div>
                <h2 class="text-info mb-2">{{ $t('modeselect.title') }}</h2>
                <p class="text-info">{{ $t('modeselect.title2') }}</p>
                <br />
                <v-row no-gutters>
                    <v-col>
                        <v-tooltip location="bottom">
                            <template v-slot:activator="{ props }">
                                <v-btn variant="outlined" color="primary" v-bind="props" prepend-icon="mdi-server" stacked class="buttonHeight w-75 mx-1" @click="selectMode(1)">
                                    <span :style="{ 'fontSize': preference.font + 'px' }">
                                        {{ $t('server') }}
                                    </span>
                                </v-btn>
                            </template>
                            <p class="text-body-1 text-indigo-darken-4">{{ $t('tooltip.select-server') }}</p>
                        </v-tooltip>
                    </v-col>
                    <v-col>
                        <v-tooltip location="bottom" text="Tooltip" :no-click-animation="!preference.animation">
                            <template v-slot:activator="{ props }">
                                <v-btn variant="outlined" color="secondary" v-bind="props" prepend-icon="mdi-network" stacked class="buttonHeight w-75 mx-1" @click="selectMode(0)">
                                    <span :style="{ 'fontSize': preference.font + 'px' }">
                                        {{ $t('node') }}
                                    </span>
                                </v-btn>    
                            </template>
                            <p class="text-body-1 text-indigo-darken-4">{{ $t('tooltip.select-node') }}</p>
                        </v-tooltip>
                    </v-col>
                    <v-col>
                        <v-tooltip location="bottom">
                            <template v-slot:activator="{ props }">
                                <v-btn variant="outlined" color="primary" v-bind="props" prepend-icon="mdi-server" stacked class="buttonHeight w-75 mx-1" @click="selectMode(2)">
                                    <span :style="{ 'fontSize': preference.font + 'px' }">
                                        {{ $t('cluster') }}
                                    </span>
                                </v-btn>
                            </template>
                            <p class="text-body-1 text-indigo-darken-4">{{ $t('tooltip.select-cluster') }}</p>
                        </v-tooltip>
                    </v-col>
                </v-row>
                <br />
                <v-btn class="mx-2" color="warning" append-icon="mdi-arrow-left" @click="previousClick(0)">{{ $t("previous") }}</v-btn>
            </v-carousel-item>
            <v-carousel-item cover :key="3" class="my-auto py-auto h-100 w-75 mx-auto">
                <div style="height: 42%"></div>
                <h3 class="mb-2">{{ $t('modeselect.confirm') }}</h3>
                <p>{{ $t('modeselect.confirm2') }}</p>
                <p>{{ $t('modeselect.confirm3') }}: {{ is_server }}</p>
                <p>{{ $t('modeselect.confirm4') }}: {{ mode }}</p>
                <br />
                <v-btn class="mx-2" color="warning" append-icon="mdi-arrow-left" @click="previousClick(1)">{{ $t("previous") }}</v-btn>
                <v-btn class="mx-2" color="success" append-icon="mdi-play" @click="confirm()">{{ $t("confirm") }}</v-btn>
            </v-carousel-item>
        </v-carousel>
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