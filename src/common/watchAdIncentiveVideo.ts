import { isInIOS } from '@pet/base.utils';
import { invoke } from '@yoda/bridge';

let alreay = false;
export const watchAdIncentiveVideo = async (params: string, cb?: () => void) => {
    if (isInIOS()) {
        try {
            await invoke('growth.ugeVideoTask', {
                behavior: 'adIncentiveVideo',
                widgetParams: params,
            });
            cb?.();
        } catch (error) {
            // 视频未看完
        }
    } else {
        try {
            if (!alreay) {
                await invoke('kwai.on' as any, {
                    type: 'native_refresh_task_data',
                    handler: (res: { taskCompleted: boolean }) => {
                        if (res.taskCompleted) {
                            cb?.();
                        }
                    },
                });
                alreay = true;
            }
            invoke('feed.rewardVideoTask', {
                behavior: 'adIncentiveVideo',
                widgetParams: params,
            });
        } catch (error) {
            // 环境错误
        }
    }
};
