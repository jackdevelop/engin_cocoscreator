import BaseComponent from "../base/BaseComponent";
const { ccclass, property, menu } = cc._decorator;
@ccclass
export default class TimeManager extends BaseComponent {
  private static instance: TimeManager = null;
  public static getInstance(): TimeManager {
    if (this.instance == null) {
      return null;
    }
    return this.instance;
  }
  private listeners_ = null;
  private listenerHandleIndex_: number = 0;
  onLoad() {
    TimeManager.instance = this;
    this.removeAllTime();
  }
  addTime(listener, time, priority) {
    if (!priority) {
      priority = 1;
    }
    this.listeners_ = listener;
    this.listenerHandleIndex_ = this.listenerHandleIndex_ + 1;
    var handle = priority + "_" + "HANDLE_" + this.listenerHandleIndex_;
    this.listeners_[handle] = listener;
    this.schedule(listener, time);
    return handle;
  }
  removeTime(key) {
    let self = this;
    var allListener = this.listeners_;
    for (var handle in allListener) {
      var listener = allListener[handle];
      if (key == handle || key == listener) {
        self.listeners_[handle] = null;
      }
    }
  }
  removeAllTime() {
    this.unscheduleAllCallbacks();
    this.listeners_ = new Object();
    this.listenerHandleIndex_ = 0;
  }
  onDestroy() {
    this.unscheduleAllCallbacks();
    this.removeAllTime();
  }
}
