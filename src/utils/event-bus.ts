type FunctionType = (...args: any[]) => any;
export default class EventBus {
  events: Record<string, Array<FunctionType>>;
 
  constructor() {
    this.events = {};
  }

  $on(eventName: string, callback: FunctionType) {
    this.events[eventName] = this.events[eventName] || [];
    this.events[eventName].push(callback);
  }

  $off(eventName: string, callback: FunctionType) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(fn => fn !== callback);
    }
  }

  $emit(eventName: string, ...data: any) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(fn => fn(...data));
    }
  }

  $once(eventName: string, callback: FunctionType) {
    const onceCallback: FunctionType = (...args: any[]) => {
      callback(...args);  // 调用回调函数
      this.$off(eventName, onceCallback);  // 移除事件监听
    };
    this.$on(eventName, onceCallback);
  }
}
