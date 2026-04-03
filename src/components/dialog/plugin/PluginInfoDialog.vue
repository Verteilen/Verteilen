<script setup lang="ts">
import { ref } from 'vue';
import { PluginContainer } from 'verteilen-core/dist/interface';
import { i18n } from '../../../plugins/i18n';
import DialogBase from '../DialogBase.vue';


interface PROPS {
    plugin?: PluginContainer
    default_plugin_thumbnail: string
}
const modal = defineModel<boolean>({ required: true })
const page = ref(0)
const props = defineProps<PROPS>()
const $t = i18n.global.t

</script>

<template>
    <DialogBase v-model="modal" width="60vw" height="80vh">
        <v-img cover height="120" :src="props.plugin?.thumbnail ? props.plugin?.thumbnail : props.default_plugin_thumbnail">
            <template v-slot:error>
                <v-img cover height="120"
                    :src="props.default_plugin_thumbnail"
                ></v-img>
            </template>
        </v-img>
        <template #title>
            <p class="mx-3 mt-3"> {{ props.plugin?.title }} </p>
        </template>
        <template #text>
            <p> {{ $t('modal.owner') }}: {{ props.plugin?.owner ?? "public" }} </p>
            <p> {{ $t('modal.version') }}: {{ props.plugin?.version }} </p>
            <p> {{ $t('modal.description') }}: <br/> <span class="ml-4">{{ props.plugin?.description }} </span></p>
            <br />
            <v-toolbar density="compact">
                <v-btn prepend-icon="mdi-cube" @click="page = 0" :color="page == 0 ? 'warning' : ''">
                    {{ $t('modal.project-template') }}
                </v-btn>
                <v-btn prepend-icon="mdi-database" @click="page = 1" :color="page == 1 ? 'warning' : ''">
                    {{ $t('modal.database-template') }}
                </v-btn>
                <v-btn prepend-icon="mdi-console-line" @click="page = 2" :color="page == 2 ? 'warning' : ''">
                    {{ $t('modal.script') }}
                </v-btn>
                <v-btn prepend-icon="mdi-puzzle-plus" @click="page = 3" :color="page == 3 ? 'warning' : ''">
                    {{ $t('modal.plugin') }}
                </v-btn>
            </v-toolbar>
            <v-tabs-window v-model="page">
                <v-tabs-window-item :value="0" class="pa-4">
                    <v-table>
                        <thead>
                            <tr>
                                <th><b>title</b></th>
                                <th><b>group</b></th>
                                <th><b>value</b></th>
                                <th><b>filename</b></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(p, index) in props.plugin?.projects" class="pt-1" :key="'project-' + index">
                                <td>{{ p.title }}</td>
                                <td>{{ p.group }}</td>
                                <td>{{ p.value }}</td>
                                <td>{{ p.filename }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-tabs-window-item>
                <v-tabs-window-item :value="1" class="pa-4">
                    <v-table>
                        <thead>
                            <tr>
                                <th><b>title</b></th>
                                <th><b>group</b></th>
                                <th><b>value</b></th>
                                <th><b>filename</b></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(p, index) in props.plugin?.databases" class="pt-1" :key="'database-' + index">
                                <td>{{ p.title }}</td>
                                <td>{{ p.group }}</td>
                                <td>{{ p.value }}</td>
                                <td>{{ p.filename }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-tabs-window-item>
                <v-tabs-window-item :value="2">

                </v-tabs-window-item>
                <v-tabs-window-item :value="3">
                    <div v-for="(p, index) in props.plugin?.plugins" class="pt-1" :key="'plugin-' + index">
                        <p class="py-3">Group: {{ p.name }} </p>
                        <v-table>
                            <thead>
                                <tr>
                                    <th><b>platform</b></th>
                                    <th><b>arch</b></th>
                                    <th><b>filename</b></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(p2, index2) in p.contents" class="pt-1" :key="'plugin-content-' + index2">
                                    <td>{{ p2.platform }}</td>
                                    <td>{{ p2.arch }}</td>
                                    <td>{{ p2.filename }}</td>
                                </tr>
                            </tbody>
                        </v-table>
                    </div>
                </v-tabs-window-item>
            </v-tabs-window>
        </template>
    </DialogBase>
</template>