extends Node

const ELEMENTS: Array[String] = ["wood", "fire", "earth", "metal", "water"]
const LANE_COUNT: int = 3
const AI_PROFILES: Dictionary = {
	"easy": {
		"label": "Easy",
		"think_interval": 1.15,
		"score_mul": 0.88,
		"urgency_bonus": 0.6
	},
	"normal": {
		"label": "Normal",
		"think_interval": 0.9,
		"score_mul": 1.0,
		"urgency_bonus": 1.0
	},
	"hard": {
		"label": "Hard",
		"think_interval": 0.68,
		"score_mul": 1.18,
		"urgency_bonus": 1.4
	},
	"nightmare": {
		"label": "Nightmare",
		"think_interval": 0.52,
		"score_mul": 1.35,
		"urgency_bonus": 1.8
	}
}

var my_hp: int = 100
var enemy_hp: int = 100
var game_time: float = 0.0
var running: bool = false
var ai_difficulty: String = "normal"
var draw_timer: float = 0.0
var draw_cooldown: float = 3.4
var enemy_think_timer: float = 0.0
var enemy_think_interval: float = 0.9

var my_resources: Dictionary = {
	"wood": 2.2,
	"fire": 2.2,
	"earth": 2.2,
	"metal": 2.2,
	"water": 2.2,
}

var enemy_resources: Dictionary = {
	"wood": 2.2,
	"fire": 2.2,
	"earth": 2.2,
	"metal": 2.2,
	"water": 2.2,
}

var my_deck: Array = []
var my_hand: Array = []
var my_discard: Array = []

var enemy_deck: Array = []
var enemy_hand: Array = []
var enemy_discard: Array = []
var lane_last_play_my: Array = []
var lane_last_play_enemy: Array = []
var lane_my_units: Array = []
var lane_enemy_units: Array = []
var lane_flash_my: Array = []
var lane_flash_enemy: Array = []
var lane_float_texts: Array = []
var action_queue: Array = []
var next_action_id: int = 1
var unit_tick_timer: float = 0.0
var unit_tick_cd: float = 1.6
var logs: Array[String] = []

func _ready() -> void:
	randomize()

func reset_battle() -> void:
	my_hp = 100
	enemy_hp = 100
	game_time = 0.0
	running = true
	draw_timer = 0.0
	enemy_think_timer = 0.0
	enemy_think_interval = float(AI_PROFILES.get(ai_difficulty, AI_PROFILES["normal"]).get("think_interval", 0.9))
	unit_tick_timer = 0.0
	my_resources = {
		"wood": 2.2, "fire": 2.2, "earth": 2.2, "metal": 2.2, "water": 2.2
	}
	enemy_resources = {
		"wood": 2.2, "fire": 2.2, "earth": 2.2, "metal": 2.2, "water": 2.2
	}
	my_deck = CardDatabase.make_default_deck()
	enemy_deck = CardDatabase.make_default_deck()
	my_hand.clear()
	enemy_hand.clear()
	my_discard.clear()
	enemy_discard.clear()
	lane_last_play_my = ["-", "-", "-"]
	lane_last_play_enemy = ["-", "-", "-"]
	lane_my_units = [0, 0, 0]
	lane_enemy_units = [0, 0, 0]
	lane_flash_my = [0.0, 0.0, 0.0]
	lane_flash_enemy = [0.0, 0.0, 0.0]
	lane_float_texts = [[], [], []]
	action_queue.clear()
	next_action_id = 1
	logs.clear()
	draw_cards(true, 5)
	draw_cards(false, 5)
	push_log("Battle reset. Draw 5 cards each. AI: %s" % get_ai_profile().get("label", "Normal"))

func _ensure_lane_buffers() -> void:
	if lane_last_play_my.size() == LANE_COUNT:
		return
	lane_last_play_my = ["-", "-", "-"]
	lane_last_play_enemy = ["-", "-", "-"]
	lane_my_units = [0, 0, 0]
	lane_enemy_units = [0, 0, 0]
	lane_flash_my = [0.0, 0.0, 0.0]
	lane_flash_enemy = [0.0, 0.0, 0.0]
	lane_float_texts = [[], [], []]

