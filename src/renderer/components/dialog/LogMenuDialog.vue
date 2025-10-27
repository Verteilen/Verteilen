<script setup lang="ts">
//#region Modules
import { inject, Ref, ref, watch } from 'vue';
import { Preference } from '../../interface';
import { i18n } from 'verteilen-core/src/plugins/i18n';
//#endregion

//#region Data
const $t = i18n.global.t
const preference:Preference = inject("preference")!
const modal = defineModel<boolean>({ required: true })
const props = defineProps<{
    icon: string
    label: string
    recover: boolean
    holder: Array<string>
}>()
const emit = defineEmits<{
    (e: 'project', names?:Array<string>):void
    (e: 'database', names?:Array<string>):void
}>()
const option = ref(0)
const names:Ref<Array<string>> = ref([])
//#endregion

//#region Watch
watch(() => modal.value, () => {
    option.value = 0
    if(props.recover) names.value = props.holder
    else names.value = []
})
//#endregion

//#region Methods
const submit = () => {
    if(props.recover){
        if(option.value == 0) emit('project', names.value)
        if(option.value == 1) emit('database', names.value)
    }else{
        if(option.value == 0) emit('project')
        if(option.value == 1) emit('database')
    }
    modal.value = false
}
const cancel = () => {
    modal.value = false
}
//#endregion

</script>

<template>
    <v-dialog width="500" v-model="modal">
        <v-card>
            <v-card-title>
                <v-icon>{{ icon }}</v-icon>
                {{ label }}
            </v-card-title>
            <v-card-text>
                <v-btn-group variant="outlined" divided>
                    <v-btn color="primary" @click="option = 0" :active="option == 0">
                        <span :style="{ 'fontSize': preference.font + 'px' }">
                            {{ $t('project') }}
                        </span>
                    </v-btn>
                    <v-btn color="secondary" @click="option = 1" :active="option == 1">
                        <span :style="{ 'fontSize': preference.font + 'px' }">
                            {{ $t('database') }}
                        </span>
                    </v-btn>
                </v-btn-group>
                <v-text-field v-if="props.recover && option <= 0" class="mt-2" v-model="names[0]" :label="$t('modal.log-recover-project-title')" hide-details></v-text-field>
                <v-text-field v-if="props.recover && option <= 1" class="mt-2" v-model="names[1]" :label="$t('modal.log-recover-database-title')" hide-details></v-text-field>
            </v-card-text>
            <template v-slot:actions>
                <v-btn class="mt-3" color="success" @click="submit">{{ $t(props.recover ? 'recover' : 'export') }}</v-btn>
                <v-btn class="mt-3" color="error" @click="cancel">{{ $t('cancel') }}</v-btn>
            </template>
        </v-card>
    </v-dialog>
</template>