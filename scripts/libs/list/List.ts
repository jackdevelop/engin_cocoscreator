
const {
  ccclass,
  property,
  disallowMultiple,
  menu,
  executionOrder,
  requireComponent,
} = cc._decorator;

import ListItem from './ListItem';

enum TemplateType {
  NODE = 1,
  PREFAB = 2,
}

enum SlideType {
  NORMAL = 1, 
  ADHERING = 2, 
  PAGE = 3, 
}

enum SelectedType {
  NONE = 0,
  SINGLE = 1, 
  MULT = 2, 
}

@ccclass
@disallowMultiple()
@menu('自定义组件/List')
@requireComponent(cc.ScrollView)

@executionOrder(-5000)
export default class List extends cc.Component {
  
  @property({ type: cc.Enum(TemplateType), tooltip: CC_DEV && '模板类型' })
  private templateType: TemplateType = TemplateType.NODE;
  
  @property({
    type: cc.Node,
    tooltip: CC_DEV && '模板Item',
    visible() {
      return this.templateType == TemplateType.NODE;
    },
  })
  tmpNode: cc.Node = null;
  
  @property({
    type: cc.Prefab,
    tooltip: CC_DEV && '模板Item',
    visible() {
      return this.templateType == TemplateType.PREFAB;
    },
  })
  tmpPrefab: cc.Prefab = null;
  
  @property()
  private _slideMode: SlideType = SlideType.NORMAL;
  @property({
    type: cc.Enum(SlideType),
    tooltip: CC_DEV && '滑动模式',
  })
  set slideMode(val: SlideType) {
    this._slideMode = val;
  }
  get slideMode() {
    return this._slideMode;
  }
  
  @property({
    type: cc.Float,
    range: [0, 1, 0.1],
    tooltip: CC_DEV && '翻页作用距离',
    slide: true,
    visible() {
      return this._slideMode == SlideType.PAGE;
    },
  })
  public pageDistance: number = 0.3;
  
  @property({
    type: cc.Component.EventHandler,
    tooltip: CC_DEV && '页面改变事件',
    visible() {
      return this._slideMode == SlideType.PAGE;
    },
  })
  private pageChangeEvent: cc.Component.EventHandler = new cc.Component.EventHandler();
  
  @property()
  private _virtual: boolean = true;
  @property({
    type: cc.Boolean,
    tooltip: CC_DEV && '是否为虚拟列表（动态列表）',
  })
  set virtual(val: boolean) {
    if (val != null) this._virtual = val;
    if (!CC_DEV && this._numItems != 0) {
      this._onScrolling();
    }
  }
  get virtual() {
    return this._virtual;
  }
  
  @property({
    tooltip: CC_DEV && '是否为循环列表',
    visible() {
      let val: boolean = this.virtual && this.slideMode == SlideType.NORMAL;
      if (!val) this.cyclic = false;
      return val;
    },
  })
  public cyclic: boolean = false;
  
  @property({
    tooltip:
      CC_DEV &&
      'Item数量不足以填满Content时，是否居中显示Item（不支持Grid布局）',
    visible() {
      return this.virtual;
    },
  })
  public lackCenter: boolean = false;
  
  @property({
    tooltip: CC_DEV && 'Item数量不足以填满Content时，是否可滑动',
    visible() {
      let val: boolean = this.virtual && !this.lackCenter;
      if (!val) this.lackSlide = false;
      return val;
    },
  })
  public lackSlide: boolean = false;
  
  @property({ type: cc.Integer })
  private _updateRate: number = 0;
  @property({
    type: cc.Integer,
    range: [0, 6, 1],
    tooltip: CC_DEV && '刷新频率（值越大刷新频率越低、性能越高）',
    slide: true,
  })
  set updateRate(val: number) {
    if (val >= 0 && val <= 6) {
      this._updateRate = val;
    }
  }
  get updateRate() {
    return this._updateRate;
  }
  
  @property({
    type: cc.Integer,
    range: [0, 12, 1],
    tooltip: CC_DEV && '逐帧渲染时，每帧渲染的Item数量（<=0时关闭分帧渲染）',
    slide: true,
  })
  public frameByFrameRenderNum: number = 0;
  
  @property({
    type: cc.Component.EventHandler,
    tooltip: CC_DEV && '渲染事件（渲染器）',
  })
  private renderEvent: cc.Component.EventHandler = new cc.Component.EventHandler();
  
  @property({
    type: cc.Enum(SelectedType),
    tooltip: CC_DEV && '选择模式',
  })
  public selectedMode: SelectedType = SelectedType.NONE;
  @property({
    tooltip: CC_DEV && '是否重复响应单选事件',
    visible() {
      return this.selectedMode == SelectedType.SINGLE;
    },
  })
  public repeatEventSingle: boolean = false;
  
  @property({
    type: cc.Component.EventHandler,
    tooltip: CC_DEV && '触发选择事件',
    visible() {
      return this.selectedMode > SelectedType.NONE;
    },
  })
  private selectedEvent: cc.Component.EventHandler = null; 
  
  private _selectedId: number = -1;
  private _lastSelectedId: number;
  private multSelected: number[];
  set selectedId(val: number) {
    let t: any = this;
    let item: any;
    switch (t.selectedMode) {
      case SelectedType.SINGLE: {
        if (!t.repeatEventSingle && val == t._selectedId) return;
        item = t.getItemByListId(val);
        
        
        let listItem: ListItem;
        if (t._selectedId >= 0) t._lastSelectedId = t._selectedId;
        
        else t._lastSelectedId = null;
        t._selectedId = val;
        if (item) {
          listItem = item.getComponent(ListItem);
          listItem.selected = true;
        }
        if (t._lastSelectedId >= 0 && t._lastSelectedId != t._selectedId) {
          let lastItem: any = t.getItemByListId(t._lastSelectedId);
          if (lastItem) {
            lastItem.getComponent(ListItem).selected = false;
          }
        }
        if (t.selectedEvent) {
          cc.Component.EventHandler.emitEvents(
            [t.selectedEvent],
            item,
            val % this._actualNumItems,
            t._lastSelectedId == null
              ? null
              : t._lastSelectedId % this._actualNumItems
          );
        }
        break;
      }
      case SelectedType.MULT: {
        item = t.getItemByListId(val);
        if (!item) return;
        let listItem = item.getComponent(ListItem);
        if (t._selectedId >= 0) t._lastSelectedId = t._selectedId;
        t._selectedId = val;
        let bool: boolean = !listItem.selected;
        listItem.selected = bool;
        let sub: number = t.multSelected.indexOf(val);
        if (bool && sub < 0) {
          t.multSelected.push(val);
        } else if (!bool && sub >= 0) {
          t.multSelected.splice(sub, 1);
        }
        if (t.selectedEvent) {
          cc.Component.EventHandler.emitEvents(
            [t.selectedEvent],
            item,
            val % this._actualNumItems,
            t._lastSelectedId == null
              ? null
              : t._lastSelectedId % this._actualNumItems,
            bool
          );
        }
        break;
      }
    }
  }
  get selectedId() {
    return this._selectedId;
  }
  private _forceUpdate: boolean = false;
  private _align: number;
  private _horizontalDir: number;
  private _verticalDir: number;
  private _startAxis: number;
  private _alignCalcType: number;
  public content: cc.Node;
  private firstListId: number;
  public displayItemNum: number;
  private _updateDone: boolean = true;
  private _updateCounter: number;
  public _actualNumItems: number;
  private _cyclicNum: number;
  private _cyclicPos1: number;
  private _cyclicPos2: number;
  
