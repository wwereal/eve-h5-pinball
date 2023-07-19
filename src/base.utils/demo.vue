<script setup lang="ts">
import { ref } from 'vue-demi';
import { transformMsToString } from './index';
const timestamp = ref(1647326860000);
</script>

<template>
    <div>
        <h4>时间转换</h4>
        <h5>{{ transformMsToString(+timestamp, 'yyyy.MM.dd HH:mm') }}</h5>
        <input v-model="timestamp" />ms
    </div>
</template>

<!-- eslint-disable-next-line vue-scoped-css/enforce-style-type -->
<style>
body {
    font-size: 32px;
}
</style>

<style lang="stylus" scoped></style>
