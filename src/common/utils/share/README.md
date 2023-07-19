# 分享相关能力
在js sdk（@ks-share/share）基础上封装
1. 简化参数
2. 增加功能
3. 对业务方屏蔽下层依赖，方便后续更改

*调用分享*
```ts
// 简单调用
await share({
    subBiz: 'Z_TEST', // 分享链路对应的id
    placeholder: { // 选填，不可传递中台预留参数(已做类型限制)
        key1: '在分享回流链路中透传的参数',
        key2: '需要先在管理端填加token',
    },
    logExt: {   // 选填，数据上报
        source: "search",
    },
});

// 监听事件
await share({
    subBiz: 'Z_TEST',
}, {
    onPanelShow: (e) => {
        // 前端调起分享面板展示
    },
    onPanelDismiss: (e) => {
        // 分享面板消失
    },
    // 其余事件：
    // panel_cancel 分享面板点击取消按钮
    // user_select 用户点击某个渠道
    // banner_show 面板的banner展示事件
    // banner_click banner的点击事件
});
```

*获取回流信息*
```ts
const backflowInfo = getBackflowInfo();
if (backflowInfo.isBackflow) {
    const placeholder = backflowInfo.placeholder as { subBiz: string }; // 需要的回流信息从 placeholder 中取，类型自己指定
    if (placeholder.subBiz === 'Z_TEST') {
        // 调用助力接口...
    }
}
```

*自绘分享二维码*
```ts
import { useShareQR, SHARE_QR_STATE, type ShareParams } from '@/common/utils/share';

const params = ref({
    subBiz: 'Z_TEST',
    placeholder: { // 选填，不可传递中台预留参数(已做类型限制)
        key1: '在分享回流链路中透传的参数',
        key2: '需要先在管理端填加token',
    },
    logExt: {   // 选填，数据上报
        source: "search",
    },
});
const { qrDataURL, state, refetchQR } = useShareQR(
    params, 
    132, // 选填，二维码大小
);
```
```html
<img v-if="state === SHARE_QR_STATE.SUCCESS" :src="qrDataURL" />
<div v-else-if="state === SHARE_QR_STATE.LOADING">加载中...</div>
<div v-else-if="state === SHARE_QR_STATE.FAIL" @click="refetchQR">失败重试</div>
```