  @property({
    serializable: false,
  })
  private _numItems: number = 0;
  set numItems(val: number) {
    let t = this;
    if (!t.checkInited(false)) return;
    if (val == null || val < 0) {
      cc.error('numItems set the wrong::', val);
      return;
    }
    t._actualNumItems = t._numItems = val;
    t._forceUpdate = true;

    if (t._virtual) {
      t._resizeContent();
      if (t.cyclic) {
        t._numItems = t._cyclicNum * t._numItems;
      }
      t._onScrolling();
      if (!t.frameByFrameRenderNum && t.slideMode == SlideType.PAGE)
        t.curPageNum = t.nearestListId;
    } else {
      let layout: cc.Layout = t.content.getComponent(cc.Layout);
      if (layout) {
        layout.enabled = true;
      }
      t._delRedundantItem();

      t.firstListId = 0;
      if (t.frameByFrameRenderNum > 0) {
        
        let len: number =
          t.frameByFrameRenderNum > t._numItems
            ? t._numItems
            : t.frameByFrameRenderNum;
        for (let n: number = 0; n < len; n++) {
          t._createOrUpdateItem2(n);
        }
        if (t.frameByFrameRenderNum < t._numItems) {
          t._updateCounter = t.frameByFrameRenderNum;
          t._updateDone = false;
        }
      } else {
        for (let n: number = 0; n < val; n++) {
          t._createOrUpdateItem2(n);
        }
        t.displayItemNum = val;
      }
    }
  }
  get numItems() {
    return this._actualNumItems;
  }

  private _inited: boolean = false;
  private _scrollView: cc.ScrollView;
  get scrollView() {
    return this._scrollView;
  }
  private _layout: cc.Layout;
  private _resizeMode: cc.Layout.ResizeMode;
  private _topGap: number;
  private _rightGap: number;
  private _bottomGap: number;
  private _leftGap: number;

  private _columnGap: number;
  private _lineGap: number;
  private _colLineNum: number;

  private _lastDisplayData: number[];
  public displayData: any[];
  private _pool: cc.NodePool;

  private _itemTmp: any;
  private _needUpdateWidget: boolean = false;
  private _itemSize: cc.Size;
  private _sizeType: boolean;

  public _customSize: any;

  private frameCount: number;
  private _aniDelRuning: boolean = false;
  private viewTop: number;
  private viewRight: number;
  private viewBottom: number;
  private viewLeft: number;

  private _doneAfterUpdate: boolean = false;

  private elasticTop: number;
  private elasticRight: number;
  private elasticBottom: number;
  private elasticLeft: number;

  private scrollToListId: number;

  private adhering: boolean = false;

  private _adheringBarrier: boolean = false;
  private nearestListId: number;

  public curPageNum: number = 0;
  private _beganPos: number;
  private _scrollPos: number;

  private _scrollToListId: number;
  private _scrollToEndTime: number;
  private _scrollToSo: any;

  private _lack: boolean;
  private _allItemSize: number;
  private _allItemSizeNoEdge: number;

  private _scrollItem: any; 

  

  onLoad() {
    this._init();
  }

  onDestroy() {
    let t: any = this;
    if (t._itemTmp && t._itemTmp.isValid) t._itemTmp.destroy();
    if (t.tmpNode && t.tmpNode.isValid) t.tmpNode.destroy();
    
    while (t._pool.size()) {
      let node = t._pool.get();
      node.destroy();
    }
    
    
  }

  onEnable() {
    
    this._registerEvent();
    this._init();
  }

  onDisable() {
    
    this._unregisterEvent();
  }
  
  _registerEvent() {
    let t: any = this;
    t.node.on(cc.Node.EventType.TOUCH_START, t._onTouchStart, t, true);
    t.node.on('touch-up', t._onTouchUp, t);
    t.node.on(cc.Node.EventType.TOUCH_CANCEL, t._onTouchCancelled, t, true);
    t.node.on('scroll-began', t._onScrollBegan, t, true);
    t.node.on('scroll-ended', t._onScrollEnded, t, true);
    t.node.on('scrolling', t._onScrolling, t, true);
    t.node.on(cc.Node.EventType.SIZE_CHANGED, t._onSizeChanged, t);
  }
  
  _unregisterEvent() {
    let t: any = this;
    t.node.off(cc.Node.EventType.TOUCH_START, t._onTouchStart, t, true);
    t.node.off('touch-up', t._onTouchUp, t);
    t.node.off(cc.Node.EventType.TOUCH_CANCEL, t._onTouchCancelled, t, true);
    t.node.off('scroll-began', t._onScrollBegan, t, true);
    t.node.off('scroll-ended', t._onScrollEnded, t, true);
    t.node.off('scrolling', t._onScrolling, t, true);
    t.node.off(cc.Node.EventType.SIZE_CHANGED, t._onSizeChanged, t);
  }
  
  _init() {
    let t: any = this;
    if (t._inited) return;

    t._scrollView = t.node.getComponent(cc.ScrollView);

    t.content = t._scrollView.content;
    if (!t.content) {
      cc.error(t.node.name + "'s cc.ScrollView unset content!");
      return;
    }

    t._layout = t.content.getComponent(cc.Layout);

    t._align = t._layout.type; 
    t._resizeMode = t._layout.resizeMode; 
    t._startAxis = t._layout.startAxis;

    t._topGap = t._layout.paddingTop; 
    t._rightGap = t._layout.paddingRight; 
    t._bottomGap = t._layout.paddingBottom; 
    t._leftGap = t._layout.paddingLeft; 

    t._columnGap = t._layout.spacingX; 
    t._lineGap = t._layout.spacingY; 

    t._colLineNum; 

    t._verticalDir = t._layout.verticalDirection; 
    t._horizontalDir = t._layout.horizontalDirection; 

    t.setTemplateItem(
      cc.instantiate(
        t.templateType == TemplateType.PREFAB ? t.tmpPrefab : t.tmpNode
      )
    );

    
    if (t._slideMode == SlideType.ADHERING || t._slideMode == SlideType.PAGE) {
      t._scrollView.inertia = false;
      t._scrollView._onMouseWheel = function () {
        return;
      };
    }
    if (!t.virtual)
      
      t.lackCenter = false;

    t._lastDisplayData = []; 
    t.displayData = []; 
    t._pool = new cc.NodePool(); 
    t._forceUpdate = false; 
    t._updateCounter = 0; 
    t._updateDone = true; 

    t.curPageNum = 0; 

    if (t.cyclic || 0) {
      t._scrollView._processAutoScrolling = this._processAutoScrolling.bind(t);
      t._scrollView._startBounceBackIfNeeded = function () {
        return false;
      };
      
      
      
    }

    switch (t._align) {
      case cc.Layout.Type.HORIZONTAL: {
        switch (t._horizontalDir) {
          case cc.Layout.HorizontalDirection.LEFT_TO_RIGHT:
            t._alignCalcType = 1;
            break;
          case cc.Layout.HorizontalDirection.RIGHT_TO_LEFT:
            t._alignCalcType = 2;
            break;
        }
        break;
      }
      case cc.Layout.Type.VERTICAL: {
        switch (t._verticalDir) {
          case cc.Layout.VerticalDirection.TOP_TO_BOTTOM:
            t._alignCalcType = 3;
            break;
          case cc.Layout.VerticalDirection.BOTTOM_TO_TOP:
            t._alignCalcType = 4;
            break;
        }
        break;
      }
      case cc.Layout.Type.GRID: {
        switch (t._startAxis) {
          case cc.Layout.AxisDirection.HORIZONTAL:
            switch (t._verticalDir) {
              case cc.Layout.VerticalDirection.TOP_TO_BOTTOM:
                t._alignCalcType = 3;
                break;
              case cc.Layout.VerticalDirection.BOTTOM_TO_TOP:
                t._alignCalcType = 4;
                break;
            }
            break;
          case cc.Layout.AxisDirection.VERTICAL:
            switch (t._horizontalDir) {
              case cc.Layout.HorizontalDirection.LEFT_TO_RIGHT:
                t._alignCalcType = 1;
                break;
              case cc.Layout.HorizontalDirection.RIGHT_TO_LEFT:
                t._alignCalcType = 2;
                break;
            }
            break;
        }
        break;
      }
    }
    
    
    
    
    
    
    
    t.content.destroyAllChildren();

    t._inited = true;
  }
  
