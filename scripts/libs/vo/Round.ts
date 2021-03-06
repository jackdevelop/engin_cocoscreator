import { UserList } from "./UserList";
var _ = require("Underscore");

/**
 *  每一份牌局信息
 */
export class Round {
  private game_id: number = null;
  public seat_user_codes = [];
  public ready_user_codes = [];
  public continue_user_codes = [];
  public user_cards = null;
  public user_cards_show = new Object();
  public actions = [];
  public banker_user_code_arr = [];
  public banker_user_code = null;
  private states: any = null;
  public round_id: number = null;
  public state: number = null;
  public timeout: number = null;
  public timestamp: number = null;
  public temp_json = new Object();
  public temp_arr = [];
  public bet_area_amount: Array<number> = [0, 0, 0, 0];
  public user_area_amount: Array<number> = [0, 0, 0, 0];
  private award: number = null;
  public guns: Array = [];
  public map_id = null;
  public card_wall = null;
  public laizi_card = null;
  public pizi_card = null;
  public first_card = null;
  public turn_user_code = null;
  constructor(game_id: number, opts: any) {
    this.init(game_id, opts);
  }
  private init(game_id: number, opts: any) {
    let self = this;
    if (!opts) {
      opts = opts;
    }
    this.game_id = game_id;
    let seat_user_codes = opts.seat_user_codes;
    let users = opts.users;
    _.forEach(users, function (v, k) {
      UserList.setUser(v.user_code, v);
    });
    _.forEach(seat_user_codes, function (v, k) {
      self.game_room_sitdown(k, v);
    });
    this.continue_user_codes = opts.continue_user_codes;
    this.banker_user_code = opts.banker_user_code;
    this.ready_user_codes = opts.ready_user_codes || [];
    this.continue_user_codes = opts.continue_user_codes || [];
    this.actions = opts.actions || [];
    this.user_cards = opts.user_cards;
  }
  public init_wait() {
    this.user_cards = null;
    this.pizi_card = null;
    this.first_card = null;
    this.laizi_card = null;
    this.card_wall = null;
    this.continue_user_codes = [];
    this.actions = [];
    this.temp_json = new Object();
    this.temp_arr = [];
    this.turn_user_code = null;
  }
  public game_room_sitdown(seat_id: number, user_code) {
    this.seat_user_codes[seat_id] = user_code;
  }
  public game_room_standup(seat_id: number) {
    this.seat_user_codes[seat_id] = 0;
  }
  public get_room_sitdown_index(user_code) {
    return _.indexOf(this.seat_user_codes, user_code);
  }
  public get_room_sitdown_index_By_client(user_code, me_user_code) {
    var self = this;
    var pos = this.get_room_sitdown_index(user_code);
    var mypos = this.get_room_sitdown_index(me_user_code);
    if (pos < 0) {
      console.error(
        "错误：当前用户不在座位上,当前 user_code ：" +
          user_code +
          ",seat_uids:" +
          this.seat_user_codes
      );
      return pos;
    }
    if (mypos >= 0) {
      var markPos = pos - mypos;
      if (markPos < 0) {
        let max_seat = 4;
        markPos = markPos + max_seat;
      }
      cc.log(
        "uid:" + user_code,
        "meUid:" + me_user_code,
        "mypos:" + mypos,
        "pos:" + pos,
        "markPos:" + markPos,
        this.seat_user_codes
      );
      return markPos;
    } else {
      cc.log("pos - 1:", pos - 1);
      return pos;
    }
  }
  public server_game_state_change(states: any) {
    if (!states) {
      return;
    }
    states = states || new Object();
    this.states = states;
    this.round_id = states.round_id;
    this.state = states.state;
    this.timeout = states.timeout;
    this.timestamp = states.timestamp;
  }
  public setAward(states) {
    if (!states) {
      return;
    }
    let self = this;
    this.award = states.award;
    if (this.award) {
      let bets = [];
      _.forEach(this.award.bet_area, function (v, k) {
        let area_id = v.area_id - 1;
        bets[area_id] = v.bet;
      });
      this.set_bet_area_amount(bets);
    }
  }
  public set_banker_user_code(banker_user_code) {
    this.banker_user_code = banker_user_code;
  }
  public set_banker(banker_user_code, banker) {
    if (banker) {
      UserList.setUser(banker.user_code, banker);
      banker_user_code = banker_user_code || banker.user_code;
      this.set_banker_user_code(banker_user_code);
    }
  }
  public set_bet_area_amount(bets: Array<number>) {
    this.bet_area_amount = bets;
  }
  public set_user_area_amount(bets: Array<number>) {
    this.user_area_amount = bets;
  }
  public set_turn_user_code(turn_user_code) {
    this.turn_user_code = turn_user_code;
  }
  public get_turn_user_code() {
    return this.turn_user_code;
  }
  public set_game_gun(user_code, one_gun) {
    if (one_gun) {
      let idx = _.findLastIndex(this.guns, { user_code: user_code });
      if (idx >= 0) {
        this.guns[idx] = one_gun;
      } else {
        this.guns.push(one_gun);
      }
    } else {
      var evens = _.filter(this.guns, function (one) {
        return one.user_code != user_code;
      });
      this.guns = evens;
    }
  }
  public get_game_gun(user_code) {
    let one = _.findWhere(this.guns, { user_code: user_code });
    return one;
  }
  public get_user_cards_by_user_code(user_code) {
    let user_cards = this.user_cards;
    let find = _.findWhere(user_cards, { user_code: user_code });
    return find;
  }
  public add_action(action) {
    var action_idx = action.action_idx;
    var actions = this.actions;
    if (actions.length == action_idx - 1) {
      this.actions.push(action);
      return action;
    } else {
      console.error(
        "当前的索引不对，客户端记录的 action_index： " +
          this.actions.length +
          ",服务器返回的 action_index： " +
          action_idx
      );
    }
    return null;
  }
  public add_showcard(action, is_not_add) {
    let cards = action.cards;
    let user_code = action.user_code;
    let action_type = action.action_type;
    let self = this;
    if (this.user_cards_show == null) {
      this.user_cards_show = new Object();
    }
    if (this.user_cards_show[user_code] == null) {
      this.user_cards_show[user_code] = [];
    }
    _.forEach(cards, function (v, k) {
      if (is_not_add) {
        self.user_cards_show[user_code].push(0);
      } else {
        self.user_cards_show[user_code].push(v);
      }
    });
  }
}
