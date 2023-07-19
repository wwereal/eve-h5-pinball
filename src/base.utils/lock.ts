import { onBeforeUnmount } from 'vue';

export function useLockPage() {
    let $lockDiv: HTMLDivElement | null = null;
    const lock = () => {
        if ($lockDiv) {
            return;
        }

        $lockDiv = document.createElement('div');
        $lockDiv.style.cssText =
            'position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999999; touch-action: none;';
        document.body.appendChild($lockDiv);
    };

    const unlock = () => {
        if (!$lockDiv) {
            return;
        }

        document.body.removeChild($lockDiv);
        $lockDiv = null;
    };

    onBeforeUnmount(unlock);

    return {
        lock,
        unlock,
    };
}