  _processAutoScrolling(dt: number) {
    
    let brakingFactor: number = 1;
    this._scrollView['_autoScrollAccumulatedTime'] += dt * (1 / brakingFactor);

    let percentage: number = Math.min(
      1,
      this._scrollView['_autoScrollAccumulatedTime'] /
        this._scrollView['_autoScrollTotalTime']
    );
    if (this._scrollView['_autoScrollAttenuate']) {
      let time: number = percentage - 1;
      percentage = time * time * time * time * time + 1;
    }

    let newPosition: any = this._scrollView['_autoScrollStartPosition'].add(
      this._scrollView['_autoScrollTargetDelta'].mul(percentage)
    );
    let EPSILON: number = this._scrollView['getScrollEndedEventTiming']();
    let reachedEnd: boolean = Math.abs(percentage - 1) <= EPSILON;
    

    let fireEvent: boolean =
      Math.abs(percentage - 1) <=
      this._scrollView['getScrollEndedEventTiming']();
    if (
      fireEvent &&
      !this._scrollView['_isScrollEndedWithThresholdEventFired']
    ) {
      this._scrollView['_dispatchEvent']('scroll-ended-with-threshold');
      this._scrollView['_isScrollEndedWithThresholdEventFired'] = true;
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    

    if (reachedEnd) {
      this._scrollView['_autoScrolling'] = false;
    }

    let deltaMove: any = newPosition.sub(this._scrollView.getContentPosition());
    
    this._scrollView['_moveContent'](
      this._scrollView['_clampDelta'](deltaMove),
      reachedEnd
    );
    this._scrollView['_dispatchEvent']('scrolling');

    
    if (!this._scrollView['_autoScrolling']) {
      this._scrollView['_isBouncing'] = false;
      this._scrollView['_scrolling'] = false;
      this._scrollView['_dispatchEvent']('scroll-ended');
    }
  }
  
  setTemplateItem(item: any) {
    if (!item) return;
    let t: any = this;
    t._itemTmp = item;

    if (t._resizeMode == cc.Layout.ResizeMode.CHILDREN)
      t._itemSize = t._layout.cellSize;
    else t._itemSize = cc.size(item.width, item.height);

    
    let com = item.getComponent(ListItem);
    let remove = false;
    if (!com) remove = true;
    
    
    
    
    
    if (remove) {
      t.selectedMode = SelectedType.NONE;
    }
    com = item.getComponent(cc.Widget);
    if (com && com.enabled) {
      t._needUpdateWidget = true;
    }
    if (t.selectedMode == SelectedType.MULT) t.multSelected = [];

    switch (t._align) {
      case cc.Layout.Type.HORIZONTAL:
        t._colLineNum = 1;
        t._sizeType = false;
        break;
      case cc.Layout.Type.VERTICAL:
        t._colLineNum = 1;
        t._sizeType = true;
        break;
      case cc.Layout.Type.GRID:
        switch (t._startAxis) {
          case cc.Layout.AxisDirection.HORIZONTAL:
            
            let trimW: number = t.content.width - t._leftGap - t._rightGap;
            t._colLineNum = Math.floor(
              (trimW + t._columnGap) / (t._itemSize.width + t._columnGap)
            );
            t._sizeType = true;
            break;
          case cc.Layout.AxisDirection.VERTICAL:
            
            let trimH: number = t.content.height - t._topGap - t._bottomGap;
            t._colLineNum = Math.floor(
              (trimH + t._lineGap) / (t._itemSize.height + t._lineGap)
            );
            t._sizeType = false;
            break;
        }
        break;
    }
  }
  
  checkInited(printLog: boolean = true) {
    if (!this._inited) {
      if (printLog) cc.error('List initialization not completed!');
      return false;
    }
    return true;
  }
  
  _resizeContent() {
    let t: any = this;
    let result: number;

    switch (t._align) {
      case cc.Layout.Type.HORIZONTAL: {
        if (t._customSize) {
          let fixed: any = t._getFixedSize(null);
          result =
            t._leftGap +
            fixed.val +
            t._itemSize.width * (t._numItems - fixed.count) +
            t._columnGap * (t._numItems - 1) +
            t._rightGap;
        } else {
          result =
            t._leftGap +
            t._itemSize.width * t._numItems +
            t._columnGap * (t._numItems - 1) +
            t._rightGap;
        }
        break;
      }
      case cc.Layout.Type.VERTICAL: {
        if (t._customSize) {
          let fixed: any = t._getFixedSize(null);
          result =
            t._topGap +
            fixed.val +
            t._itemSize.height * (t._numItems - fixed.count) +
            t._lineGap * (t._numItems - 1) +
            t._bottomGap;
        } else {
          result =
            t._topGap +
            t._itemSize.height * t._numItems +
            t._lineGap * (t._numItems - 1) +
            t._bottomGap;
        }
        break;
      }
      case cc.Layout.Type.GRID: {
        
        if (t.lackCenter) t.lackCenter = false;
        switch (t._startAxis) {
          case cc.Layout.AxisDirection.HORIZONTAL:
            let lineNum: number = Math.ceil(t._numItems / t._colLineNum);
            result =
              t._topGap +
              t._itemSize.height * lineNum +
              t._lineGap * (lineNum - 1) +
              t._bottomGap;
            break;
          case cc.Layout.AxisDirection.VERTICAL:
            let colNum: number = Math.ceil(t._numItems / t._colLineNum);
            result =
              t._leftGap +
              t._itemSize.width * colNum +
              t._columnGap * (colNum - 1) +
              t._rightGap;
            break;
        }
        break;
      }
    }

    let layout: cc.Layout = t.content.getComponent(cc.Layout);
    if (layout) layout.enabled = false;

    t._allItemSize = result;
    t._allItemSizeNoEdge =
      t._allItemSize -
      (t._sizeType ? t._topGap + t._bottomGap : t._leftGap + t._rightGap);

    if (t.cyclic) {
      let totalSize: number = t._sizeType ? t.node.height : t.node.width;

      t._cyclicPos1 = 0;
      totalSize -= t._cyclicPos1;
      t._cyclicNum = Math.ceil(totalSize / t._allItemSizeNoEdge) + 1;
      let spacing: number = t._sizeType ? t._lineGap : t._columnGap;
      t._cyclicPos2 = t._cyclicPos1 + t._allItemSizeNoEdge + spacing;
      t._cyclicAllItemSize =
        t._allItemSize +
        t._allItemSizeNoEdge * (t._cyclicNum - 1) +
        spacing * (t._cyclicNum - 1);
      t._cycilcAllItemSizeNoEdge = t._allItemSizeNoEdge * t._cyclicNum;
      t._cycilcAllItemSizeNoEdge += spacing * (t._cyclicNum - 1);
      
    }

    t._lack =
      !t.cyclic &&
      t._allItemSize < (t._sizeType ? t.node.height : t.node.width);
    let slideOffset: number =
      (!t._lack || !t.lackCenter) && t.lackSlide ? 0 : 0.1;

    let targetWH: number = t._lack
      ? (t._sizeType ? t.node.height : t.node.width) - slideOffset
      : t.cyclic
      ? t._cyclicAllItemSize
      : t._allItemSize;
    if (targetWH < 0) targetWH = 0;

    if (t._sizeType) {
      t.content.height = targetWH;
    } else {
      t.content.width = targetWH;
    }

    
  }

  
  _onScrolling(ev: cc.Event = null) {
    if (this.frameCount == null) this.frameCount = this._updateRate;
    if (
      !this._forceUpdate &&
      ev &&
      ev.type != 'scroll-ended' &&
      this.frameCount > 0
    ) {
      this.frameCount--;
      return;
    } else this.frameCount = this._updateRate;

    if (this._aniDelRuning) return;

    
    if (this.cyclic) {
      let scrollPos: any = this.content.getPosition();
      scrollPos = this._sizeType ? scrollPos.y : scrollPos.x;

      let addVal =
        this._allItemSizeNoEdge +
        (this._sizeType ? this._lineGap : this._columnGap);
      let add: any = this._sizeType ? cc.v2(0, addVal) : cc.v2(addVal, 0);

      switch (this._alignCalcType) {
        case 1: 
          if (scrollPos > -this._cyclicPos1) {
            this.content.x = -this._cyclicPos2;
            if (this._scrollView.isAutoScrolling()) {
              this._scrollView['_autoScrollStartPosition'] = this._scrollView[
                '_autoScrollStartPosition'
              ].sub(add);
            }
            
            
            
          } else if (scrollPos < -this._cyclicPos2) {
            this.content.x = -this._cyclicPos1;
            if (this._scrollView.isAutoScrolling()) {
              this._scrollView['_autoScrollStartPosition'] = this._scrollView[
                '_autoScrollStartPosition'
              ].add(add);
            }
            
            
            
          }
          break;
        case 2: 
          if (scrollPos < this._cyclicPos1) {
            this.content.x = this._cyclicPos2;
            if (this._scrollView.isAutoScrolling()) {
              this._scrollView['_autoScrollStartPosition'] = this._scrollView[
                '_autoScrollStartPosition'
              ].add(add);
            }
          } else if (scrollPos > this._cyclicPos2) {
            this.content.x = this._cyclicPos1;
            if (this._scrollView.isAutoScrolling()) {
              this._scrollView['_autoScrollStartPosition'] = this._scrollView[
                '_autoScrollStartPosition'
              ].sub(add);
            }
          }
          break;
        case 3: 
          if (scrollPos < this._cyclicPos1) {
            this.content.y = this._cyclicPos2;
            if (this._scrollView.isAutoScrolling()) {
              this._scrollView['_autoScrollStartPosition'] = this._scrollView[
                '_autoScrollStartPosition'
              ].add(add);
            }
          } else if (scrollPos > this._cyclicPos2) {
            this.content.y = this._cyclicPos1;
            if (this._scrollView.isAutoScrolling()) {
              this._scrollView['_autoScrollStartPosition'] = this._scrollView[
                '_autoScrollStartPosition'
              ].sub(add);
            }
          }
          break;
        case 4: 
          if (scrollPos > -this._cyclicPos1) {
            this.content.y = -this._cyclicPos2;
            if (this._scrollView.isAutoScrolling()) {
              this._scrollView['_autoScrollStartPosition'] = this._scrollView[
                '_autoScrollStartPosition'
              ].sub(add);
            }
          } else if (scrollPos < -this._cyclicPos2) {
            this.content.y = -this._cyclicPos1;
            if (this._scrollView.isAutoScrolling()) {
              this._scrollView['_autoScrollStartPosition'] = this._scrollView[
                '_autoScrollStartPosition'
              ].add(add);
            }
          }
          break;
      }
    }

    this._calcViewPos();

    let vTop: number, vRight: number, vBottom: number, vLeft: number;
    if (this._sizeType) {
      vTop = this.viewTop;
      vBottom = this.viewBottom;
    } else {
      vRight = this.viewRight;
      vLeft = this.viewLeft;
    }

    if (this._virtual) {
      this.displayData = [];
      let itemPos: any;

      let curId: number = 0;
      let endId: number = this._numItems - 1;

      if (this._customSize) {
        let breakFor: boolean = false;
        
        for (; curId <= endId && !breakFor; curId++) {
          itemPos = this._calcItemPos(curId);
          switch (this._align) {
            case cc.Layout.Type.HORIZONTAL:
              if (itemPos.right >= vLeft && itemPos.left <= vRight) {
                this.displayData.push(itemPos);
              } else if (curId != 0 && this.displayData.length > 0) {
                breakFor = true;
              }
              break;
            case cc.Layout.Type.VERTICAL:
              if (itemPos.bottom <= vTop && itemPos.top >= vBottom) {
                this.displayData.push(itemPos);
              } else if (curId != 0 && this.displayData.length > 0) {
                breakFor = true;
              }
              break;
            case cc.Layout.Type.GRID:
              switch (this._startAxis) {
                case cc.Layout.AxisDirection.HORIZONTAL:
                  if (itemPos.bottom <= vTop && itemPos.top >= vBottom) {
                    this.displayData.push(itemPos);
                  } else if (curId != 0 && this.displayData.length > 0) {
                    breakFor = true;
                  }
                  break;
                case cc.Layout.AxisDirection.VERTICAL:
                  if (itemPos.right >= vLeft && itemPos.left <= vRight) {
                    this.displayData.push(itemPos);
                  } else if (curId != 0 && this.displayData.length > 0) {
                    breakFor = true;
                  }
                  break;
              }
              break;
          }
        }
      } else {
        let ww: number = this._itemSize.width + this._columnGap;
        let hh: number = this._itemSize.height + this._lineGap;
        switch (this._alignCalcType) {
          case 1: 
            curId = (vLeft + this._leftGap) / ww;
            endId = (vRight + this._rightGap) / ww;
            break;
          case 2: 
            curId = (-vRight - this._rightGap) / ww;
            endId = (-vLeft - this._leftGap) / ww;
            break;
          case 3: 
            curId = (-vTop - this._topGap) / hh;
            endId = (-vBottom - this._bottomGap) / hh;
            break;
          case 4: 
            curId = (vBottom + this._bottomGap) / hh;
            endId = (vTop + this._topGap) / hh;
            break;
        }
        curId = Math.floor(curId) * this._colLineNum;
        endId = Math.ceil(endId) * this._colLineNum;
        endId--;
        if (curId < 0) curId = 0;
        if (endId >= this._numItems) endId = this._numItems - 1;
        for (; curId <= endId; curId++) {
          this.displayData.push(this._calcItemPos(curId));
        }
      }
      this._delRedundantItem();
      if (this.displayData.length <= 0 || !this._numItems) {
        
        this._lastDisplayData = [];
        return;
      }
      this.firstListId = this.displayData[0].id;
      this.displayItemNum = this.displayData.length;

      let len: number = this._lastDisplayData.length;

      let haveDataChange: boolean = this.displayItemNum != len;
      if (haveDataChange) {
        
        if (this.frameByFrameRenderNum > 0) {
          this._lastDisplayData.sort((a, b) => {
            return a - b;
          });
        }
        
        haveDataChange =
          this.firstListId != this._lastDisplayData[0] ||
          this.displayData[this.displayItemNum - 1].id !=
            this._lastDisplayData[len - 1];
      }

      if (this._forceUpdate || haveDataChange) {
        
        if (this.frameByFrameRenderNum > 0) {
          
          
          
          if (this._numItems > 0) {
            if (!this._updateDone) {
              this._doneAfterUpdate = true;
            } else {
              this._updateCounter = 0;
            }
            this._updateDone = false;
          } else {
            this._updateCounter = 0;
            this._updateDone = true;
          }
          
        } else {
          
          this._lastDisplayData = [];
          
          for (let c = 0; c < this.displayItemNum; c++) {
            this._createOrUpdateItem(this.displayData[c]);
          }
          this._forceUpdate = false;
        }
      }
      this._calcNearestItem();
    }
  }
  
  _calcViewPos() {
    let scrollPos: any = this.content.getPosition();
    switch (this._alignCalcType) {
      case 1: 
        this.elasticLeft = scrollPos.x > 0 ? scrollPos.x : 0;
        this.viewLeft = (scrollPos.x < 0 ? -scrollPos.x : 0) - this.elasticLeft;
        this.viewRight = this.viewLeft + this.node.width;
        this.elasticRight =
          this.viewRight > this.content.width
            ? Math.abs(this.viewRight - this.content.width)
            : 0;
        this.viewRight += this.elasticRight;
        
        break;
      case 2: 
        this.elasticRight = scrollPos.x < 0 ? -scrollPos.x : 0;
        this.viewRight =
          (scrollPos.x > 0 ? -scrollPos.x : 0) + this.elasticRight;
        this.viewLeft = this.viewRight - this.node.width;
        this.elasticLeft =
          this.viewLeft < -this.content.width
            ? Math.abs(this.viewLeft + this.content.width)
            : 0;
        this.viewLeft -= this.elasticLeft;
        
        break;
      case 3: 
        this.elasticTop = scrollPos.y < 0 ? Math.abs(scrollPos.y) : 0;
        this.viewTop = (scrollPos.y > 0 ? -scrollPos.y : 0) + this.elasticTop;
        this.viewBottom = this.viewTop - this.node.height;
        this.elasticBottom =
          this.viewBottom < -this.content.height
            ? Math.abs(this.viewBottom + this.content.height)
            : 0;
        this.viewBottom += this.elasticBottom;
        
        break;
      case 4: 
        this.elasticBottom = scrollPos.y > 0 ? Math.abs(scrollPos.y) : 0;
        this.viewBottom =
          (scrollPos.y < 0 ? -scrollPos.y : 0) - this.elasticBottom;
        this.viewTop = this.viewBottom + this.node.height;
        this.elasticTop =
          this.viewTop > this.content.height
            ? Math.abs(this.viewTop - this.content.height)
            : 0;
        this.viewTop -= this.elasticTop;
        
        break;
    }
  }
  
  _calcItemPos(id: number) {
    let width: number,
      height: number,
      top: number,
      bottom: number,
      left: number,
      right: number,
      itemX: number,
      itemY: number;
    switch (this._align) {
      case cc.Layout.Type.HORIZONTAL:
        switch (this._horizontalDir) {
          case cc.Layout.HorizontalDirection.LEFT_TO_RIGHT: {
            if (this._customSize) {
              let fixed: any = this._getFixedSize(id);
              left =
                this._leftGap +
                (this._itemSize.width + this._columnGap) * (id - fixed.count) +
                (fixed.val + this._columnGap * fixed.count);
              let cs: number = this._customSize[id];
              width = cs > 0 ? cs : this._itemSize.width;
            } else {
              left =
                this._leftGap + (this._itemSize.width + this._columnGap) * id;
              width = this._itemSize.width;
            }
            right = left + width;
            if (this.lackCenter) {
              let offset: number =
                this.content.width / 2 - this._allItemSizeNoEdge / 2;
              left += offset;
              right += offset;
            }
            return {
              id: id,
              left: left,
              right: right,
              x: left + this._itemTmp.anchorX * width,
              y: this._itemTmp.y,
            };
          }
          case cc.Layout.HorizontalDirection.RIGHT_TO_LEFT: {
            if (this._customSize) {
              let fixed: any = this._getFixedSize(id);
              right =
                -this._rightGap -
                (this._itemSize.width + this._columnGap) * (id - fixed.count) -
                (fixed.val + this._columnGap * fixed.count);
              let cs: number = this._customSize[id];
              width = cs > 0 ? cs : this._itemSize.width;
            } else {
              right =
                -this._rightGap - (this._itemSize.width + this._columnGap) * id;
              width = this._itemSize.width;
            }
            left = right - width;
            if (this.lackCenter) {
              let offset: number =
                this.content.width / 2 - this._allItemSizeNoEdge / 2;
              left -= offset;
              right -= offset;
            }
            return {
              id: id,
              right: right,
              left: left,
              x: left + this._itemTmp.anchorX * width,
              y: this._itemTmp.y,
            };
          }
        }
        break;
      case cc.Layout.Type.VERTICAL: {
        switch (this._verticalDir) {
          case cc.Layout.VerticalDirection.TOP_TO_BOTTOM: {
            if (this._customSize) {
              let fixed: any = this._getFixedSize(id);
              top =
                -this._topGap -
                (this._itemSize.height + this._lineGap) * (id - fixed.count) -
                (fixed.val + this._lineGap * fixed.count);
              let cs: number = this._customSize[id];
              height = cs > 0 ? cs : this._itemSize.height;
            } else {
              top =
                -this._topGap - (this._itemSize.height + this._lineGap) * id;
              height = this._itemSize.height;
            }
            bottom = top - height;
            if (this.lackCenter) {
              let offset: number =
                this.content.height / 2 - this._allItemSizeNoEdge / 2;
              top -= offset;
              bottom -= offset;
            }
            return {
              id: id,
              top: top,
              bottom: bottom,
              x: this._itemTmp.x,
              y: bottom + this._itemTmp.anchorY * height,
            };
          }
          case cc.Layout.VerticalDirection.BOTTOM_TO_TOP: {
            if (this._customSize) {
              let fixed: any = this._getFixedSize(id);
              bottom =
                this._bottomGap +
                (this._itemSize.height + this._lineGap) * (id - fixed.count) +
                (fixed.val + this._lineGap * fixed.count);
              let cs: number = this._customSize[id];
              height = cs > 0 ? cs : this._itemSize.height;
            } else {
              bottom =
                this._bottomGap + (this._itemSize.height + this._lineGap) * id;
              height = this._itemSize.height;
            }
            top = bottom + height;
            if (this.lackCenter) {
              let offset: number =
                this.content.height / 2 - this._allItemSizeNoEdge / 2;
              top += offset;
              bottom += offset;
            }
            return {
              id: id,
              top: top,
              bottom: bottom,
              x: this._itemTmp.x,
              y: bottom + this._itemTmp.anchorY * height,
            };
            break;
          }
        }
      }
      case cc.Layout.Type.GRID: {
        let colLine: number = Math.floor(id / this._colLineNum);
        switch (this._startAxis) {
          case cc.Layout.AxisDirection.HORIZONTAL: {
            switch (this._verticalDir) {
              case cc.Layout.VerticalDirection.TOP_TO_BOTTOM: {
                top =
                  -this._topGap -
                  (this._itemSize.height + this._lineGap) * colLine;
                bottom = top - this._itemSize.height;
                itemY = bottom + this._itemTmp.anchorY * this._itemSize.height;
                break;
              }
              case cc.Layout.VerticalDirection.BOTTOM_TO_TOP: {
                bottom =
                  this._bottomGap +
                  (this._itemSize.height + this._lineGap) * colLine;
                top = bottom + this._itemSize.height;
                itemY = bottom + this._itemTmp.anchorY * this._itemSize.height;
                break;
              }
            }
            itemX =
              this._leftGap +
              (id % this._colLineNum) *
                (this._itemSize.width + this._columnGap);
            switch (this._horizontalDir) {
              case cc.Layout.HorizontalDirection.LEFT_TO_RIGHT: {
                itemX += this._itemTmp.anchorX * this._itemSize.width;
                itemX -= this.content.anchorX * this.content.width;
                break;
              }
              case cc.Layout.HorizontalDirection.RIGHT_TO_LEFT: {
                itemX += (1 - this._itemTmp.anchorX) * this._itemSize.width;
                itemX -= (1 - this.content.anchorX) * this.content.width;
                itemX *= -1;
                break;
              }
            }
            return {
              id: id,
              top: top,
              bottom: bottom,
              x: itemX,
              y: itemY,
            };
          }
          case cc.Layout.AxisDirection.VERTICAL: {
            switch (this._horizontalDir) {
              case cc.Layout.HorizontalDirection.LEFT_TO_RIGHT: {
                left =
                  this._leftGap +
                  (this._itemSize.width + this._columnGap) * colLine;
                right = left + this._itemSize.width;
                itemX = left + this._itemTmp.anchorX * this._itemSize.width;
                itemX -= this.content.anchorX * this.content.width;
                break;
              }
              case cc.Layout.HorizontalDirection.RIGHT_TO_LEFT: {
                right =
                  -this._rightGap -
                  (this._itemSize.width + this._columnGap) * colLine;
                left = right - this._itemSize.width;
                itemX = left + this._itemTmp.anchorX * this._itemSize.width;
                itemX += (1 - this.content.anchorX) * this.content.width;
                break;
              }
            }
            itemY =
              -this._topGap -
              (id % this._colLineNum) * (this._itemSize.height + this._lineGap);
            switch (this._verticalDir) {
              case cc.Layout.VerticalDirection.TOP_TO_BOTTOM: {
                itemY -= (1 - this._itemTmp.anchorY) * this._itemSize.height;
                itemY += (1 - this.content.anchorY) * this.content.height;
                break;
              }
              case cc.Layout.VerticalDirection.BOTTOM_TO_TOP: {
                itemY -= this._itemTmp.anchorY * this._itemSize.height;
                itemY += this.content.anchorY * this.content.height;
                itemY *= -1;
                break;
              }
            }
            return {
              id: id,
              left: left,
              right: right,
              x: itemX,
              y: itemY,
            };
          }
        }
        break;
      }
    }
  }
  
  _calcExistItemPos(id: number) {
    let item: any = this.getItemByListId(id);
    if (!item) return null;
    let data: any = {
      id: id,
      x: item.x,
      y: item.y,
    };
    if (this._sizeType) {
      data.top = item.y + item.height * (1 - item.anchorY);
      data.bottom = item.y - item.height * item.anchorY;
    } else {
      data.left = item.x - item.width * item.anchorX;
      data.right = item.x + item.width * (1 - item.anchorX);
    }
    return data;
  }
  
  getItemPos(id: number) {
    if (this._virtual) return this._calcItemPos(id);
    else {
      if (this.frameByFrameRenderNum) return this._calcItemPos(id);
      else return this._calcExistItemPos(id);
    }
  }
  
  _getFixedSize(listId: number) {
    if (!this._customSize) return null;
    if (listId == null) listId = this._numItems;
    let fixed: number = 0;
    let count: number = 0;
    for (let id in this._customSize) {
      if (parseInt(id) < listId) {
        fixed += this._customSize[id];
        count++;
      }
    }
    return {
      val: fixed,
      count: count,
    };
  }
  
  _onScrollBegan() {
    this._beganPos = this._sizeType ? this.viewTop : this.viewLeft;
  }
  
  _onScrollEnded() {
    let t: any = this;
    if (t.scrollToListId != null) {
      let item: any = t.getItemByListId(t.scrollToListId);
      t.scrollToListId = null;
      if (item) {
        item.runAction(
          cc.sequence(
            cc.scaleTo(0.1, 1.06),
            cc.scaleTo(0.1, 1)
            

            
          )
        );
      }
    }
    t._onScrolling();

    if (t._slideMode == SlideType.ADHERING && !t.adhering) {
      
      t.adhere();
    } else if (t._slideMode == SlideType.PAGE) {
      if (t._beganPos != null) {
        this._pageAdhere();
      } else {
        t.adhere();
      }
    }
  }
  
  _onTouchStart(ev, captureListeners) {
    if (this._scrollView['_hasNestedViewGroup'](ev, captureListeners)) return;
    let isMe = ev.eventPhase === cc.Event.AT_TARGET && ev.target === this.node;
    if (!isMe) {
      let itemNode: any = ev.target;
      while (itemNode._listId == null && itemNode.parent)
        itemNode = itemNode.parent;
      this._scrollItem = itemNode._listId != null ? itemNode : ev.target;
    }
  }
  
  _onTouchUp() {
    let t: any = this;
    t._scrollPos = null;
    if (t._slideMode == SlideType.ADHERING) {
      if (this.adhering) this._adheringBarrier = true;
      t.adhere();
    } else if (t._slideMode == SlideType.PAGE) {
      if (t._beganPos != null) {
        this._pageAdhere();
      } else {
        t.adhere();
      }
    }
    this._scrollItem = null;
  }

  _onTouchCancelled(ev, captureListeners) {
    let t = this;
    if (
      t._scrollView['_hasNestedViewGroup'](ev, captureListeners) ||
      ev.simulate
    )
      return;

    t._scrollPos = null;
    if (t._slideMode == SlideType.ADHERING) {
      if (t.adhering) t._adheringBarrier = true;
      t.adhere();
    } else if (t._slideMode == SlideType.PAGE) {
      if (t._beganPos != null) {
        t._pageAdhere();
      } else {
        t.adhere();
      }
    }
    this._scrollItem = null;
  }
  
  _onSizeChanged() {
    if (this.checkInited(false)) this._onScrolling();
  }
  
  _onItemAdaptive(item) {
    
    if (
      (!this._sizeType && item.width != this._itemSize.width) ||
      (this._sizeType && item.height != this._itemSize.height)
    ) {
      if (!this._customSize) this._customSize = {};
      let val = this._sizeType ? item.height : item.width;
      if (this._customSize[item._listId] != val) {
        this._customSize[item._listId] = val;
        this._resizeContent();
        
        
        
        this.updateAll();
        
        if (this._scrollToListId != null) {
          this._scrollPos = null;
          this.unschedule(this._scrollToSo);
          this.scrollTo(
            this._scrollToListId,
            Math.max(0, this._scrollToEndTime - new Date().getTime() / 1000)
          );
        }
      }
    }
    
  }
  
  _pageAdhere() {
    let t = this;
    if (
      !t.cyclic &&
      (t.elasticTop > 0 ||
        t.elasticRight > 0 ||
        t.elasticBottom > 0 ||
        t.elasticLeft > 0)
    )
      return;
    let curPos = t._sizeType ? t.viewTop : t.viewLeft;
    let dis = (t._sizeType ? t.node.height : t.node.width) * t.pageDistance;
    let canSkip = Math.abs(t._beganPos - curPos) > dis;
    if (canSkip) {
      let timeInSecond = 0.5;
      switch (t._alignCalcType) {
        case 1: 
        case 4: 
          if (t._beganPos > curPos) {
            t.prePage(timeInSecond);
            
          } else {
            t.nextPage(timeInSecond);
            
          }
          break;
        case 2: 
        case 3: 
          if (t._beganPos < curPos) {
            t.prePage(timeInSecond);
          } else {
            t.nextPage(timeInSecond);
          }
          break;
      }
    } else if (
      t.elasticTop <= 0 &&
      t.elasticRight <= 0 &&
      t.elasticBottom <= 0 &&
      t.elasticLeft <= 0
    ) {
      t.adhere();
    }
    t._beganPos = null;
  }
  
  adhere() {
    let t: any = this;
    if (!t.checkInited()) return;
    if (
      t.elasticTop > 0 ||
      t.elasticRight > 0 ||
      t.elasticBottom > 0 ||
      t.elasticLeft > 0
    )
      return;
    t.adhering = true;
    t._calcNearestItem();
    let offset: number =
      (t._sizeType ? t._topGap : t._leftGap) /
      (t._sizeType ? t.node.height : t.node.width);
    let timeInSecond: number = 0.7;
    t.scrollTo(t.nearestListId, timeInSecond, offset);
  }
  
  update() {
    if (this.frameByFrameRenderNum <= 0 || this._updateDone) return;
    
    if (this._virtual) {
      let len: number =
        this._updateCounter + this.frameByFrameRenderNum > this.displayItemNum
          ? this.displayItemNum
          : this._updateCounter + this.frameByFrameRenderNum;
      for (let n: number = this._updateCounter; n < len; n++) {
        let data: any = this.displayData[n];
        if (data) {
          this._createOrUpdateItem(data);
        }
      }

      if (this._updateCounter >= this.displayItemNum - 1) {
        
        if (this._doneAfterUpdate) {
          this._updateCounter = 0;
          this._updateDone = false;
          
          this._doneAfterUpdate = false;
        } else {
          this._updateDone = true;
          this._delRedundantItem();
          this._forceUpdate = false;
          this._calcNearestItem();
          if (this.slideMode == SlideType.PAGE)
            this.curPageNum = this.nearestListId;
        }
      } else {
        this._updateCounter += this.frameByFrameRenderNum;
      }
    } else {
      if (this._updateCounter < this._numItems) {
        let len: number =
          this._updateCounter + this.frameByFrameRenderNum > this._numItems
            ? this._numItems
            : this._updateCounter + this.frameByFrameRenderNum;
        for (let n: number = this._updateCounter; n < len; n++) {
          this._createOrUpdateItem2(n);
        }
        this._updateCounter += this.frameByFrameRenderNum;
      } else {
        this._updateDone = true;
        this._calcNearestItem();
        if (this.slideMode == SlideType.PAGE)
          this.curPageNum = this.nearestListId;
      }
    }
  }
  
  _createOrUpdateItem(data: any) {
    let item: any = this.getItemByListId(data.id);
    if (!item) {
      
      let canGet: boolean = this._pool.size() > 0;
      if (canGet) {
        item = this._pool.get();
        
      } else {
        item = cc.instantiate(this._itemTmp);
        
      }

      if (!item.isValid) {
        item.destroy();
        item = cc.instantiate(this._itemTmp);
      }

      if (item._listId != data.id) {
        item._listId = data.id;
        item.setContentSize(this._itemSize);
      }
      item.setPosition(cc.v2(data.x, data.y));
      this._resetItemSize(item);
      this.content.addChild(item);
      if (canGet && this._needUpdateWidget) {
        let widget: cc.Widget = item.getComponent(cc.Widget);
        if (widget) widget.updateAlignment();
      }
      item.setSiblingIndex(this.content.childrenCount - 1);

      let listItem: ListItem = item.getComponent(ListItem);
      item['listItem'] = listItem;
      if (listItem) {
        listItem.listId = data.id;
        listItem.list = this;
        listItem._registerEvent();
      }
      if (this.renderEvent) {
        cc.Component.EventHandler.emitEvents(
          [this.renderEvent],
          item,
          data.id % this._actualNumItems
        );
      }
    } else if (this._forceUpdate && this.renderEvent) {
      
      item.setPosition(cc.v2(data.x, data.y));
      this._resetItemSize(item);
      
      if (this.renderEvent) {
        cc.Component.EventHandler.emitEvents(
          [this.renderEvent],
          item,
          data.id % this._actualNumItems
        );
      }
    }
    this._resetItemSize(item);

    this._updateListItem(item['listItem']);
    if (this._lastDisplayData.indexOf(data.id) < 0) {
      this._lastDisplayData.push(data.id);
    }
  }
  
  _createOrUpdateItem2(listId: number) {
    let item: any = this.content.children[listId];
    let listItem: ListItem;
    if (!item) {
      
      item = cc.instantiate(this._itemTmp);
      item._listId = listId;
      this.content.addChild(item);
      listItem = item.getComponent(ListItem);
      item['listItem'] = listItem;
      if (listItem) {
        listItem.listId = listId;
        listItem.list = this;
        listItem._registerEvent();
      }
      if (this.renderEvent) {
        cc.Component.EventHandler.emitEvents([this.renderEvent], item, listId);
      }
    } else if (this._forceUpdate && this.renderEvent) {
      
      item._listId = listId;
      if (listItem) listItem.listId = listId;
      if (this.renderEvent) {
        cc.Component.EventHandler.emitEvents([this.renderEvent], item, listId);
      }
    }
    this._updateListItem(listItem);
    if (this._lastDisplayData.indexOf(listId) < 0) {
      this._lastDisplayData.push(listId);
    }
  }

  _updateListItem(listItem: ListItem) {
    if (!listItem) return;
    if (this.selectedMode > SelectedType.NONE) {
      let item: any = listItem.node;
      switch (this.selectedMode) {
        case SelectedType.SINGLE:
          listItem.selected = this.selectedId == item._listId;
          break;
        case SelectedType.MULT:
          listItem.selected = this.multSelected.indexOf(item._listId) >= 0;
          break;
      }
    }
  }
  
  _resetItemSize(item: any) {
    return;
    let size: number;
    if (this._customSize && this._customSize[item._listId]) {
      size = this._customSize[item._listId];
    } else {
      if (this._colLineNum > 1) item.setContentSize(this._itemSize);
      else size = this._sizeType ? this._itemSize.height : this._itemSize.width;
    }
    if (size) {
      if (this._sizeType) item.height = size;
      else item.width = size;
    }
  }
  
  _updateItemPos(listIdOrItem: any) {
    let item: any = isNaN(listIdOrItem)
      ? listIdOrItem
      : this.getItemByListId(listIdOrItem);
    let pos: any = this.getItemPos(item._listId);
    item.setPosition(pos.x, pos.y);
  }
  
  setMultSelected(args: any, bool: boolean) {
    let t: any = this;
    if (!t.checkInited()) return;
    if (!Array.isArray(args)) {
      args = [args];
    }
    if (bool == null) {
      t.multSelected = args;
    } else {
      let listId: number, sub: number;
      if (bool) {
        for (let n: number = args.length - 1; n >= 0; n--) {
          listId = args[n];
          sub = t.multSelected.indexOf(listId);
          if (sub < 0) {
            t.multSelected.push(listId);
          }
        }
      } else {
        for (let n: number = args.length - 1; n >= 0; n--) {
          listId = args[n];
          sub = t.multSelected.indexOf(listId);
          if (sub >= 0) {
            t.multSelected.splice(sub, 1);
          }
        }
      }
    }
    t._forceUpdate = true;
    t._onScrolling();
  }
  
  updateItem(args: any) {
    if (!this.checkInited()) return;
    if (!Array.isArray(args)) {
      args = [args];
    }
    for (let n: number = 0, len: number = args.length; n < len; n++) {
      let listId: number = args[n];
      let item: any = this.getItemByListId(listId);
      if (item)
        cc.Component.EventHandler.emitEvents(
          [this.renderEvent],
          item,
          listId % this._actualNumItems
        );
    }
  }
  
  updateAll() {
    if (!this.checkInited()) return;
    this.numItems = this.numItems;
  }
  
  getItemByListId(listId: number) {
    if (this.content) {
      for (let n: number = this.content.childrenCount - 1; n >= 0; n--) {
        let item: any = this.content.children[n];
        if (item._listId == listId) return item;
      }
    }
  }
  
  _getOutsideItem() {
    let item: any;
    let result: any[] = [];
    for (let n: number = this.content.childrenCount - 1; n >= 0; n--) {
      item = this.content.children[n];
      if (!this.displayData.find((d) => d.id == item._listId)) {
        result.push(item);
      }
    }
    return result;
  }
  
  _delRedundantItem() {
    if (this._virtual) {
      let arr: any[] = this._getOutsideItem();
      for (let n: number = arr.length - 1; n >= 0; n--) {
        let item: any = arr[n];
        if (this._scrollItem && item._listId == this._scrollItem._listId)
          continue;
        this._pool.put(item);
        for (let m: number = this._lastDisplayData.length - 1; m >= 0; m--) {
          if (this._lastDisplayData[m] == item._listId) {
            this._lastDisplayData.splice(m, 1);
            break;
          }
        }
      }
      
    } else {
      while (this.content.childrenCount > this._numItems) {
        this._delSingleItem(
          this.content.children[this.content.childrenCount - 1]
        );
      }
    }
  }
  
  _delSingleItem(item: any) {
    
    if (item.destroy) item.destroy();
    item.removeFromParent();

    item = null;
  }
  
  aniDelItem(listId: number, callFunc: Function, aniType: number) {
    let t: any = this;

    if (!t.checkInited() || t.cyclic || !t._virtual)
      return cc.error('This function is not allowed to be called!');

    if (t._aniDelRuning)
      return cc.warn('Please wait for the current deletion to finish!');

    let item: any = t.getItemByListId(listId);
    let listItem: ListItem;
    if (!item) {
      callFunc(listId);
      return;
    } else {
      listItem = item.getComponent(ListItem);
    }
    t._aniDelRuning = true;
    let curLastId: number = t.displayData[t.displayData.length - 1].id;
    let resetSelectedId: boolean = listItem.selected;
    listItem.showAni(
      aniType,
      () => {
        
        let newId: number;
        if (curLastId < t._numItems - 2) {
          newId = curLastId + 1;
        }
        if (newId != null) {
          let newData: any = t._calcItemPos(newId);
          t.displayData.push(newData);
          if (t._virtual) t._createOrUpdateItem(newData);
          else t._createOrUpdateItem2(newId);
        } else t._numItems--;
        if (t.selectedMode == SelectedType.SINGLE) {
          if (resetSelectedId) {
            t._selectedId = -1;
          } else if (t._selectedId - 1 >= 0) {
            t._selectedId--;
          }
        } else if (
          t.selectedMode == SelectedType.MULT &&
          t.multSelected.length
        ) {
          let sub: number = t.multSelected.indexOf(listId);
          if (sub >= 0) {
            t.multSelected.splice(sub, 1);
          }
          
          for (let n: number = t.multSelected.length - 1; n >= 0; n--) {
            let id: number = t.multSelected[n];
            if (id >= listId) t.multSelected[n]--;
          }
        }
        if (t._customSize) {
          if (t._customSize[listId]) delete t._customSize[listId];
          let newCustomSize: any = {};
          let size: number;
          for (let id in t._customSize) {
            size = t._customSize[id];
            let idNumber: number = parseInt(id);
            newCustomSize[idNumber - (idNumber >= listId ? 1 : 0)] = size;
          }
          t._customSize = newCustomSize;
        }
        
        let sec: number = 0.2333;
        let acts: any[], haveCB: boolean;
        for (
          let n: number = newId != null ? newId : curLastId;
          n >= listId + 1;
          n--
        ) {
          item = t.getItemByListId(n);
          if (item) {
            let posData: any = t._calcItemPos(n - 1);
            acts = [cc.moveTo(sec, cc.v2(posData.x, posData.y))];
            if (n <= listId + 1) {
              haveCB = true;
              acts.push(
                cc.callFunc(() => {
                  t._aniDelRuning = false;
                  callFunc(listId);
                })
              );
            }
            if (acts.length > 1) item.runAction(cc.sequence(acts));
            else item.runAction(acts[0]);
          }
        }
        if (!haveCB) {
          t._aniDelRuning = false;
          callFunc(listId);
        }
      },
      true
    );
  }
  
  scrollTo(
    listId: number,
    timeInSecond: number = 0.5,
    offset: number = null,
    overStress: boolean = false
  ) {
    let t = this;
    if (!t.checkInited(false)) return;
    
    if (timeInSecond == null)
      
      timeInSecond = 0.5;
    else if (timeInSecond < 0) timeInSecond = 0;
    if (listId < 0) listId = 0;
    else if (listId >= t._numItems) listId = t._numItems - 1;
    
    if (!t._virtual && t._layout && t._layout.enabled) t._layout.updateLayout();

    let pos = t.getItemPos(listId);
    let targetX: number, targetY: number;

    switch (t._alignCalcType) {
      case 1: 
        targetX = pos.left;
        if (offset != null) targetX -= t.node.width * offset;
        else targetX -= t._leftGap;
        pos = cc.v2(targetX, 0);
        break;
      case 2: 
        targetX = pos.right - t.node.width;
        if (offset != null) targetX += t.node.width * offset;
        else targetX += t._rightGap;
        pos = cc.v2(targetX + t.content.width, 0);
        break;
      case 3: 
        targetY = pos.top;
        if (offset != null) targetY += t.node.height * offset;
        else targetY += t._topGap;
        pos = cc.v2(0, -targetY);
        break;
      case 4: 
        targetY = pos.bottom + t.node.height;
        if (offset != null) targetY -= t.node.height * offset;
        else targetY -= t._bottomGap;
        pos = cc.v2(0, -targetY + t.content.height);
        break;
    }
    let viewPos: any = t.content.getPosition();
    viewPos = Math.abs(t._sizeType ? viewPos.y : viewPos.x);

    let comparePos = t._sizeType ? pos.y : pos.x;
    let runScroll =
      Math.abs((t._scrollPos != null ? t._scrollPos : viewPos) - comparePos) >
      0.5;
    

    
    if (runScroll) {
      t._scrollView.scrollToOffset(pos, timeInSecond);
      t._scrollToListId = listId;
      t._scrollToEndTime = new Date().getTime() / 1000 + timeInSecond;
      
      t._scrollToSo = t.scheduleOnce(() => {
        if (!t._adheringBarrier) {
          t.adhering = t._adheringBarrier = false;
        }
        t._scrollPos = t._scrollToListId = t._scrollToEndTime = t._scrollToSo = null;
        
        if (overStress) {
          
          let item = t.getItemByListId(listId);
          if (item) {
            item.runAction(
              cc.sequence(cc.scaleTo(0.1, 1.05), cc.scaleTo(0.1, 1))
            );
          }
        }
      }, timeInSecond + 0.1);

      if (timeInSecond <= 0) {
        t._onScrolling();
      }
    }
  }
  
  _calcNearestItem() {
    let t: any = this;
    t.nearestListId = null;
    let data: any, center: number;

    if (t._virtual) t._calcViewPos();

    let vTop: number, vRight: number, vBottom: number, vLeft: number;
    vTop = t.viewTop;
    vRight = t.viewRight;
    vBottom = t.viewBottom;
    vLeft = t.viewLeft;

    let breakFor: boolean = false;
    for (
      let n = 0;
      n < t.content.childrenCount && !breakFor;
      n += t._colLineNum
    ) {
      data = t._virtual ? t.displayData[n] : t._calcExistItemPos(n);
      if (data) {
        center = t._sizeType
          ? (data.top + data.bottom) / 2
          : (center = (data.left + data.right) / 2);
        switch (t._alignCalcType) {
          case 1: 
            if (data.right >= vLeft) {
              t.nearestListId = data.id;
              if (vLeft > center) t.nearestListId += t._colLineNum;
              breakFor = true;
            }
            break;
          case 2: 
            if (data.left <= vRight) {
              t.nearestListId = data.id;
              if (vRight < center) t.nearestListId += t._colLineNum;
              breakFor = true;
            }
            break;
          case 3: 
            if (data.bottom <= vTop) {
              t.nearestListId = data.id;
              if (vTop < center) t.nearestListId += t._colLineNum;
              breakFor = true;
            }
            break;
          case 4: 
            if (data.top >= vBottom) {
              t.nearestListId = data.id;
              if (vBottom > center) t.nearestListId += t._colLineNum;
              breakFor = true;
            }
            break;
        }
      }
    }
    
    data = t._virtual
      ? t.displayData[t.displayItemNum - 1]
      : t._calcExistItemPos(t._numItems - 1);
    if (data && data.id == t._numItems - 1) {
      center = t._sizeType
        ? (data.top + data.bottom) / 2
        : (center = (data.left + data.right) / 2);
      switch (t._alignCalcType) {
        case 1: 
          if (vRight > center) t.nearestListId = data.id;
          break;
        case 2: 
          if (vLeft < center) t.nearestListId = data.id;
          break;
        case 3: 
          if (vBottom < center) t.nearestListId = data.id;
          break;
        case 4: 
          if (vTop > center) t.nearestListId = data.id;
          break;
      }
    }
    
  }
  
  prePage(timeInSecond: number = 0.5) {
    
    if (!this.checkInited()) return;
    this.skipPage(this.curPageNum - 1, timeInSecond);
  }
  
  nextPage(timeInSecond: number = 0.5) {
    
    if (!this.checkInited()) return;
    this.skipPage(this.curPageNum + 1, timeInSecond);
  }
  
  skipPage(pageNum: number, timeInSecond: number) {
    let t: any = this;
    if (!t.checkInited()) return;
    if (t._slideMode != SlideType.PAGE)
      return cc.error(
        'This function is not allowed to be called, Must SlideMode = PAGE!'
      );
    if (pageNum < 0 || pageNum >= t._numItems) return;
    if (t.curPageNum == pageNum) return;
    
    t.curPageNum = pageNum;
    if (t.pageChangeEvent) {
      cc.Component.EventHandler.emitEvents([t.pageChangeEvent], pageNum);
    }
    t.scrollTo(pageNum, timeInSecond);
  }
  
  calcCustomSize(numItems: number) {
    let t: any = this;
    if (!t.checkInited()) return;
    if (!t._itemTmp) return cc.error('Unset template item!');
    if (!t.renderEvent) return cc.error('Unset Render-Event!');
    t._customSize = {};
    let temp: any = cc.instantiate(t._itemTmp);
    t.content.addChild(temp);
    for (let n: number = 0; n < numItems; n++) {
      cc.Component.EventHandler.emitEvents([t.renderEvent], temp, n);
      if (
        temp.height != t._itemSize.height ||
        temp.width != t._itemSize.width
      ) {
        t._customSize[n] = t._sizeType ? temp.height : temp.width;
      }
    }
    if (!Object.keys(t._customSize).length) t._customSize = null;
    if (temp.destroy) temp.destroy();
    temp.removeFromParent();

    return t._customSize;
  }
}
