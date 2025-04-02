<script setup lang="ts">
import byteSize from 'byte-size';
import { computed } from 'vue';
import { NodeTable } from '../../interface';

interface PROPS {
    item: NodeTable | undefined
}

const props = defineProps<PROPS>()
const modal = defineModel<boolean>({ required: true })

const diskTotal = computed(() => {
    return props.item?.system?.disk.map(x => x.disk_total).reduce((parS, a) => parS + a, 0) ?? 0
})
const diskFree = computed(() => {
    return props.item?.system?.disk.map(x => x.disk_free).reduce((parS, a) => parS + a, 0) ?? 0
})
const diskUsage = computed(() => {
    return props.item?.system?.disk.map(x => x.disk_usage).reduce((parS, a) => parS + a, 0) ?? 0
})
const diskPercentage = computed(() => {
    return Math.round((diskUsage.value / diskTotal.value) * 100)
})
const netDownload = computed(() => {
    let r = 0
    props.item?.system?.net.forEach(x => r += x.download)
    return r
})
const netUpload = computed(() => {
    let r = 0
    props.item?.system?.net.forEach(x => r += x.upload)
    return r
})

</script>

<template>
    <v-dialog width="800" v-model="modal" class="text-white text-center">
        <v-card v-if="props.item">
            <v-card-title v-if="props.item != undefined && props.item.system != undefined">
                <v-icon>mdi-information</v-icon>
                {{ props.item.ID }}
            </v-card-title>
            <v-card-text v-if="props.item != undefined && props.item.system != undefined">
                <v-row style="height: 300px">
                    <v-col cols="4" class="my-auto">
                        <p>PLATFORM: {{ props.item.system.platform }}</p>
                        <p>ARCH: {{ props.item.system.arch }}</p>
                    </v-col>
                    <v-col cols="4">
                        <v-progress-circular
                            class="mb-4"
                            :model-value="Math.round(props.item.system.cpu_usage * 100) / 100"
                            :rotate="0"
                            :size="200"
                            :width="15"
                            color="primary"
                        >
                        <p>CPU Usage: {{ Math.round(props.item.system.cpu_usage * 100) / 100 }} %</p>
                        </v-progress-circular>
                        <p>CPU: {{ props.item.system.cpu_name }}, Core: {{ props.item.system.cpu_core }}</p>
                    </v-col>
                    <v-col cols="4">
                        <v-progress-circular
                            class="mb-4"
                            :model-value="Math.round((props.item.system.ram_usage / props.item.system.ram_total) * 10000) / 100"
                            :rotate="0"
                            :size="200"
                            :width="15"
                            color="primary"
                        >
                        <p>RAM Usage: {{ Math.round((props.item.system.ram_usage / props.item.system.ram_total) * 10000) / 100 }} %</p>
                        </v-progress-circular>
                        <p>RAM: {{ byteSize(props.item.system.ram_usage).value }} {{ byteSize(props.item.system.ram_usage).unit }} / {{ byteSize(props.item.system.ram_total).value }} {{ byteSize(props.item.system.ram_total).unit }}</p>
                    </v-col>
                </v-row>
                <v-row style="height: 300px">
                    <v-col cols="4">
                        <v-progress-circular
                            class="mb-4"
                            :model-value="diskPercentage"
                            :rotate="0"
                            :size="200"
                            :width="15"
                            color="primary"
                        >
                        <p>DISK: {{ byteSize(diskUsage).value }} {{ byteSize(diskUsage).unit }} / {{ byteSize(diskTotal).value }} {{ byteSize(diskTotal).unit }}</p>
                        </v-progress-circular>
                        <p>DISK Usage: {{ diskPercentage }} %</p>
                    </v-col>
                    <v-col cols="4">
                        <v-progress-circular
                            :model-value="100"
                            :rotate="0"
                            :size="200"
                            :width="15"
                            color="primary"
                        >
                        <p>Net: {{ byteSize(netDownload).value }} {{ byteSize(netDownload).unit }} / {{ byteSize(netUpload).value }} {{ byteSize(netUpload).unit }}</p>
                        </v-progress-circular>
                    </v-col>
                    <v-col cols="4" class="my-auto">
                        <p v-for="(item, i) in props.item.system.gpu" :key="i">{{ item.gpu_name }}</p>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>