func tick(delta: float) -> void:
	if not running:
		return
	_ensure_lane_buffers()
	game_time += delta
	for lane in LANE_COUNT:
		lane_flash_my[lane] = max(0.0, float(lane_flash_my[lane]) - delta)
		lane_flash_enemy[lane] = max(0.0, float(lane_flash_enemy[lane]) - delta)
		var next_floats: Array = []
		var lane_floats: Array = lane_float_texts[lane]
		for i in lane_floats.size():
			var f: Dictionary = lane_floats[i]
			if float(f.get("expires_at", 0.0)) > game_time:
				next_floats.append(f)
		lane_float_texts[lane] = next_floats
	_process_action_queue()
	_process_units(delta)
	draw_timer += delta
	if draw_timer >= draw_cooldown:
		draw_timer = 0.0
		draw_cards(true, 1)
		draw_cards(false, 1)
	enemy_think_timer += delta
	if enemy_think_timer >= enemy_think_interval:
		enemy_think_timer = 0.0
		enemy_take_turn()

func get_ai_profile() -> Dictionary:
	return AI_PROFILES.get(ai_difficulty, AI_PROFILES["normal"])

func set_ai_difficulty(key: String) -> void:
	if not AI_PROFILES.has(key):
		return
	ai_difficulty = key
	enemy_think_interval = float(get_ai_profile().get("think_interval", 0.9))
	push_log("AI difficulty set to %s." % get_ai_profile().get("label", "Normal"))

func _process_action_queue() -> void:
	var remain: Array = []
	for i in action_queue.size():
		var act: Dictionary = action_queue[i]
		if float(act.get("due_at", 0.0)) > game_time:
			remain.append(act)
			continue
		_resolve_action(act)
	action_queue = remain

func _alloc_action_id() -> int:
	var id: int = next_action_id
	next_action_id += 1
	return id

func _process_units(delta: float) -> void:
	unit_tick_timer += delta
	if unit_tick_timer < unit_tick_cd:
		return
	unit_tick_timer = 0.0
	for lane in LANE_COUNT:
		var my_units: int = int(lane_my_units[lane])
		var enemy_units: int = int(lane_enemy_units[lane])
		if my_units > 0:
			var dmg_to_enemy: int = my_units
			enemy_hp = max(0, enemy_hp - dmg_to_enemy)
			_mark_lane_flash(lane, false, 0.45)
			_spawn_lane_float(lane, false, "-%d" % dmg_to_enemy)
			push_log("Your lane %d units chipped enemy for %d." % [lane + 1, dmg_to_enemy])
		if enemy_units > 0:
			var dmg_to_me: int = enemy_units
			my_hp = max(0, my_hp - dmg_to_me)
			_mark_lane_flash(lane, true, 0.45)
			_spawn_lane_float(lane, true, "-%d" % dmg_to_me)
			push_log("Enemy lane %d units chipped you for %d." % [lane + 1, dmg_to_me])
	if enemy_hp <= 0 or my_hp <= 0:
		running = false
		push_log("Battle ended.")

func _resolve_action(act: Dictionary) -> void:
	var from_my: bool = bool(act.get("from_my", true))
	var lane: int = int(act.get("lane", -1))
	var effect: String = String(act.get("effect", ""))
	var power: int = int(act.get("power", 0))
	var card_name: String = String(act.get("name", "Card"))
	if effect == "slow":
		var delayed: int = 0
		for i in action_queue.size():
			var q: Dictionary = action_queue[i]
			if bool(q.get("from_my", true)) == from_my:
				continue
			if int(q.get("lane", -1)) != lane:
				continue
			q["due_at"] = float(q.get("due_at", game_time)) + 0.8
			action_queue[i] = q
			delayed += 1
		push_log("%s slowed %d action(s) on lane %d." % [
			"You" if from_my else "Enemy",
			delayed,
			lane + 1
		])
		return
	if effect == "attack":
		if from_my:
			if lane_enemy_units[lane] > 0:
				lane_enemy_units[lane] = max(0, int(lane_enemy_units[lane]) - 1)
				_mark_lane_flash(lane, false, 0.65)
				_spawn_lane_float(lane, false, "-1U")
				push_log("%s hit enemy lane %d unit with %s." % ["You", lane + 1, card_name])
			else:
				enemy_hp = max(0, enemy_hp - power)
				_mark_lane_flash(lane, false, 0.75)
				_spawn_lane_float(lane, false, "-%d" % power)
				push_log("Your %s hit enemy hero for %d." % [card_name, power])
		else:
			if lane_my_units[lane] > 0:
				lane_my_units[lane] = max(0, int(lane_my_units[lane]) - 1)
				_mark_lane_flash(lane, true, 0.65)
				_spawn_lane_float(lane, true, "-1U")
				push_log("%s hit your lane %d unit with %s." % ["Enemy", lane + 1, card_name])
			else:
				my_hp = max(0, my_hp - power)
				_mark_lane_flash(lane, true, 0.75)
				_spawn_lane_float(lane, true, "-%d" % power)
				push_log("Enemy %s hit your hero for %d." % [card_name, power])
	if enemy_hp <= 0 or my_hp <= 0:
		running = false
		push_log("Battle ended.")

