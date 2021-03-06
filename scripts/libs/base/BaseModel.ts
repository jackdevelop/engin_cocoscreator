const { ccclass, property } = cc._decorator;
@ccclass
export class BaseModel {
  private M_FSM = null;
  public FSM_init() {
    return true;
  }
  public FSM_get() {
    return this.M_FSM;
  }
  public FSM_go(one) {
    this.M_FSM.go(one);
  }
  public FSM_canGo(one) {
    return this.M_FSM.canGo(one);
  }
  public FSM_is(one) {
    return this.M_FSM.is(one);
  }
  public destroy(model) {
    this.M_FSM = null;
    if (this.instance) {
      this.instance = null;
    }
    if (model && model.instance) {
      model.instance = null;
    }
  }
}
