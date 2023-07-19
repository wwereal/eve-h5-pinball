import { type Ref, isRef, onMounted, onBeforeUnmount } from 'vue';
import { bindObserver, unbindObserver } from './help';

export function useDomListener<T extends Element | Window | Document>(
    elementFactory: () => T | Ref<T | null>,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
) {
    let element: T | Ref<T | null> | null = null;
    onMounted(() => {
        element = elementFactory();
        if (isRef(element)) {
            element.value?.addEventListener(type, listener, options);
        } else {
            element.addEventListener(type, listener, options);
        }
    });
    onBeforeUnmount(() => {
        if (isRef(element)) {
            element.value?.removeEventListener(type, listener, options);
        } else if (element) {
            element.removeEventListener(type, listener, options);
        }
        element = null;
    });
}

export function useIntersectionObservable(
    element: Ref<Element | null>,
    inCallback: () => void,
    outCallback?: () => void,
    options?: IntersectionObserverInit,
) {
    onMounted(() => {
        if (element.value) {
            bindObserver(element.value, inCallback, outCallback, options);
        }
    });

    onBeforeUnmount(() => {
        if (element.value) {
            unbindObserver(element.value);
        }
    });
}