func draw_cards(is_my: bool, count: int) -> void:
	var deck: Array = my_deck if is_my else enemy_deck
	var hand: Array = my_hand if is_my else enemy_hand
	var discard: Array = my_discard if is_my else enemy_discard
	for _i in count:
		if hand.size() >= 7:
			return
		if deck.is_empty():
			if discard.is_empty():
				return
			deck.append_array(discard)
			discard.clear()
			deck.shuffle()
		hand.append(deck.pop_back())
	if is_my:
		push_log("You drew %d card(s)." % count)

func can_pay(is_my: bool, cost: Dictionary) -> bool:
	var pool: Dictionary = my_resources if is_my else enemy_resources
	for k in cost.keys():
		if pool.get(k, 0.0) < float(cost[k]):
			return false
	return true

func pay_cost(is_my: bool, cost: Dictionary) -> void:
	var pool: Dictionary = my_resources if is_my else enemy_resources
	for k in cost.keys():
		pool[k] = max(0.0, float(pool.get(k, 0.0)) - float(cost[k]))

func card_needs_lane_target(card: Dictionary) -> bool:
	var effect: String = String(card.get("effect", ""))
	if effect == "resource_card":
		return false
	if effect == "spell_spread_2" or effect == "spell_spread_3":
		return false
	return true

func push_log(text: String) -> void:
	logs.push_front("[%5.1fs] %s" % [game_time, text])
	if logs.size() > 14:
		logs.resize(14)

func _apply_resource_gain(is_my: bool, element: String, amount: float) -> void:
	var pool: Dictionary = my_resources if is_my else enemy_resources
	pool[element] = min(8.0, float(pool.get(element, 0.0)) + amount)

func _apply_lane_play(is_my: bool, lane: int, card_name: String) -> void:
	if lane < 0 or lane >= LANE_COUNT:
		return
	if is_my:
		lane_last_play_my[lane] = card_name
	else:
		lane_last_play_enemy[lane] = card_name

func _mark_lane_flash(lane: int, hit_my: bool, duration: float) -> void:
	if lane < 0 or lane >= LANE_COUNT:
		return
	if hit_my:
		lane_flash_my[lane] = max(float(lane_flash_my[lane]), duration)
	else:
		lane_flash_enemy[lane] = max(float(lane_flash_enemy[lane]), duration)

func _spawn_lane_float(lane: int, on_my_side: bool, text: String) -> void:
	if lane < 0 or lane >= LANE_COUNT:
		return
	lane_float_texts[lane].append({
		"text": text,
		"on_my_side": on_my_side,
		"spawn_at": game_time,
		"expires_at": game_time + 0.8
	})

