<script setup lang="ts">
import byteSize from 'byte-size';
import { NodeTable } from '../../interface';

interface PROPS {
    item: NodeTable | undefined
}

const props = defineProps<PROPS>()
const modal = defineModel<boolean>({ required: true })

</script>

<template>
    <v-dialog width="500" v-model="modal" class="text-white">
        <v-card v-if="props.item">
            <v-card-title v-if="props.item != undefined && props.item.system != undefined">
                <v-icon>mdi-information</v-icon>
                {{ props.item.ID }}
            </v-card-title>
            <v-card-text v-if="props.item != undefined && props.item.system != undefined">
                <details>
                    <summary>SYSTEM</summary>
                    <div>
                        <p>NAME: {{ props.item.system.system_name }}</p>
                        <p>PLATFORM: {{ props.item.system.platform }}</p>
                        <p>ARCH: {{ props.item.system.arch }}</p>
                    </div>
                </details>
                <details>
                    <summary>CPU</summary>
                    <div>
                        <p>CPU: {{ props.item.system.cpu_name }}, Core: {{ props.item.system.cpu_core }}</p>
                        <p>CPU Usage: {{ Math.round(props.item.system.cpu_usage * 100) / 100 }} %</p>
                    </div>
                </details>
                <details>
                    <summary>RAM</summary>
                    <div>
                        <p>RAM: {{ byteSize(props.item.system.ram_usage).value }} {{ byteSize(props.item.system.ram_usage).unit }} / {{ byteSize(props.item.system.ram_total).value }} {{ byteSize(props.item.system.ram_total).unit }}</p>
                        <p>RAM Usage: {{ Math.round((props.item.system.ram_usage / props.item.system.ram_total) * 10000) / 100 }} %</p>
                    </div>
                </details>
                <details>
                    <summary>DISK</summary>
                    <details v-for="(item, i) in props.item.system.disk" :key="i">
                        <summary>{{ item.disk_name }}  {{ item.disk_type }}</summary>
                        <div>
                            <p>DISK: {{ byteSize(item.disk_usage).value }} {{ byteSize(item.disk_usage).unit }} / {{ byteSize(item.disk_total).value }} {{ byteSize(item.disk_total).unit }}</p>
                            <p>DISK Usage: {{ Math.round(item.disk_percentage * 100) / 100 }} %</p>
                        </div>
                    </details>
                </details>
                <details>
                    <summary>NETWORK</summary>
                    <details v-for="(item, i) in props.item.system.net" :key="i">
                        <summary>{{ item.net_name }}</summary>
                        <div>
                            <p>Update: {{ item.upload }}</p>
                            <p>Download: {{ item.download }}</p>
                        </div>
                    </details>
                </details>
                <details>
                    <summary>GPU</summary>
                    <details v-for="(item, i) in props.item.system.gpu" :key="i">
                        <summary>{{ item.gpu_name }}</summary>
                        <div> </div>
                    </details>
                </details>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>