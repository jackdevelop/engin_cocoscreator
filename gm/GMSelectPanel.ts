import{MPanel,MPanelConfig}from '../scripts/libs/component/MPanel';import{BasePanel}from '../scripts/libs/base/BasePanel';import PoolManager from '../scripts/libs/pool/PoolManager';import{HallModel}from '../../app/hall/scripts/HallModel';import{ToolTips}from '../tooltips/ToolTips';import{resLoader}from '../scripts/libs/res/ResLoader';var _ = require('Underscore');const{ccclass,property,menu}= cc._decorator;@ccclass @menu('panel/common/GMSelectPanel') @MPanelConfig({PATH:'common/GMSelectPanel',TYPE:'single'}) export default class GMSelectPanel extends BasePanel{@property({type:cc.EditBox,tooltip:'EditBox'}) txt_gm:cc.EditBox = null;onStarted(param:any){let self = this}async onClickOK(event,eventdata){let self = this;if(!this.txt_gm){return}let cmd = 'game_gm_command';let gm_json_param = self.txt_gm.string;let ret = await HallModel.getInstance().game_gm_action(null,gm_json_param);if(ret){ToolTips.show('成功！')}}async onClickClose(event,eventdata){MPanel.hide(GMSelectPanel,null)}async onClickDump(event,eventdata){let Loader:any = cc.loader;let str = `当前资源总数:${Object.keys(Loader._cache).length}`;cc.log(str)}}