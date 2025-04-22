<script setup lang="ts">
import { Preference } from '../../interface';

const modal = defineModel<boolean>({ required: true })
const props = defineProps<{
    preference: Preference
    icon: string
    label: string
}>()
const emit = defineEmits<{
    (e: 'project'):void
    (e: 'parameter'):void
}>()

const cancel = () => [
    modal.value = false
]

</script>

<template>
    <v-dialog width="500" v-model="modal">
        <v-card>
            <v-card-title>
                <v-icon>{{ icon }}</v-icon>
                {{ label }}
            </v-card-title>
            <v-card-text>
                <v-row style="height: 100px;">
                    <v-col cols="6">
                        <v-btn color="primary" class="w-100 h-100" @click="emit('project')">
                            <span :style="{ 'fontSize': props.preference.font + 'px' }">
                                {{ $t('project') }}
                            </span>
                        </v-btn>
                    </v-col>
                    <v-col cols="6">
                        <v-btn color="secondary" class="w-100 h-100" @click="emit('parameter')">
                            <span :style="{ 'fontSize': props.preference.font + 'px' }">
                                {{ $t('parameter') }}
                            </span>
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
            <template v-slot:actions>
                <v-btn class="mt-3" color="error" @click="cancel">{{ $t('cancel') }}</v-btn>
            </template>
        </v-card>
    </v-dialog>
</template>