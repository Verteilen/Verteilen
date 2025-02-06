<script setup lang="ts">
import { ref } from 'vue';
import { Project } from '../../interface';

interface PROPS {
    select: Project | undefined
}

const props = defineProps<PROPS>()
const createModal = ref(false)
const createData = ref({ name: '', type: '字串' })
const types = ref(['字串', '數字'])

const createParamter = () => {
    createModal.value = true
}

const confirmCreate = () => {

}

</script>

<template>
    <div>
        <b-card no-body ag="article" class="my-3 w-50" style="margin-left: 25%;" v-if="props.select != undefined">
            <b-card-title>
                當前選擇專案: {{ props.select.title }}
            </b-card-title>
            <b-card-text>
                敘述: {{ props.select.description }}
            </b-card-text>
            <b-button-group>
                <b-button variant='primary' @click="createParamter">新增</b-button>
                <b-button variant='danger'>刪除</b-button>
            </b-button-group>
        </b-card>
        <b-modal title="新增參數" v-model="createModal" hide-footer>
            <b-form-input v-model="createData.name" required placeholder="輸入參數名稱"></b-form-input>
            <b-form-select class="mt-3" v-model="createData.type" :options="types"></b-form-select>
            <b-button class="mt-3" variant="primary" @click="confirmCreate">新增</b-button>
        </b-modal>
    </div>
</template>

<style scoped>

</style>
