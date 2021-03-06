const { ccclass, property, menu } = cc._decorator;
@ccclass
@menu("framework/TMapTouch")
export default class TMapTouch extends cc.Component {
  @property(cc.Node) zone: cc.Node = null;
  @property(cc.Node) targetMap: cc.Node = null;
  @property({ type: cc.Boolean, tooltip: "是否可以拖动 " })
  is_touch: cc.Boolean = false;
  start() {
    let dis = 200;
    let self = this;
    this.targetMap.on(
      cc.Node.EventType.TOUCH_START,
      function (event) {
        if (!self.is_touch) {
          return;
        }
        event.stopPropagation();
      },
      this,
      true
    );
    this.targetMap.on(cc.Node.EventType.TOUCH_MOVE, function (
      event: cc.Event.EventTouch
    ) {
      if (!self.is_touch) {
        return;
      }
      let pre = event.getPreviousLocation();
      let cur = event.getLocation();
      var dir = cur.sub(pre);
      self.targetMap.x += dir.x;
      self.targetMap.y += dir.y;
      var zoneLeft = self.zone.x - self.zone.width / 2;
      var zoneRight = self.zone.x + self.zone.width / 2;
      var zoneTop = self.zone.y + self.zone.height / 2;
      var zoneBottom = self.zone.y - self.zone.height / 2;
      var halfMapWidth = self.targetMap.width / 2;
      var halfMapHeight = self.targetMap.height / 2 + dis;
      if (self.targetMap.x > dis) {
        self.targetMap.x = dis;
      }
      if (self.targetMap.x + self.targetMap.width < self.zone.width - dis) {
        self.targetMap.x = self.zone.width - dis - self.targetMap.width;
      }
      if (self.targetMap.y + halfMapHeight < zoneTop) {
        self.targetMap.y = zoneTop - halfMapHeight;
      }
      if (self.targetMap.y - halfMapHeight > zoneBottom) {
        self.targetMap.y = zoneBottom + halfMapHeight;
      }
    });
  }
}
