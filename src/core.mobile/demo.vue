<script setup lang="ts">
import { px2rem, getViewRatio, transViewValue } from './index';
</script>

<template>
    <div class="demo">
        <h1>@pet/core.mobile</h1>
        <div class="container">
            <p>100px = {{ px2rem(100) }}</p>
            <p>当前页面相对于 414 比例为 {{ getViewRatio(414, 516)() }}</p>
        </div>
    </div>
</template>

<style lang="stylus" scoped>
h1
    font-size 40px

p
    font-size 30px
</style>
