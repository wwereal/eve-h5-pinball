<!--
    解释一下为什么弹簧组件要有多余的header和footer：
    player中对弹簧高度的定义是从canvas底部到弹珠底部的距离，当作一个整体去处理压缩效果。
    但是这段距离中的视觉效果，不止包含弹簧，还有其上下的额外内容(header/footer)，且压缩效果只应对弹簧生效。
    因此弹簧需要处理header和footer。

    压缩时样式处理：
        header用translateY
        spring不能直接设置高度，因为高度变小布局会乱，需要使用scale
        footer不做处理

    弹簧和发射标志在动效上要同步，因此发射标志也放在这里
 -->

<script setup lang="ts">
import { transViewValue } from "@/core.mobile";
import { computed, ref, watch } from "vue";
import { prefersReducedMotion } from "@/common";
import { preloadSource } from "@/common/loadSource";
import LaunchSignShine from "@/assets/launch-sign-shine.png";
import type { PlayerState } from "@/lottery/ball-engine";

const ITEM_COUNT = 10;
const HEADER_HEIGHT = 6;
const FOOTER_HEIGHT = 15;
const SPRING_HEIGHT = 75;
const SPRING_ITEM_LIGHT_BG_ALPHA_MIN = 0;
const SPRING_ITEM_LIGHT_BG_ALPHA_MAX = 0.8;
const getItemLightBgString = (alpha: number) => {
  return `rgba(255, 255, 255, ${alpha})`;
};

interface Props {
  playerState: PlayerState;
  compressLength: number;
  springInfo: {
    springHeight: number; // player中定义的弹簧高度
    maxCompressLength: number;
  };
  playAnimation?: boolean;
}
const props = defineProps<Props>();

const state = computed(() => {
  if (["playing-launch", "playing-loading"].includes(props.playerState)) {
    return "no"; // 没有动效
  } else {
    return props.playerState;
  }
});
const compressRadio = computed(() => {
  return props.compressLength / props.springInfo.maxCompressLength; // [0, 1]
});

const headerRef = ref<HTMLDivElement | null>(null);
const springRef = ref<HTMLDivElement | null>(null);
const launchSignRef = ref<HTMLDivElement | null>(null);
const getItemEls = () => {
  return springRef.value?.querySelectorAll<HTMLDivElement>(
    ".spring-item__light"
  );
};
const clearCompress = () => {
  if (springRef.value) {
    const springItemLightEls = getItemEls()!;
    springItemLightEls.forEach((item) => {
      // eslint-disable-next-line no-param-reassign
      item.style.background = getItemLightBgString(
        SPRING_ITEM_LIGHT_BG_ALPHA_MIN
      );
    });
  }

  if (launchSignRef.value) {
    launchSignRef.value.style.opacity = "1";
  }
};
const compressHandler = (rawCompressLength: number) => {
  const floorCompressLength = Math.floor(rawCompressLength);

  if (headerRef.value) {
    const compressLength = transViewValue(floorCompressLength);
    headerRef.value.style.transform = `translateY(${compressLength}px)`;
  }

  if (springRef.value) {
    const scaleRadio =
      (props.springInfo.springHeight -
        FOOTER_HEIGHT -
        HEADER_HEIGHT -
        floorCompressLength) /
      SPRING_HEIGHT;
    springRef.value.style.transform = `scaleY(${scaleRadio})`;

    const springItemLightEls = getItemEls()!;
    const step = 1 / ITEM_COUNT;
    const lastLightIndex = Math.floor(compressRadio.value * ITEM_COUNT);
    for (let i = 0; i < ITEM_COUNT; i += 1) {
      const item = springItemLightEls[i];
      if (item) {
        if (i < lastLightIndex) {
          item.style.background = getItemLightBgString(
            SPRING_ITEM_LIGHT_BG_ALPHA_MAX
          );
        } else if (i > lastLightIndex) {
          item.style.background = getItemLightBgString(
            SPRING_ITEM_LIGHT_BG_ALPHA_MIN
          );
        } else {
          const alpha =
            (SPRING_ITEM_LIGHT_BG_ALPHA_MAX - SPRING_ITEM_LIGHT_BG_ALPHA_MIN) *
            (compressRadio.value - lastLightIndex * step);
          item.style.background = getItemLightBgString(alpha);
        }
      }
    }
  }

  if (launchSignRef.value) {
    launchSignRef.value.style.opacity = `${compressRadio.value}`;
  }
};

watch(
  () => props.compressLength,
  (length) => {
    compressHandler(length);
  }
);
watch(
  () => props.playerState,
  (state) => {
    // 清除弹簧压缩状态
    if (state !== "compressing") {
      clearCompress();
    }
  }
);

const SIGN_SHINE_DELAY = 1200; //距离弹簧动画周期的offset
const SIGN_SHINE_DURATION = 550; //发射标志动画持续时间
const signShinePlaying = ref(false);
let timerId = 0;
const loadSignShine = () => {
  window.clearTimeout(timerId);
  timerId = window.setTimeout(() => {
    signShinePlaying.value = true;
    setTimeout(() => {
      signShinePlaying.value = false;
    }, SIGN_SHINE_DURATION);
  }, SIGN_SHINE_DELAY);
};