func play_card_from_hand(is_my: bool, index: int, lane: int = -1) -> Dictionary:
	var hand: Array = my_hand if is_my else enemy_hand
	var discard: Array = my_discard if is_my else enemy_discard
	if index < 0 or index >= hand.size():
		return {"ok": false, "msg": "Invalid hand index."}
	var card: Dictionary = hand[index]
	if card_needs_lane_target(card) and (lane < 0 or lane >= LANE_COUNT):
		return {"ok": false, "msg": "This card needs lane target."}
	var cost: Dictionary = card.get("cost", {})
	if not can_pay(is_my, cost):
		return {"ok": false, "msg": "Not enough resources."}
	pay_cost(is_my, cost)
	var side: String = "You" if is_my else "Enemy"
	var effect: String = String(card.get("effect", ""))
	var power: int = int(card.get("power", 0))
	var element: String = String(card.get("element", "wood"))
	var lane_label: String = ""
	if lane >= 0:
		lane_label = " lane %d" % (lane + 1)

	if effect == "resource_card":
		var gain: float = float(card.get("effect_value", 3.0))
		_apply_resource_gain(is_my, element, gain)
		push_log("%s used %s: +%.1f %s resource." % [side, card.get("name", "Card"), gain, element])
	elif card.get("type", "") == "attack":
		var travel: float = float(card.get("base_delay", 2.0))
		action_queue.append({
			"id": _alloc_action_id(),
			"from_my": is_my,
			"lane": lane,
			"name": String(card.get("name", "Card")),
			"effect": "attack",
			"power": max(1, power),
			"launched_at": game_time,
			"travel_time": max(0.4, travel),
			"due_at": game_time + max(0.4, travel)
		})
		_apply_lane_play(is_my, lane, String(card.get("name", "Card")))
		push_log("%s cast %s%s. Arrival %.1fs." % [side, card.get("name", "Card"), lane_label, max(0.4, travel)])
	elif String(card.get("effect", "")) == "summon_scout":
		if is_my:
			lane_my_units[lane] = int(lane_my_units[lane]) + 1
		else:
			lane_enemy_units[lane] = int(lane_enemy_units[lane]) + 1
		_apply_lane_play(is_my, lane, String(card.get("name", "Card")))
		push_log("%s summoned %s%s." % [side, card.get("name", "Card"), lane_label])
	elif effect == "slow":
		var travel_slow: float = float(card.get("base_delay", 2.0))
		action_queue.append({
			"id": _alloc_action_id(),
			"from_my": is_my,
			"lane": lane,
			"name": String(card.get("name", "Card")),
			"effect": "slow",
			"power": 0,
			"launched_at": game_time,
			"travel_time": max(0.3, travel_slow),
			"due_at": game_time + max(0.3, travel_slow)
		})
		_apply_lane_play(is_my, lane, String(card.get("name", "Card")))
		push_log("%s cast %s%s. Debuff arrival %.1fs." % [side, card.get("name", "Card"), lane_label, max(0.3, travel_slow)])
	else:
		_apply_lane_play(is_my, lane, String(card.get("name", "Card")))
		push_log("%s used %s%s." % [side, card.get("name", "Card"), lane_label])

	discard.append(hand[index])
	hand.remove_at(index)
	if enemy_hp <= 0 or my_hp <= 0:
		running = false
		push_log("Battle ended.")
	return {"ok": true, "msg": "ok"}

func discard_card_from_hand(is_my: bool, index: int) -> Dictionary:
	var hand: Array = my_hand if is_my else enemy_hand
	var discard: Array = my_discard if is_my else enemy_discard
	if index < 0 or index >= hand.size():
		return {"ok": false, "msg": "Invalid hand index."}
	var card: Dictionary = hand[index]
	var cost: Dictionary = card.get("cost", {})
	var side: String = "You" if is_my else "Enemy"
	for k in cost.keys():
		_apply_resource_gain(is_my, String(k), float(cost[k]) * 0.55)
	discard.append(hand[index])
	hand.remove_at(index)
	push_log("%s discarded %s for partial refund." % [side, card.get("name", "Card")])
	return {"ok": true, "msg": "ok"}

func enemy_take_turn() -> void:
	if not running:
		return
	var playable: Array = []
	for i in enemy_hand.size():
		var card: Dictionary = enemy_hand[i]
		if can_pay(false, card.get("cost", {})):
			playable.append({"idx": i, "card": card})
	if playable.is_empty():
		if enemy_hand.size() > 0:
			discard_card_from_hand(false, 0)
		return
	var best_score: float = -999999.0
	var best_idx: int = -1
	var best_lane: int = -1
	for pi in playable.size():
		var entry: Dictionary = playable[pi]
		var i: int = int(entry["idx"])
		var card: Dictionary = entry["card"]
		if card_needs_lane_target(card):
			for lane in LANE_COUNT:
				var s: float = _score_enemy_play(card, lane)
				if s > best_score:
					best_score = s
					best_idx = i
					best_lane = lane
		else:
			var s0: float = _score_enemy_play(card, -1)
			if s0 > best_score:
				best_score = s0
				best_idx = i
				best_lane = -1
	if best_idx >= 0:
		play_card_from_hand(false, best_idx, best_lane)

