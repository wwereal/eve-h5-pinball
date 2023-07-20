<script lang="ts" setup>
import { computed, Ref, ref, watch } from "vue";
import GameHeader from "./GameHeader.vue";
import Pinball from "./Pinball.vue";
import GameBtns from "./GameBtns.vue";
import { BallType, useBallGame } from "@/lottery/useBallGame";
import useLaunch from "./useLaunch";
import {
  tableConfig,
  pillarRenderConfig,
  launchConfig,
  ballRenderConfig,
} from "@/lottery/gameConfig";
import { usePillarEffect } from "@/lottery/usePillarEffect";

const pinballRef: Ref<InstanceType<typeof Pinball> | null> = ref(null);
const playerStatus = computed(
  () => pinballRef.value?.player.state.value ?? "static"
);
const { gameTouchMove, gameTouchStart, ballGameRef } = useBallGame(
  pinballRef as any
);

// 下拉弹簧
const pinballTouchStart = (e: TouchEvent) => {
  gameTouchStart(e);
};

const pinballTouchMove = (e: TouchEvent) => {
  gameTouchMove(e);
};

const { clickToLaunch } = useLaunch(ballGameRef as any);

const unwatchBallGame = watch(ballGameRef, (val) => {
  if (val) {
    usePillarEffect(val, BallType.collision);
    unwatchBallGame();
  }
});
</script>

<template>
  <div class="pinball-game-container pinball">
    <!--单纯头部图片-->
    <GameHeader class="pinball-game-head" />

    <div
      class="pinball-game-component"
      @touchstart="pinballTouchStart"
      @touchmove="pinballTouchMove"
    >
      <!-- 弹珠机背景 -->
      <picture class="pinball-bg-middle">
        <source srcset="../assets/pinball-middle.webp" type="image/webp" />
        <source srcset="../assets/pinball-middle.png" type="image/png" />
        <img src="../assets/pinball-middle.png" />
      </picture>

      <div id="pinball-game-withdraw" class="withdraw" />

      <!-- 弹球主玩法区 -->
      <Pinball
        ref="pinballRef"
        class="pinball-render"
        :fps="30"
        :is-debug="false"
        :perspective="0"
        :rotate-x="0"
        :pillar-render-config="pillarRenderConfig"
        :table-config="tableConfig"
        :launch-config="launchConfig"
        :ball-render-config="ballRenderConfig"
      />
    </div>

    <!-- 看视频按钮 + 发射按钮 + 助力按钮 -->
    <GameBtns
      :show-idle-animation="playerStatus === 'static'"
      @click-launch="clickToLaunch"
    />
  </div>
</template>
<style lang="scss" scoped>
.pinball-game-container {
  position: relative;
  // z-index: 999;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  @media screen and (max-width: 500px) and (min-aspect-ratio: 375/667),
    screen and (min-width: 500px) and (max-height: 889px) {
    margin-bottom: -60px;
  }

  .pinball-game-component {
    position: relative;
    z-index: 1;
    height: 450px;
    width: 414px;

    .pinball-bg-middle {
      position: absolute;
      margin-top: -18px;
      height: 478px;
      pointer-events: none;
      left: 0;

      img {
        width: 414px;
        height: 478px;
      }
    }
    .withdraw {
      width: 280px;
      height: 75px;
      margin: 0 auto;
    }

    .pinball-render {
      margin: 8px auto 0;
    }
  }
}
</style>