// 首次加载同步
const isSignShineLoaded = ref(prefersReducedMotion);
const springStaticReady = computed(
  () =>
    props.playAnimation && isSignShineLoaded.value && state.value === "static"
);
const signShineStaticReady = computed(
  () =>
    !prefersReducedMotion &&
    props.playAnimation &&
    isSignShineLoaded.value &&
    state.value === "static" &&
    signShinePlaying.value
);
if (!prefersReducedMotion) {
  const unwatch = watch(
    () => props.playAnimation,
    (val) => {
      if (val) {
        preloadSource(LaunchSignShine).finally(() => {
          isSignShineLoaded.value = true;
          unwatch();
        });
      }
    }
  );
}
</script>

<template>
  <div class="spring-container">
    <div ref="headerRef" class="spring-header"></div>

    <div ref="springRef" class="spring">
      <div v-for="item in ITEM_COUNT" :key="item" class="spring-item">
        <div class="spring-item__base" :class="`spring-item__bg-${item}`"></div>
        <div
          v-if="item === 1"
          class="spring-item__light"
          :class="[
            springStaticReady && `spring-item__light_normal-${item}`,
            state === 'reward' && `spring-item__light_celebrate`,
          ]"
          @animationstart="loadSignShine"
          @animationiteration="loadSignShine"
        ></div>
        <div
          v-else
          class="spring-item__light"
          :class="[
            state === 'static' && `spring-item__light_normal-${item}`,
            state === 'reward' && `spring-item__light_celebrate`,
          ]"
        ></div>
      </div>
    </div>

    <div class="spring-footer">
      <div class="launch-sign">
        <div class="launch-sign__icon launch-sign__icon_base">
          <img
            v-if="signShineStaticReady"
            :src="LaunchSignShine"
            class="launch-sign__icon"
          />
          <div
            v-if="state === 'reward' || state === 'compressing'"
            key="light"
            ref="launchSignRef"
            class="launch-sign__icon launch-sign__icon_light"
            :class="[state === 'reward' && 'launch-sign__icon_light_celebrate']"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$spring-item-bgs: #fff700, #ffde00, #ffc12c, #ffa73e, #ff8949, #ff6954, #ff515c,
  #ff597c, #ff4c88, #ff3893;
$spring-item-light-bg-min: rgba(255, 255, 255, 0);
$spring-item-light-bg-max: rgba(255, 255, 255, 0.8);
$header-height: 6px;
$footer-height: 15px;
$spring-height: 75px;

.spring {
  &-container {
    position: absolute;
    bottom: 0;
    right: 3px;
    z-index: 1; // 让 launch-sign 盖在背景之上
  }

  &-header {
    background: center / contain no-repeat
      url("../assets/icons/spring-header.png");
    width: 36px;
    height: $header-height;
  }

  &-footer {
    height: $footer-height;
    display: flex;
    justify-content: center;

    .launch-sign {
      $size: 30px;
      width: $size;
      height: $size;
      margin-top: 4px;

      &__icon {
        width: $size;
        height: $size;
        pointer-events: none;

        &_base {
          background: center / contain no-repeat
            url("../assets/icons/launch-sign-base.png");
        }

        &_light {
          background: center / contain no-repeat
            url("../assets/icons/launch-sign-light.png");

          &_celebrate {
            animation: launch-sign-reward-light 600ms linear infinite;
          }

          @keyframes launch-sign-reward-light {
            0%,
            50% {
              opacity: 1;
            }

            51%,
            100% {
              opacity: 0;
            }
          }
        }
      }
    }
  }
}

.spring {
  box-sizing: border-box;
  width: 36px;
  height: $spring-height;
  background: rgba(42, 77, 188, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 2px;
  transform-origin: bottom;

  &-item {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 6px;

    &__base {
      position: absolute;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      border: 0.5px solid rgba(255, 255, 255, 0.5);
      border-radius: 3px;
    }

    @each $bg in $spring-item-bgs {
      $index: index($spring-item-bgs, $bg);

      .spring-item__bg-#{$index} {
        background: $bg;
      }

      &__light_normal-#{$index} {
        animation: static-light-#{$index} 3s linear infinite;
      }

      $offset: ($index - 1) * 3.3%;

      @keyframes static-light-#{$index} {
        0%,
        #{$offset} {
          background: $spring-item-light-bg-min;
        }

        #{6.6% + $offset},
        #{13.3% + $offset} {
          background: $spring-item-light-bg-max;
        }

        #{20% + $offset},
        100% {
          background: $spring-item-light-bg-min;
        }
      }
    }

    &__light {
      position: absolute;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      border-radius: 3px;
      background: $spring-item-light-bg-min;
    }

    &__light_celebrate {
      animation: reward-light 600ms linear infinite;
    }

    @keyframes reward-light {
      0%,
      50% {
        background: $spring-item-light-bg-max;
      }

      51%,
      100% {
        background: $spring-item-light-bg-min;
      }
    }
  }
}
</style>
