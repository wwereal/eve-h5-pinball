import { ShallowRef } from "vue";
import { tableConfig } from '@/lottery/gameConfig';
import { Player } from "@/lottery/ball-engine";
export default function (ballGameRef: ShallowRef<Player>) {
  const SPRING_COMPRESS_TIME = 300;
  let isCompressing = false;
  const clickToLaunch = () => {
    isCompressing = true;
    // 点击按钮时
    const startTimestamp = Date.now();

    //压缩动画
    const pressAnimation = () => {
      if (!isCompressing) {
        return;
      }
      const deltaT = (Date.now() - startTimestamp) / SPRING_COMPRESS_TIME;
      const length = (1 - (1 - deltaT) * (1 - deltaT) * (1 - deltaT)) * tableConfig.springHeight;
      ballGameRef?.value?.compressSpring(length);
      window.requestAnimationFrame(pressAnimation);
    };
    pressAnimation();

    setTimeout(() => {
      isCompressing = false;
      ballGameRef?.value?.releaseSpring();
    }, SPRING_COMPRESS_TIME);
  };
  return {
    clickToLaunch
  }
}
