import { invoke } from '@yoda/bridge';
import { useLoading } from '@pet/23cny.loading/useLoading';
import type {
    ToolLoadUrlOnNewPageParams,
    SetStatusBarStyleParams,
    ChangeEventForCalendarParams,
} from '@yoda/bridge-types';
import { JumpSceneType, LiveJumpType } from '@/modules/main/pages/easy-live/types/live';

export function openWebview(params: ToolLoadUrlOnNewPageParams) {
    const finalParam = Object.assign(params, {
        url: !/^http(s)?:\/\//g.test(params.url) ? window.location.origin + params.url : params.url,
    });
    return invoke('tool.loadUrlOnNewPage', finalParam);
}

export function setStatusBarStyle(params: SetStatusBarStyleParams) {
    return invoke('ui.setStatusBarStyle', params);
}

export function popBack() {
    return invoke('webview.popBack');
}

export function setPageTitle(title: string) {
    return invoke('webview.setPageTitle', { title });
}

export function getServerTimestamp() {
    return invoke('system.getServerTime');
}

export function setCalendar(params: ChangeEventForCalendarParams) {
    return invoke('feed.changeEventForCalendar', params);
}

const { loading } = useLoading();
export async function hideLoadingPage() {
    loading.value?.hideLoading();
    try {
        await invoke('ui.hideLoadingPage');
    } catch {
        // 不用隐藏和处理错误
    }
}

export function liveGetMainInfo() {
    return invoke('feed.sf23H5Data');
}

export function gotoLive(type: LiveJumpType, scene: JumpSceneType = JumpSceneType.Click) {
    return invoke('feed.sf23Gesture', {
        type,
        scene,
    });
}

export async function closeWebview() {
    try {
        await invoke('webview.close');
    } catch {
        // 不用隐藏和处理错误
    }
}

export async function getLiveRoomInfo() {
    return invoke('kwaiLive.getLiveRoomInfo');
}

export function checkPluginStatus() {
    return invoke('feed.sf23LivePluginDownload');
}

export function checkSidebarStatus() {
    return invoke('feed.getAppMenuStatus');
}

export function stopLivePlay() {
    return invoke('live.stopLivePlay');
}

export function getWebviewStatus() {
    return invoke('webview.getWebviewStatus');
}

export function hideNavigationBar() {
    return invoke('webview.hideNavigationBar');
}

export async function vibrateShort() {
    try {
        await invoke('system.vibrateShort');
    } catch {
        // 不用隐藏和处理错误
    }
}
