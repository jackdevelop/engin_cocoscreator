import { BaseEvent } from "../base/BaseEvent";
export class GameNotify extends BaseEvent {
  private static instance: GameNotify = null;
  public static getInstance(): GameNotify {
    if (this.instance == null) {
      this.instance = new GameNotify();
    }
    return this.instance;
  }
  public serverToClientHandle(msg) {
    var self = GameNotify.getInstance();
    var event = { name: "CMD", data: msg };
    self.dispatchEvent(event);
  }
  public onConnectionLost(event) {
    var self = GameNotify.getInstance();
    var event = { name: "CONNECTION_LOST", data: event.data };
    self.dispatchEvent(event);
  }
  public onConnectionClose(event) {
    var self = GameNotify.getInstance();
    cc.log("GameNotify.onConnectionClose");
    var event = { name: "CONNECTION_CLOSE", data: event.data };
    self.dispatchEvent(event);
  }
  public onConnectionError(event) {
    var self = GameNotify.getInstance();
    cc.log("GameNotify.onConnectionError");
    var event = { name: "CONNECTION_ERROR", data: event.data };
    self.dispatchEvent(event);
  }
  public onConnection(event) {
    var self = GameNotify.getInstance();
    var event = { name: "CONNECTION", data: event.data };
    self.dispatchEvent(event);
  }
}
