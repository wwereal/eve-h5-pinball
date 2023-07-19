<script lang="ts" setup>
import { ref } from "vue";
interface Props {
  launchDisable?: boolean;
  showIdleAnimation?: boolean;
}

interface Emits {
  (e: "click-launch"): void;
  (e: "click-tv"): void;
  (e: "click-share"): void;
  (e: "click-primary-share"): void;
}

withDefaults(defineProps<Props>(), {
  showIdleAnimation: true,
  launchDisable: false,
});

const emit = defineEmits<Emits>();

const isPressing = ref(false);

const onClickStart = () => {
  isPressing.value = true;
  emit("click-launch");
};

const onClickEnd = () => {
  isPressing.value = false;
};
</script>
<template>
  <!-- 底部操作区 -->
  <div class="game-btns">
    <div class="game-btns-primary">
      <div
        type="primary"
        class="game-btns-primary-shoot"
        :class="[
          isPressing && 'active',
          !isPressing && showIdleAnimation && 'idle',
        ]"
        @mousedown="onClickStart"
        @mouseup="onClickEnd"
        @touchstart="onClickStart"
        @touchend="onClickEnd"
      >
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.game-btns {
  display: flex;
  justify-content: center;
  position: relative;
  padding: 0 23px;
  width: 414px - 46px;
  height: 200px;
  margin-top: -23px;
  line-height: 160px;
  background: no-repeat url("../assets/pinball-bottom.jpg");
  background-size: 100% 100%;

  &-aux {
    margin-top: 33px;
  }

  &-primary {
    position: relative;
    margin: 30px 14px 0;
    width: 180px;
    height: 88px;
    box-sizing: border-box;
    &-shoot {
      height: 76px;
      background-image: url("../assets/launch-btn-sprites.png");
      background-size: 180px auto;
      background-position: 0 -24px;
      .text {
        color: #fff;
        font-size: 13px;
        line-height: 18px;
        padding-top: 31px;
        text-align: center;
        font-weight: 500;
      }
      &.active {
        transform: translateY(8px);
      }
      &.idle {
        animation: btn-breathing 3s cubic-bezier(0.33, 0, 0.67, 1) infinite;
      }
    }

    &-share {
      height: 76px;
      background-image: url("../assets/launch-btn-sprites.png");
      background-size: 180px auto;
      background-position: 0 -100px;
    }
  }
  &-primary-common {
    width: 180px;
    height: 24px;
    margin-top: -14px;
    background-image: url("../assets/launch-btn-sprites.png");
    background-size: 180px auto;
    background-position: 0 0px;
  }
  @keyframes btn-breathing {
    0% {
      transform: translateY(0);
    }
    5% {
      transform: translateY(8px);
    }
    10% {
      transform: translateY(0);
    }
    15% {
      transform: translateY(8px);
    }
    20% {
      transform: translateY(0);
    }
    25% {
      transform: translateY(8px);
    }
    30% {
      transform: translateY(0);
    }
    35% {
      transform: translateY(8px);
    }
    40% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(0);
    }
  }
}
</style>
