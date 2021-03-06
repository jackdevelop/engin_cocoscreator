import { Round } from "./Round";
var _ = require("Underscore");

/**
 *  牌局中的每一个房间
 *  房间中的所有信息
 */
export class Room {
  public static className = "Room";
  public room_code: number;
  public game_id: number;
  public creator_uid;
  public room_category: number;
  public machine_id: string;
  public keep_machine_time: number;
  public num_of_players: number = 0;
  public config: any;
  private m_round: Round = null;
  public score = null;
  constructor(room_code: number, opts: any) {
    this.init(room_code, opts);
  }
  public init(room_code: number, opts: any) {
    if (!opts) {
      opts = opts;
    }
    this.room_code = room_code;
    this.game_id = opts.game_id;
    this.room_category = opts.room_category;
    this.creator_uid = opts.creator_uid;
    this.machine_id = opts.seat_id || opts.machine_id;
    this.keep_machine_time = opts.keep_machine_time;
    this.num_of_players = opts.num_of_players;
    this.config = opts["config" + this.game_id];
  }
  public init_round(game_id: number, round_data: any) {
    this.m_round = new Round(game_id, round_data);
    return this.m_round;
  }
  public get_round() {
    return this.m_round;
  }
  public init_score(score) {
    this.score = score;
  }
  public set_num_of_players(num_of_players: number) {
    this.num_of_players = num_of_players;
  }
  public game_quit_room(user_code: number) {
    let round = this.m_round;
    if (round) {
      round.banker_user_code_arr = _.without(
        round.banker_user_code_arr,
        user_code
      );
      round.ready_user_codes = _.without(round.ready_user_codes, user_code);
      round.continue_user_codes = _.without(
        round.continue_user_codes,
        user_code
      );
      let seat_id = round.get_room_sitdown_index(user_code);
      if (seat_id >= 0) {
        round.game_room_standup(seat_id);
        return seat_id;
      }
    }
    return null;
  }
  public get_room_type() {
    if (this.config) {
      return this.config.room_type;
    }
    return null;
  }
}
