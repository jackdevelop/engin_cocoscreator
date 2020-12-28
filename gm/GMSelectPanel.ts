import{MPanel,MPanelConfig}from '../scripts/libs/component/MPanel';import{BasePanel}from '../scripts/libs/base/BasePanel';import{HallModel}from '../../app/hall/scripts/HallModel';var _ = require('Underscore');const{ccclass,property,menu}= cc._decorator;@ccclass @menu('panel/common/GMSelectPanel') @MPanelConfig({PATH:'common/GMSelectPanel',TYPE:'single'}) export default class GMSelectPanel extends BasePanel{@property({type:cc.EditBox,tooltip:'EditBox'}) txt_gm:cc.EditBox = null;onStarted(param:any){let self = this}async onClickOK(event,eventdata){let self = this;if(!this.txt_gm){return}let cmd = 'game_gm_command';let gm_param = self.txt_gm.string;let gm_type = 0 let ret = await HallModel.getInstance().game_gm(gm_type,gm_param)}async onClickClose(event,eventdata){MPanel.hide(GMSelectPanel,null)}async onClickDump(event,eventdata){let str = `当前资源总数:${Object.keys(cc.loader._cache).length}`;cc.log(str)}}