func _score_enemy_play(card: Dictionary, lane: int) -> float:
	var t: String = String(card.get("type", ""))
	var effect: String = String(card.get("effect", ""))
	var power: float = float(card.get("power", 0))
	var profile: Dictionary = get_ai_profile()
	var score_mul: float = float(profile.get("score_mul", 1.0))
	var urgency_bonus: float = float(profile.get("urgency_bonus", 1.0))
	var score: float = 0.0
	var hp_lead: float = float(enemy_hp - my_hp)
	score += hp_lead * 0.05
	if t == "attack":
		score += 8.0 + power
		if lane >= 0:
			score += float(lane_enemy_units[lane]) * 0.8
			score -= float(lane_my_units[lane]) * 1.2
			score += _count_queue_on_lane(true, lane) * (0.7 * urgency_bonus)
	if effect == "resource_card":
		var element: String = String(card.get("element", "wood"))
		var now_res: float = float(enemy_resources.get(element, 0.0))
		score += 6.0 if now_res < 2.8 else 1.2
	if effect == "summon_scout":
		score += 5.5
		if lane >= 0:
			score += float(lane_enemy_units[lane]) * 0.6
			score -= float(lane_my_units[lane]) * 1.1
	if effect == "slow":
		if lane >= 0:
			score += float(_count_queue_on_lane(false, lane)) * (2.0 * urgency_bonus)
	return score * score_mul

func _count_queue_on_lane(from_my: bool, lane: int) -> int:
	var c: int = 0
	for i in action_queue.size():
		var q: Dictionary = action_queue[i]
		if bool(q.get("from_my", false)) == from_my and int(q.get("lane", -1)) == lane:
			c += 1
	return c

func count_queue_on_lane(from_my: bool, lane: int) -> int:
	return _count_queue_on_lane(from_my, lane)

func lane_snapshot(lane: int) -> Dictionary:
	_ensure_lane_buffers()
	if lane < 0 or lane >= LANE_COUNT:
		return {
			"my_last": "-",
			"enemy_last": "-",
			"my_units": 0,
			"enemy_units": 0,
			"my_queue": 0,
			"enemy_queue": 0,
			"my_next_eta": -1.0,
			"enemy_next_eta": -1.0,
			"my_etas": [],
			"enemy_etas": []
		}
	var my_next_eta: float = -1.0
	var enemy_next_eta: float = -1.0
	var my_etas: Array = []
	var enemy_etas: Array = []
	for i in action_queue.size():
		var q: Dictionary = action_queue[i]
		if int(q.get("lane", -1)) != lane:
			continue
		var eta: float = maxf(0.0, float(q.get("due_at", game_time)) - game_time)
		if bool(q.get("from_my", false)):
			my_etas.append(eta)
			if my_next_eta < 0.0 or eta < my_next_eta:
				my_next_eta = eta
		else:
			enemy_etas.append(eta)
			if enemy_next_eta < 0.0 or eta < enemy_next_eta:
				enemy_next_eta = eta
	my_etas.sort()
	enemy_etas.sort()
	return {
		"my_last": lane_last_play_my[lane],
		"enemy_last": lane_last_play_enemy[lane],
		"my_units": int(lane_my_units[lane]),
		"enemy_units": int(lane_enemy_units[lane]),
		"my_queue": _count_queue_on_lane(true, lane),
		"enemy_queue": _count_queue_on_lane(false, lane),
		"my_next_eta": my_next_eta,
		"enemy_next_eta": enemy_next_eta,
		"my_etas": my_etas.slice(0, 3),
		"enemy_etas": enemy_etas.slice(0, 3)
	}

func lane_visual(lane: int) -> Dictionary:
	_ensure_lane_buffers()
	if lane < 0 or lane >= LANE_COUNT:
		return {
			"my_units": 0,
			"enemy_units": 0,
			"projectiles": [],
			"flash_my": 0.0,
			"flash_enemy": 0.0,
			"floats": []
		}
	var projectiles: Array = []
	for i in action_queue.size():
		var q: Dictionary = action_queue[i]
		if int(q.get("lane", -1)) != lane:
			continue
		var launched: float = float(q.get("launched_at", game_time))
		var travel: float = maxf(0.1, float(q.get("travel_time", 1.0)))
		var t: float = clampf((game_time - launched) / travel, 0.0, 1.0)
		projectiles.append({
			"id": int(q.get("id", -1)),
			"from_my": bool(q.get("from_my", false)),
			"effect": String(q.get("effect", "attack")),
			"progress": t
		})
	return {
		"my_units": int(lane_my_units[lane]),
		"enemy_units": int(lane_enemy_units[lane]),
		"projectiles": projectiles,
		"flash_my": float(lane_flash_my[lane]),
		"flash_enemy": float(lane_flash_enemy[lane]),
		"floats": lane_float_texts[lane]
	}
