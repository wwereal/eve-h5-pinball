<script lang="ts" setup>
import { computed } from 'vue'
const bgClass = computed(() => {
    // if (prefersReducedMotion || blockTv.value || !homeReady.value || !showApng.value) {
    //     return '';
    // }
    // return gameState.value === 'playing-launch' || gameState.value === 'compressing' ? 'fast' : 'slow';
    return 'fast'
});
</script>
<template>
  <div class="pinball-game-head" :class="[bgClass]">
      <!-- 透明玻璃罩子 -->
      <picture class="rabbit">
          <source srcset="../assets/pinball-top.webp" type="image/webp" />
          <source srcset="..assets/pinball-top.png" type="image/png	" />
          <img class="img" src="../assets/pinball-top.png" />
      </picture>
      <!-- 表情 -->
      <!-- <template v-if="!prefersReducedMotion">
          <div class="emoji" :class="[gameState]"></div>
          <img v-if="homeReady" v-show="gameState === 'compressing'" :src="compressEmojiApng" class="light" />
      </template> -->
      <!-- <template v-else><div class="emoji"></div></template> -->
  </div>
</template>

<style lang="scss" scoped>
.pinball-game-head {
  width: 414px;
  height: 96px;
  position: relative;
  background-image: url('../assets/slow.png');
  background-position: bottom;
  background-repeat: no-repeat;
  background-size: 275px auto;
  &.slow {
      background-image: url('../assets/slow.png');
  }
  &.fast {
      background-image: url('../assets/fast.png');
  }
  .rabbit {
      display: block;
      height: 96px;
      width: 320px;
      margin: 0 auto;
      pointer-events: none;
      .img {
          height: 96px;
          width: 320px;
      }
  }

  .emoji {
      position: absolute;
      bottom: 20px;
      left: 141.5px;
      width: 131px;
      height: 52px;
      background: url('../assets/emoji.png');
      background-position: 0 0;
      background-size: cover;
      background-repeat: no-repeat;
      &.static {
          animation: 1000ms blink infinite step-end, 1000ms normal-wave-y infinite cubic-bezier(0.33, 0, 0.67, 1);
          @keyframes blink {
              0% {
                  background-position: 0 0;
              }

              20% {
                  background-position: 0 -52px;
              }

              30% {
                  background-position: 0 0;
              }

              100% {
                  background-position: 0 -52px;
              }
          }
      }
      &.compressing {
          background-position: 0 -162px;
          animation: 100ms cubic-bezier(0.33, 0, 0.67, 1) compressing infinite;
          @keyframes compressing {
              0% {
                  transform: translateX(-2px);
              }
              50% {
                  transform: translateX(2px);
              }
              100% {
                  transform: translateX(-2px);
              }
          }
      }
      &.playing-launch {
          bottom: 8px;
          animation: 1000ms cubic-bezier(0.33, 0, 0.67, 1) playing-wave-x infinite,
              1000ms playing-blink infinite step-end;
          @keyframes playing-wave-x {
              0% {
                  transform: translateX(-5px);
              }

              10% {
                  transform: translateX(5px);
              }

              50% {
                  transform: translateX(5px);
              }

              60% {
                  transform: translateX(-5px);
              }

              100% {
                  transform: translateX(-5px);
              }
          }
          @keyframes playing-blink {
              0% {
                  background-position: 0 0;
              }
              30% {
                  background-position: 0 -52px;
              }
              40% {
                  background-position: 0 0;
              }
              100% {
                  background-position: 0 0;
              }
          }
      }

      &.reward {
          // TODO fixme
          background-position: 0 -104px;
          animation: 800ms cubic-bezier(0.33, 0, 0.67, 1) reward-wave infinite alternate;
          @keyframes reward-wave {
              0% {
                  transform: translateX(-20px);
              }

              50% {
                  transform: translateY(9px);
              }

              100% {
                  transform: translateX(20px);
              }
          }
      }
      @keyframes normal-wave-y {
          0% {
              transform: translateY(0);
          }

          50% {
              transform: translateY(-3px);
          }

          100% {
              transform: translateY(0);
          }
      }
  }

  .light {
      position: absolute;
      bottom: -10px;
      left: 18px;
      width: 378px;
      height: 90px;
  }
}
</style>