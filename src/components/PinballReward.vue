<script lang="ts" setup>
import { ref, watch } from 'vue';
import { prefersReducedMotion } from '@/common';
import type { PlayerState } from '@/lottery/ball-engine';

interface PacketConfig {
  packetType: number; // 1 红色 2 金色
  text: string; // 红包上文案
  textType: number; // 1 金额 2 文案
}

interface Props {
  width: string;
  sectionInfo?: PacketConfig[];
  sectionCount?: number;
  rewardIndex?: number;
  playerState?: PlayerState;
  playAnimation?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  sectionInfo: () => ([
    { packetType: 1, text: '8', textType: 1 },
    { packetType: 1, text: '1', textType: 1 },
    { packetType: 1, text: '0.1', textType: 1 },
    { packetType: 1, text: '随机红包', textType: 2 },
    { packetType: 1, text: '再来一次', textType: 2 },
    { packetType: 2, text: '66', textType: 1 },
  ]),
  sectionCount: 6,
});

const flash = ref(false);

watch(
  () => props.rewardIndex,
  (index) => {
    if (index) {
      flash.value = true;
    }
  },
);

watch(
  () => props.playerState,
  (value) => {
    if (value === 'static') {
      flash.value = false;
    }
  },
);

const showLightWave = ref(true);
const waveEnd = () => {
  showLightWave.value = false;
};
</script>

<template>
  <div class="reward-container" :style="{ width }">
    <!-- 红包区域 -->
    <div class="section">
      <div :class="['section-red-packet', playAnimation && 'hover']">
        <div v-for="(section, index) in sectionInfo" :key="index"
          :class="['red-packet', section.packetType === 2 && 'gold', playAnimation && `reward-${index}`]">
          <div v-if="section.textType === 1" class="cash">
            <div class="num">{{ section.text }}</div>
            <div class="unit">元</div>
          </div>
          <div v-else class="plain">{{ section.text }}</div>
        </div>
      </div>
      <div v-if="showLightWave && !prefersReducedMotion" class="section-light">
        <img v-for="(_, index) in sectionInfo" :key="index" class="high-light"
          :class="[playAnimation && `light-${index}`]" src="../assets/light.png"
          @animationend="waveEnd" />
      </div>
      <template v-if="!showLightWave && rewardIndex && flash && !prefersReducedMotion">
        <div class="light-ani" :class="['flash', `light-ani-${rewardIndex - 1}`]"></div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.reward-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;

  .section {
    position: relative;
    flex: 1;

    &-red-packet {
      display: flex;
      justify-content: space-around;

      &.hover {
        animation: 1600ms cubic-bezier(0.33, 0, 0.67, 1) 800ms infinite hover;

        @keyframes hover {
          0% {
            transform: translateY(2px);
          }

          50% {
            transform: translateY(-2px);
          }

          100% {
            transform: translateY(2px);
          }
        }
      }

      .red-packet {
        width: 36px;
        height: 44px;
        transform-origin: 50% 100%;
        background-image: url('../assets/red-packet.png');
        background-repeat: no-repeat;
        background-position: 0 0;
        background-size: cover;
        opacity: 0;

        @for $i from 0 through 5 {
          &.reward-#{$i} {
            animation: 700ms cubic-bezier(0.33, 0, 0.67, 1) $i * 50ms wave-move, 700ms linear wave-opacity;
            animation-fill-mode: forwards;

            @keyframes wave-move {
              0% {
                bottom: 0;
                transform: scale(1);
              }

              42.8% {
                bottom: 15px;
                transform: scale(1.2);
              }

              100% {
                bottom: 0;
                transform: scale(1);
              }
            }

            @keyframes wave-opacity {
              0% {
                opacity: 0;
              }

              42.8% {
                opacity: 1;
              }

              100% {
                opacity: 1;
              }
            }
          }
        }

        .cash {
          margin-top: 4px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #fff7db;

          .num {
            font-family: 'Alte DIN 1451 Mittelschrift';
            font-weight: 400;
            font-size: 12px;
            margin-left: 1px;
            line-height: 14px;
          }

          .unit {
            margin-top: 1px;
            font-weight: 700;
            font-size: 8px;
            line-height: 14px;
          }
        }

        .plain {
          width: 72px;
          margin-top: 5px;
          font-weight: 700;
          font-size: 15px;
          transform: scale(0.5);
          transform-origin: 0 center;
          line-height: 13px;
          color: #fff7db;
          text-align: center;
        }

        &.gold {
          background-position: -36px 0;

          .cash {
            color: #f72b2b;
          }
        }
      }
    }

    &-light {
      position: relative;
      margin-top: -50px;
      bottom: -17px;
      display: flex;
      justify-content: space-around;

      .high-light {
        width: 40px;
        height: 50px;
        opacity: 0;

        @for $i from 0 through 5 {
          &.light-#{$i} {
            animation: 700ms 1 linear $i * 50ms flash-move;

            @keyframes flash-move {
              0% {
                opacity: 0;
              }

              28.6% {
                opacity: 1;
              }

              57.1% {
                opacity: 1;
              }

              100% {
                opacity: 0;
              }
            }
          }
        }
      }
    }

    .light-ani {
      position: relative;
      width: 40px;
      height: 50px;
      margin-top: -50px;
      bottom: -17px;
      background: url('../assets/light.png') no-repeat;
      background-size: cover;

      @for $i from 0 through 5 {
        &.light-ani-#{$i} {
          left: 44 * $i + 2px;
        }
      }

      &.flash {
        animation: 250ms 3 linear flash-light;
        animation-fill-mode: forwards;

        @keyframes flash-light {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }
      }
    }
  }
}</style>
