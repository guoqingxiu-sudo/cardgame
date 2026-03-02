extends Control

@onready var my_hp_label: Label = $UI/TopBar/MyHp
@onready var enemy_hp_label: Label = $UI/TopBar/EnemyHp
@onready var time_label: Label = $UI/TopBar/Time
@onready var ai_option: OptionButton = $UI/TopBar/AiDifficulty
@onready var my_res_label: Label = $UI/Resources/MyRes
@onready var enemy_res_label: Label = $UI/Resources/EnemyRes
@onready var lane_btns: Array[Button] = [
	$UI/BattleField/Lanes/Lane1 as Button,
	$UI/BattleField/Lanes/Lane2 as Button,
	$UI/BattleField/Lanes/Lane3 as Button
]
@onready var hand_scroll: ScrollContainer = $UI/Hand/HandScroll
@onready var hand_container: Control = get_node_or_null("UI/Hand/HandScroll/HandCards") as Control
@onready var selected_label: Label = $UI/Actions/SelectedLabel
@onready var log_label: RichTextLabel = $UI/Log
@onready var discard_btn: Button = $UI/Actions/DiscardBtn

var selected_hand_index: int = -1
var lane_track_layers: Array[Control] = []
var lane_projectile_layers: Array[Control] = []
var lane_float_layers: Array[Control] = []
var lane_unit_layers: Array[Control] = []
var lane_title_labels: Array[Label] = []
var lane_stats_labels: Array[Label] = []
var lane_track_labels: Array[Label] = []
var lane_projectile_nodes: Array[Dictionary] = []
var lane_prev_my_units: Array[int] = []
var lane_prev_enemy_units: Array[int] = []
var lane_prev_top_hit: Array[float] = []
var lane_prev_bottom_hit: Array[float] = []
var hand_buttons: Array[Button] = []
var hand_signature: String = ""
var hand_hover_index: int = -1
var hand_last_layout_width: float = -1.0
var hand_last_layout_selected: int = -2
var hand_last_layout_hover: int = -2
var lane_cloud_labels: Array[Label] = []
var ui_anim_time: float = 0.0
var drag_pending: bool = false
var drag_pending_index: int = -1
var drag_pending_button: Button = null
var drag_pressed_pos: Vector2 = Vector2.ZERO
var drag_grab_offset: Vector2 = Vector2.ZERO
var is_dragging: bool = false
var drag_card_index: int = -1
var drag_card_button: Button = null
var drag_hover_lane: int = -1
var drag_hover_discard: bool = false
var suppress_click_after_drag: bool = false
var drag_snap_strength: float = 0.35
var custom_art_by_card_id: Dictionary = {}
var custom_art_by_element: Dictionary = {}
var scaled_art_by_element: Dictionary = {}
var scaled_art_by_card_id: Dictionary = {}
const ELEMENT_ICON: Dictionary = {
	"wood": "🌿",
	"fire": "🔥",
	"earth": "🪨",
	"metal": "⚔",
	"water": "💧"
}

func _ready() -> void:
	if GameState.lane_last_play_my.size() != GameState.LANE_COUNT:
		GameState.reset_battle()
	if hand_container == null:
		push_error("Missing node: UI/Hand/HandScroll/HandCards")
		return
	hand_container.resized.connect(_on_hand_container_resized)
	hand_scroll.resized.connect(_on_hand_container_resized)
	_load_custom_card_art()
	_init_ai_option()
	_init_lane_visual_layers()
	for i in lane_btns.size():
		lane_btns[i].pressed.connect(_on_lane_pressed.bind(i))
	discard_btn.pressed.connect(_on_discard_pressed)
	$UI/Actions/RestartBtn.pressed.connect(_on_restart_pressed)
	refresh_ui()

func _process(delta: float) -> void:
	ui_anim_time += delta
	_animate_lane_decor()
	if is_dragging and drag_card_button != null:
		_update_drag_target(get_global_mouse_position())
	if GameState.running:
		GameState.tick(delta)
	refresh_ui()

func refresh_ui() -> void:
	my_hp_label.text = "My HP: %d" % GameState.my_hp
	enemy_hp_label.text = "Enemy HP: %d" % GameState.enemy_hp
	time_label.text = "Time: %.1fs" % GameState.game_time
	my_res_label.text = "My Res  W %.1f  F %.1f  E %.1f  M %.1f  Wa %.1f" % [
		GameState.my_resources["wood"], GameState.my_resources["fire"], GameState.my_resources["earth"],
		GameState.my_resources["metal"], GameState.my_resources["water"]
	]
	enemy_res_label.text = "Enemy Res  W %.1f  F %.1f  E %.1f  M %.1f  Wa %.1f" % [
		GameState.enemy_resources["wood"], GameState.enemy_resources["fire"], GameState.enemy_resources["earth"],
		GameState.enemy_resources["metal"], GameState.enemy_resources["water"]
	]

	for i in lane_btns.size():
		var snap: Dictionary = GameState.lane_snapshot(i)
		var my_eta: String = _format_eta(float(snap["my_next_eta"]))
		var enemy_eta: String = _format_eta(float(snap["enemy_next_eta"]))
		var my_track: String = _build_track(_to_float_array(snap["my_etas"]), true)
		var enemy_track: String = _build_track(_to_float_array(snap["enemy_etas"]), false)
		lane_title_labels[i].text = "Lane %d" % [i + 1]
		lane_stats_labels[i].text = "You U:%d Q:%d ETA:%s   Enemy U:%d Q:%d ETA:%s" % [
			int(snap["my_units"]), int(snap["my_queue"]), my_eta,
			int(snap["enemy_units"]), int(snap["enemy_queue"]), enemy_eta
		]
		lane_track_labels[i].text = "%s\n%s" % [my_track, enemy_track]
		_render_lane_visual(i)

	if is_dragging and drag_card_index >= 0 and drag_card_index < GameState.my_hand.size():
		var dcard: Dictionary = GameState.my_hand[drag_card_index]
		selected_label.text = _drag_preview_text(dcard, drag_hover_lane, drag_hover_discard)
	elif selected_hand_index >= 0 and selected_hand_index < GameState.my_hand.size():
		var c: Dictionary = GameState.my_hand[selected_hand_index]
		selected_label.text = "Selected: %s" % c.get("name", "Card")
	else:
		selected_label.text = "Selected: None"
		selected_hand_index = -1
	if is_dragging and drag_hover_discard:
		discard_btn.modulate = Color(1.15, 1.08, 0.82, 1.0)
	else:
		discard_btn.modulate = Color(1, 1, 1, 1)

	render_hand()
	render_logs()

func render_hand() -> void:
	if is_dragging:
		return
	var sig: String = _compute_hand_signature()
	if sig != hand_signature:
		_rebuild_hand_cards()
		hand_signature = sig
	var width_changed: bool = absf(hand_last_layout_width - hand_container.size.x) > 0.5
	var state_changed: bool = (hand_last_layout_selected != selected_hand_index) or (hand_last_layout_hover != hand_hover_index)
	if width_changed or state_changed:
		_layout_hand_cards(state_changed and not width_changed)
		hand_last_layout_width = hand_container.size.x
		hand_last_layout_selected = selected_hand_index
		hand_last_layout_hover = hand_hover_index

func render_logs() -> void:
	log_label.clear()
	for line in GameState.logs:
		log_label.append_text(line + "\n")

func _on_card_pressed(index: int) -> void:
	if suppress_click_after_drag:
		suppress_click_after_drag = false
		return
	if is_dragging:
		return
	if index < 0 or index >= GameState.my_hand.size():
		return
	var card: Dictionary = GameState.my_hand[index]
	if not GameState.card_needs_lane_target(card):
		var ret: Dictionary = GameState.play_card_from_hand(true, index, -1)
		if not bool(ret.get("ok", false)):
			GameState.push_log("Play failed: %s" % ret.get("msg", "unknown"))
		selected_hand_index = -1
		return
	if selected_hand_index == index:
		selected_hand_index = -1
	else:
		selected_hand_index = index
	_layout_hand_cards(true)

func _on_lane_pressed(lane: int) -> void:
	if is_dragging:
		return
	if selected_hand_index < 0:
		GameState.push_log("Select a lane-target card first.")
		return
	var ret: Dictionary = GameState.play_card_from_hand(true, selected_hand_index, lane)
	if not bool(ret.get("ok", false)):
		GameState.push_log("Play failed: %s" % ret.get("msg", "unknown"))
		return
	selected_hand_index = -1
	hand_hover_index = -1

func _on_discard_pressed() -> void:
	if is_dragging:
		return
	if selected_hand_index < 0:
		GameState.push_log("Select a hand card to discard.")
		return
	var ret: Dictionary = GameState.discard_card_from_hand(true, selected_hand_index)
	if not bool(ret.get("ok", false)):
		GameState.push_log("Discard failed: %s" % ret.get("msg", "unknown"))
		return
	selected_hand_index = -1
	hand_hover_index = -1
	hand_signature = ""

func _on_restart_pressed() -> void:
	_cancel_drag_restore_card()
	GameState.reset_battle()
	selected_hand_index = -1

func _init_ai_option() -> void:
	ai_option.clear()
	var order: Array[String] = ["easy", "normal", "hard", "nightmare"]
	for key in order:
		var p: Dictionary = GameState.AI_PROFILES.get(key, {})
		ai_option.add_item(String(p.get("label", key)))
	ai_option.selected = order.find(GameState.ai_difficulty)
	ai_option.item_selected.connect(_on_ai_selected)

func _on_ai_selected(index: int) -> void:
	var order: Array[String] = ["easy", "normal", "hard", "nightmare"]
	if index < 0 or index >= order.size():
		return
	GameState.set_ai_difficulty(order[index])

func _format_eta(v: float) -> String:
	if v < 0.0:
		return "-"
	return "%.1fs" % v

func _build_track(etas: Array[float], from_my: bool) -> String:
	var width: int = 16
	var cells: Array[String] = []
	for _i in width:
		cells.append("·")
	for i in etas.size():
		var eta: float = float(etas[i])
		var t: float = clampf(eta / 3.0, 0.0, 1.0)
		var pos: int = int(round((1.0 - t) * float(width - 1)))
		if not from_my:
			pos = int(round(t * float(width - 1)))
		cells[pos] = "◆"
	var lane_bar: String = ""
	for c in cells:
		lane_bar += c
	return ("You  " if from_my else "Enemy") + "[" + lane_bar + "]"

func _to_float_array(src: Variant) -> Array[float]:
	var out: Array[float] = []
	if src is Array:
		var arr: Array = src
		for i in arr.size():
			out.append(float(arr[i]))
	return out

func _init_lane_visual_layers() -> void:
	lane_track_layers.clear()
	lane_projectile_layers.clear()
	lane_float_layers.clear()
	lane_unit_layers.clear()
	lane_title_labels.clear()
	lane_stats_labels.clear()
	lane_track_labels.clear()
	lane_projectile_nodes.clear()
	lane_prev_my_units.clear()
	lane_prev_enemy_units.clear()
	lane_prev_top_hit.clear()
	lane_prev_bottom_hit.clear()
	lane_cloud_labels.clear()
	for i in lane_btns.size():
		var btn: Button = lane_btns[i]
		btn.text = ""
		var sky: ColorRect = ColorRect.new()
		sky.set_anchors_preset(Control.PRESET_FULL_RECT)
		sky.anchor_bottom = 0.62
		sky.color = Color(0.54, 0.75, 0.93, 0.34)
		sky.mouse_filter = Control.MOUSE_FILTER_IGNORE
		sky.z_index = 0
		btn.add_child(sky)
		var ground: ColorRect = ColorRect.new()
		ground.set_anchors_preset(Control.PRESET_FULL_RECT)
		ground.anchor_top = 0.62
		ground.color = Color(0.44, 0.76, 0.56, 0.30)
		ground.mouse_filter = Control.MOUSE_FILTER_IGNORE
		ground.z_index = 1
		btn.add_child(ground)
		var cloud: Label = Label.new()
		cloud.text = "☁   ☁"
		cloud.position = Vector2(10.0, 2.0)
		cloud.add_theme_font_size_override("font_size", 14)
		cloud.modulate = Color(1.0, 1.0, 1.0, 0.42)
		cloud.mouse_filter = Control.MOUSE_FILTER_IGNORE
		cloud.z_index = 2
		btn.add_child(cloud)
		lane_cloud_labels.append(cloud)
		var grass: Label = Label.new()
		grass.text = "✿ ✿ ✿"
		grass.add_theme_font_size_override("font_size", 11)
		grass.modulate = Color(0.9, 0.97, 0.86, 0.42)
		grass.mouse_filter = Control.MOUSE_FILTER_IGNORE
		grass.anchor_left = 0.0
		grass.anchor_top = 1.0
		grass.anchor_right = 0.0
		grass.anchor_bottom = 1.0
		grass.offset_left = 10.0
		grass.offset_top = -18.0
		grass.offset_right = 110.0
		grass.offset_bottom = -2.0
		grass.z_index = 2
		btn.add_child(grass)
		var info_box: VBoxContainer = VBoxContainer.new()
		info_box.name = "LaneInfo"
		info_box.set_anchors_preset(Control.PRESET_FULL_RECT)
		info_box.offset_left = 8.0
		info_box.offset_top = 6.0
		info_box.offset_right = -8.0
		info_box.offset_bottom = -6.0
		info_box.add_theme_constant_override("separation", 2)
		info_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
		info_box.z_index = 5
		btn.add_child(info_box)
		var title: Label = Label.new()
		title.text = "Lane %d" % [i + 1]
		title.add_theme_font_size_override("font_size", 13)
		title.mouse_filter = Control.MOUSE_FILTER_IGNORE
		info_box.add_child(title)
		var stats: Label = Label.new()
		stats.text = "You U:0 Q:0 ETA:-   Enemy U:0 Q:0 ETA:-"
		stats.add_theme_font_size_override("font_size", 11)
		stats.mouse_filter = Control.MOUSE_FILTER_IGNORE
		info_box.add_child(stats)
		var tracks: Label = Label.new()
		tracks.text = "You  [················]\nEnemy[················]"
		tracks.add_theme_font_size_override("font_size", 11)
		tracks.mouse_filter = Control.MOUSE_FILTER_IGNORE
		info_box.add_child(tracks)
		var unit_layer: Control = Control.new()
		unit_layer.name = "UnitLayer"
		unit_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
		unit_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
		unit_layer.z_index = 3
		btn.add_child(unit_layer)
		var track_layer: Control = Control.new()
		track_layer.name = "TrackLayer"
		track_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
		track_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
		track_layer.z_index = 4
		btn.add_child(track_layer)
		var projectile_layer: Control = Control.new()
		projectile_layer.name = "ProjectileLayer"
		projectile_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
		projectile_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
		track_layer.add_child(projectile_layer)
		var float_layer: Control = Control.new()
		float_layer.name = "FloatLayer"
		float_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
		float_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
		track_layer.add_child(float_layer)
		lane_title_labels.append(title)
		lane_stats_labels.append(stats)
		lane_track_labels.append(tracks)
		lane_unit_layers.append(unit_layer)
		lane_track_layers.append(track_layer)
		lane_projectile_layers.append(projectile_layer)
		lane_float_layers.append(float_layer)
		lane_projectile_nodes.append({})
		lane_prev_my_units.append(-1)
		lane_prev_enemy_units.append(-1)
		lane_prev_top_hit.append(0.0)
		lane_prev_bottom_hit.append(0.0)

func _compute_hand_signature() -> String:
	var parts: PackedStringArray = PackedStringArray()
	parts.append(str(GameState.my_hand.size()))
	for i in GameState.my_hand.size():
		var c: Dictionary = GameState.my_hand[i]
		parts.append(String(c.get("id", "card")))
		parts.append(String(c.get("name", "")))
	parts.append(str(selected_hand_index))
	return "|".join(parts)

func _rebuild_hand_cards() -> void:
	for child in hand_container.get_children():
		child.queue_free()
	hand_buttons.clear()
	for i in GameState.my_hand.size():
		var card: Dictionary = GameState.my_hand[i]
		var b: Button = Button.new()
		var needs_lane: bool = GameState.card_needs_lane_target(card)
		var cost_text: String = str(card.get("cost", {}))
		var element: String = String(card.get("element", "wood"))
		var icon: String = String(ELEMENT_ICON.get(element, "✦"))
		var type: String = String(card.get("type", "card"))
		var art: Texture2D = _get_card_art(card)
		b.text = "%s %s\n[%s] Cost: %s\n%s" % [
			icon,
			card.get("name", "Card"),
			type,
			cost_text,
			"Click then lane" if needs_lane else "Instant click"
		]
		if art != null:
			b.icon = art
		b.custom_minimum_size = Vector2(168, 96)
		b.size = Vector2(168, 96)
		b.tooltip_text = "ID: %s\nType: %s\nElement: %s\nPower: %s\nEffect: %s\nCost: %s" % [
			String(card.get("id", "-")),
			type,
			element,
			str(card.get("power", 0)),
			String(card.get("effect", "-")),
			cost_text
		]
		b.toggle_mode = true
		b.button_pressed = (i == selected_hand_index)
		b.pressed.connect(_on_card_pressed.bind(i))
		b.mouse_entered.connect(_on_hand_hovered.bind(i, true))
		b.mouse_exited.connect(_on_hand_hovered.bind(i, false))
		b.gui_input.connect(_on_hand_card_gui_input.bind(i, b))
		hand_container.add_child(b)
		hand_buttons.append(b)
	_layout_hand_cards(false)

func _load_custom_card_art() -> void:
	custom_art_by_card_id.clear()
	custom_art_by_element.clear()
	scaled_art_by_card_id.clear()
	scaled_art_by_element.clear()
	for i in CardDatabase.cards.size():
		var card: Dictionary = CardDatabase.cards[i]
		var cid: String = String(card.get("id", ""))
		var cname: String = String(card.get("name", ""))
		if cid == "":
			continue
		var base: String = "%s_%s" % [cid, _slug(cname)]
		var variants: Array[String] = [
			"res://res/%s.png" % base,
			"res://res/%s.png.png" % base
		]
		for v in variants:
			if not FileAccess.file_exists(v):
				continue
			var tex: Texture2D = load(v) as Texture2D
			if tex != null:
				custom_art_by_card_id[cid] = tex
				scaled_art_by_card_id[cid] = _make_card_icon_texture(tex, 56)
				break
	var fire_path: String = "res://res/fireattact.png"
	var wood_path: String = "res://res/woodattact.png"
	if FileAccess.file_exists(fire_path):
		var fire_tex: Texture2D = load(fire_path) as Texture2D
		if fire_tex != null:
			custom_art_by_element["fire"] = fire_tex
			scaled_art_by_element["fire"] = _make_card_icon_texture(fire_tex, 56)
	if FileAccess.file_exists(wood_path):
		var wood_tex: Texture2D = load(wood_path) as Texture2D
		if wood_tex != null:
			custom_art_by_element["wood"] = wood_tex
			scaled_art_by_element["wood"] = _make_card_icon_texture(wood_tex, 56)
	if custom_art_by_element.size() > 0:
		GameState.push_log("Loaded custom card art: %d" % custom_art_by_element.size())
	if custom_art_by_card_id.size() > 0:
		GameState.push_log("Loaded custom card art by id: %d" % custom_art_by_card_id.size())

func _get_card_art(card: Dictionary) -> Texture2D:
	var cid: String = String(card.get("id", ""))
	if scaled_art_by_card_id.has(cid):
		return scaled_art_by_card_id[cid] as Texture2D
	if custom_art_by_card_id.has(cid):
		return custom_art_by_card_id[cid] as Texture2D
	var element: String = String(card.get("element", ""))
	if scaled_art_by_element.has(element):
		return scaled_art_by_element[element] as Texture2D
	if custom_art_by_element.has(element):
		return custom_art_by_element[element] as Texture2D
	return null

func _make_card_icon_texture(src: Texture2D, icon_side: int) -> Texture2D:
	if src == null:
		return null
	var img: Image = src.get_image()
	if img == null:
		return src
	var w: int = img.get_width()
	var h: int = img.get_height()
	if w <= 0 or h <= 0:
		return src
	var crop_size: int = mini(w, h)
	var ox: int = maxi(0, int((w - crop_size) * 0.5))
	var oy: int = maxi(0, int((h - crop_size) * 0.5))
	var square: Image = img.get_region(Rect2i(ox, oy, crop_size, crop_size))
	var core_side: int = maxi(1, icon_side - 6)
	square.resize(core_side, core_side, Image.INTERPOLATE_LANCZOS)
	var out: Image = Image.create(icon_side, icon_side, false, Image.FORMAT_RGBA8)
	out.fill(Color(0, 0, 0, 0))
	var px: int = int((icon_side - core_side) * 0.5)
	var py: int = int((icon_side - core_side) * 0.5)
	for y in core_side:
		for x in core_side:
			var c: Color = square.get_pixel(x, y)
			if c.a <= 0.01:
				continue
			var sx: int = px + x + 2
			var sy: int = py + y + 2
			if sx >= 0 and sx < icon_side and sy >= 0 and sy < icon_side:
				var old_shadow: Color = out.get_pixel(sx, sy)
				var shadow_a: float = maxf(old_shadow.a, c.a * 0.35)
				out.set_pixel(sx, sy, Color(0.0, 0.0, 0.0, shadow_a))
	for y in core_side:
		for x in core_side:
			var c: Color = square.get_pixel(x, y)
			if c.a <= 0.03:
				continue
			var tx: int = px + x
			var ty: int = py + y
			for ny in range(-1, 2):
				for nx in range(-1, 2):
					if nx == 0 and ny == 0:
						continue
					var ex: int = tx + nx
					var ey: int = ty + ny
					if ex < 0 or ex >= icon_side or ey < 0 or ey >= icon_side:
						continue
					var cur: Color = out.get_pixel(ex, ey)
					if cur.a < 0.02:
						out.set_pixel(ex, ey, Color(1.0, 0.98, 0.9, c.a * 0.28))
			out.set_pixel(tx, ty, c)
	return ImageTexture.create_from_image(out)

func _slug(text: String) -> String:
	var s: String = text.strip_edges().to_lower()
	var out: String = ""
	for i in s.length():
		var ch: String = s[i]
		var code: int = s.unicode_at(i)
		var is_num: bool = code >= 48 and code <= 57
		var is_alpha: bool = code >= 97 and code <= 122
		if is_num or is_alpha:
			out += ch
		else:
			out += "_"
	while out.find("__") >= 0:
		out = out.replace("__", "_")
	return out.trim_prefix("_").trim_suffix("_")

func _layout_hand_cards(animated: bool) -> void:
	var n: int = hand_buttons.size()
	if n <= 0:
		hand_container.custom_minimum_size = Vector2(0, 112)
		return
	var card_w: float = 168.0
	var visible_w: float = maxf(240.0, hand_scroll.size.x - 16.0)
	var step: float = 122.0
	if n > 1:
		var fit_step: float = (visible_w - card_w) / float(n - 1)
		step = clampf(fit_step, 92.0, 128.0)
	var total_w: float = card_w + float(max(0, n - 1)) * step + 16.0
	hand_container.custom_minimum_size = Vector2(maxf(total_w, visible_w), 116.0)
	var center: float = float(n - 1) * 0.5
	for i in n:
		var b: Button = hand_buttons[i]
		var x: float = 8.0 + float(i) * step
		var y: float = 14.0
		if selected_hand_index >= 0:
			if i == selected_hand_index:
				y -= 19.0
			elif abs(i - selected_hand_index) == 1:
				x += (-9.0 if i < selected_hand_index else 9.0)
		elif i == hand_hover_index:
			y -= 10.0
		var target_scale: Vector2 = Vector2.ONE
		if i == selected_hand_index:
			target_scale = Vector2(1.06, 1.06)
		elif i == hand_hover_index:
			target_scale = Vector2(1.025, 1.025)
		var angle: float = (float(i) - center) * 1.6
		if i == selected_hand_index:
			angle = 0.0
		elif i == hand_hover_index:
			angle *= 0.45
		b.button_pressed = (i == selected_hand_index)
		b.z_index = i
		if i == selected_hand_index:
			b.z_index = 1000
		elif i == hand_hover_index:
			b.z_index = 500 + i
		if animated:
			var t: Tween = create_tween()
			t.set_parallel(true)
			t.tween_property(b, "position", Vector2(x, y), 0.12).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
			t.tween_property(b, "scale", target_scale, 0.12).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
			t.tween_property(b, "rotation_degrees", angle, 0.12).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
		else:
			b.position = Vector2(x, y)
			b.scale = target_scale
			b.rotation_degrees = angle

func _on_hand_hovered(index: int, hovering: bool) -> void:
	if is_dragging:
		return
	if hovering:
		hand_hover_index = index
	elif hand_hover_index == index:
		hand_hover_index = -1
	_layout_hand_cards(true)

func _on_hand_container_resized() -> void:
	if is_dragging:
		return
	_layout_hand_cards(false)

func _animate_lane_decor() -> void:
	for i in lane_cloud_labels.size():
		var cloud: Label = lane_cloud_labels[i]
		cloud.position.x = 10.0 + sin(ui_anim_time * 0.55 + float(i) * 1.3) * 8.0

func _on_hand_card_gui_input(event: InputEvent, index: int, card_btn: Button) -> void:
	if index < 0 or index >= GameState.my_hand.size():
		return
	if event is InputEventMouseButton:
		var mb: InputEventMouseButton = event
		if mb.button_index == MOUSE_BUTTON_LEFT and mb.pressed:
			drag_pending = true
			drag_pending_index = index
			drag_pending_button = card_btn
			drag_pressed_pos = mb.global_position
		elif mb.button_index == MOUSE_BUTTON_LEFT and not mb.pressed:
			if is_dragging and drag_card_index == index:
				_finish_drag(mb.global_position)
				get_viewport().set_input_as_handled()
			drag_pending = false
			drag_pending_index = -1
			drag_pending_button = null
	elif event is InputEventMouseMotion:
		var mm: InputEventMouseMotion = event
		if drag_pending and not is_dragging and drag_pending_index == index and drag_pending_button == card_btn:
			if mm.global_position.distance_to(drag_pressed_pos) > 8.0:
				_begin_drag(index, card_btn, mm.global_position)
		elif is_dragging and drag_card_index == index:
			_update_drag_target(mm.global_position)
			get_viewport().set_input_as_handled()

func _begin_drag(index: int, card_btn: Button, mouse_global: Vector2) -> void:
	is_dragging = true
	drag_card_index = index
	drag_card_button = card_btn
	drag_grab_offset = mouse_global - card_btn.global_position
	drag_hover_lane = -1
	selected_hand_index = index
	card_btn.reparent(self, true)
	card_btn.z_index = 3000
	_update_drag_target(mouse_global)

func _update_drag_target(mouse_global: Vector2) -> void:
	if drag_card_button == null:
		return
	var target_pos: Vector2 = mouse_global - drag_grab_offset
	drag_hover_lane = _lane_at_global_pos(mouse_global)
	drag_hover_discard = _is_over_discard(mouse_global)
	if drag_hover_discard:
		drag_hover_lane = -1
	if drag_hover_lane >= 0:
		var lane_btn: Button = lane_btns[drag_hover_lane]
		var lane_center: Vector2 = lane_btn.global_position + lane_btn.size * 0.5
		var snap_pos: Vector2 = lane_center - drag_card_button.size * 0.5
		target_pos = target_pos.lerp(snap_pos, drag_snap_strength)
	elif drag_hover_discard:
		var discard_center: Vector2 = discard_btn.global_position + discard_btn.size * 0.5
		var discard_snap: Vector2 = discard_center - drag_card_button.size * 0.5
		target_pos = target_pos.lerp(discard_snap, drag_snap_strength)
	drag_card_button.global_position = target_pos

func _finish_drag(mouse_global: Vector2) -> void:
	if drag_card_button == null:
		_clear_drag_flags()
		return
	var index: int = drag_card_index
	if index < 0 or index >= GameState.my_hand.size():
		drag_card_button.queue_free()
		_clear_drag_flags()
		hand_signature = ""
		return
	var card: Dictionary = GameState.my_hand[index]
	var played: bool = false
	if drag_hover_discard:
		var ret_discard: Dictionary = GameState.discard_card_from_hand(true, index)
		if bool(ret_discard.get("ok", false)):
			played = true
		else:
			GameState.push_log("Discard failed: %s" % ret_discard.get("msg", "unknown"))
	elif GameState.card_needs_lane_target(card):
		if drag_hover_lane >= 0:
			var ret_lane: Dictionary = GameState.play_card_from_hand(true, index, drag_hover_lane)
			if bool(ret_lane.get("ok", false)):
				played = true
			else:
				GameState.push_log("Play failed: %s" % ret_lane.get("msg", "unknown"))
	else:
		var hand_rect: Rect2 = Rect2(hand_scroll.global_position, hand_scroll.size)
		if not hand_rect.has_point(mouse_global):
			var ret_instant: Dictionary = GameState.play_card_from_hand(true, index, -1)
			if bool(ret_instant.get("ok", false)):
				played = true
			else:
				GameState.push_log("Play failed: %s" % ret_instant.get("msg", "unknown"))
	if played:
		suppress_click_after_drag = true
		drag_card_button.queue_free()
		selected_hand_index = -1
		hand_hover_index = -1
		hand_signature = ""
	else:
		drag_card_button.reparent(hand_container, true)
	_clear_drag_flags()
	_layout_hand_cards(true)

func _cancel_drag_restore_card() -> void:
	if not is_dragging:
		_clear_drag_flags()
		return
	if drag_card_button != null:
		drag_card_button.reparent(hand_container, true)
	_clear_drag_flags()
	_layout_hand_cards(false)

func _clear_drag_flags() -> void:
	drag_pending = false
	drag_pending_index = -1
	drag_pending_button = null
	is_dragging = false
	drag_card_index = -1
	drag_card_button = null
	drag_hover_lane = -1
	drag_hover_discard = false

func _lane_at_global_pos(pos: Vector2) -> int:
	var best_i: int = -1
	var best_d: float = 1e20
	for i in lane_btns.size():
		var btn: Button = lane_btns[i]
		var rect: Rect2 = Rect2(btn.global_position - Vector2(30.0, 22.0), btn.size + Vector2(60.0, 44.0))
		if rect.has_point(pos):
			return i
		var center: Vector2 = btn.global_position + btn.size * 0.5
		var d: float = pos.distance_to(center)
		if d < best_d:
			best_d = d
			best_i = i
	if best_d <= 145.0:
		return best_i
	return -1

func _is_over_discard(pos: Vector2) -> bool:
	var expand: Vector2 = Vector2(24.0, 18.0)
	var rect: Rect2 = Rect2(discard_btn.global_position - expand, discard_btn.size + expand * 2.0)
	return rect.has_point(pos)

func _drag_preview_text(card: Dictionary, lane: int, over_discard: bool) -> String:
	var name: String = String(card.get("name", "Card"))
	var effect: String = String(card.get("effect", ""))
	var ctype: String = String(card.get("type", ""))
	var power: int = int(card.get("power", 0))
	if over_discard:
		var cost: Dictionary = card.get("cost", {})
		var refunded: Array[String] = []
		for k in cost.keys():
			var v: float = float(cost[k]) * 0.55
			if v > 0.0:
				refunded.append("%s+%.1f" % [String(k), v])
		var refund_text: String = ", ".join(refunded)
		if refund_text == "":
			refund_text = "partial refund"
		return "Release on discard: %s (%s)" % [name, refund_text]
	if GameState.card_needs_lane_target(card):
		if lane < 0:
			return "Dragging: %s (drop on a lane)" % [name]
		var snap: Dictionary = GameState.lane_snapshot(lane)
		if ctype == "attack":
			var hit_unit: bool = int(snap.get("enemy_units", 0)) > 0
			return "Drop Lane %d: %s -> %s" % [lane + 1, name, "hit enemy unit" if hit_unit else ("-%d enemy HP" % max(1, power))]
		if effect == "summon_scout":
			return "Drop Lane %d: %s -> summon +1 ally unit" % [lane + 1, name]
		if effect == "slow":
			return "Drop Lane %d: %s -> delay enemy actions" % [lane + 1, name]
		return "Drop Lane %d: cast %s" % [lane + 1, name]
	return "Release outside hand: %s (instant)" % [name]

func _render_lane_visual(lane: int) -> void:
	if lane < 0 or lane >= lane_track_layers.size():
		return
	var track_layer: Control = lane_track_layers[lane]
	var projectile_layer: Control = lane_projectile_layers[lane]
	var float_layer: Control = lane_float_layers[lane]
	var unit_layer: Control = lane_unit_layers[lane]
	var vis: Dictionary = GameState.lane_visual(lane)
	_apply_lane_flash_tint(lane, float(vis.get("flash_my", 0.0)), float(vis.get("flash_enemy", 0.0)))
	_update_units(lane, unit_layer, int(vis["my_units"]), int(vis["enemy_units"]))
	var projectiles: Array = vis["projectiles"]
	_sync_projectiles(lane, projectile_layer, projectiles)
	var floats_arr: Array = vis.get("floats", [])
	for c in float_layer.get_children():
		c.queue_free()
	for i in floats_arr.size():
		var f: Dictionary = floats_arr[i]
		var txt: Label = Label.new()
		txt.text = String(f.get("text", ""))
		txt.add_theme_font_size_override("font_size", 12)
		txt.modulate = Color(1.0, 0.82, 0.82) if bool(f.get("on_my_side", false)) else Color(0.82, 1.0, 0.82)
		txt.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var life_t: float = clampf((GameState.game_time - float(f.get("spawn_at", GameState.game_time))) / 0.8, 0.0, 1.0)
		txt.modulate.a = 1.0 - life_t
		var fx: float = 12.0 + (track_layer.size.x - 24.0) * 0.5
		var base_y: float = track_layer.size.y - 28.0 if bool(f.get("on_my_side", false)) else 10.0
		txt.position = Vector2(fx, base_y - life_t * 18.0)
		float_layer.add_child(txt)

func _update_units(lane: int, layer: Control, my_units: int, enemy_units: int) -> void:
	if lane_prev_my_units[lane] == my_units and lane_prev_enemy_units[lane] == enemy_units:
		return
	for c in layer.get_children():
		c.queue_free()
	var grew_my: bool = my_units > lane_prev_my_units[lane]
	var grew_enemy: bool = enemy_units > lane_prev_enemy_units[lane]
	lane_prev_my_units[lane] = my_units
	lane_prev_enemy_units[lane] = enemy_units
	var w: float = maxf(20.0, layer.size.x - 18.0)
	for i in min(my_units, 8):
		var u: Label = Label.new()
		u.text = "🛡"
		u.add_theme_font_size_override("font_size", 14)
		u.modulate = Color(0.55, 1.0, 0.55)
		u.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var x: float = 9.0 + w * (float(i + 1) / float(min(my_units, 8) + 1))
		u.position = Vector2(x, layer.size.y - 24.0)
		if grew_my:
			u.scale = Vector2(0.45, 0.45)
			var t_u: Tween = create_tween()
			t_u.tween_property(u, "scale", Vector2.ONE, 0.16).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		layer.add_child(u)
	for i in min(enemy_units, 8):
		var e: Label = Label.new()
		e.text = "⚔"
		e.add_theme_font_size_override("font_size", 14)
		e.modulate = Color(1.0, 0.6, 0.6)
		e.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var x: float = 9.0 + w * (float(i + 1) / float(min(enemy_units, 8) + 1))
		e.position = Vector2(x, 6.0)
		if grew_enemy:
			e.scale = Vector2(0.45, 0.45)
			var t_e: Tween = create_tween()
			t_e.tween_property(e, "scale", Vector2.ONE, 0.16).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		layer.add_child(e)

func _sync_projectiles(lane: int, layer: Control, projectiles: Array) -> void:
	var node_map: Dictionary = lane_projectile_nodes[lane]
	var seen: Dictionary = {}
	var w: float = maxf(20.0, layer.size.x - 24.0)
	var h: float = maxf(20.0, layer.size.y - 24.0)
	for i in projectiles.size():
		var p: Dictionary = projectiles[i]
		var pid: int = int(p.get("id", -1))
		if pid < 0:
			pid = -10000 - i
		seen[pid] = true
		var dot: Label = null
		if node_map.has(pid):
			dot = node_map[pid] as Label
		if dot == null:
			dot = Label.new()
			var effect: String = String(p.get("effect", "attack"))
			dot.text = "●" if effect == "attack" else "◆"
			dot.add_theme_font_size_override("font_size", 14)
			dot.modulate = Color(0.6, 1.0, 0.6) if bool(p.get("from_my", false)) else Color(1.0, 0.6, 0.6)
			dot.mouse_filter = Control.MOUSE_FILTER_IGNORE
			dot.scale = Vector2(0.3, 0.3)
			layer.add_child(dot)
			var t_spawn: Tween = create_tween()
			t_spawn.tween_property(dot, "scale", Vector2.ONE, 0.14).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
			node_map[pid] = dot
		var t: float = float(p.get("progress", 0.0))
		var x: float = 12.0 + w * (t if bool(p.get("from_my", false)) else (1.0 - t))
		var y: float = 12.0 + h * 0.5
		dot.position = Vector2(x, y)
	var to_remove: Array = []
	for k in node_map.keys():
		if seen.has(k):
			continue
		to_remove.append(k)
	for i in to_remove.size():
		var key: Variant = to_remove[i]
		var old_dot: Label = node_map[key] as Label
		old_dot.queue_free()
		node_map.erase(key)
	lane_projectile_nodes[lane] = node_map

func _apply_lane_flash_tint(lane: int, flash_my: float, flash_enemy: float) -> void:
	if lane < 0 or lane >= lane_btns.size():
		return
	var btn: Button = lane_btns[lane]
	var base: Color = Color(1, 1, 1, 1)
	var top_hit: float = clampf(flash_enemy / 0.75, 0.0, 1.0)
	var bottom_hit: float = clampf(flash_my / 0.75, 0.0, 1.0)
	var r: float = 1.0 + top_hit * 0.25
	var g: float = 1.0 - top_hit * 0.12 - bottom_hit * 0.08
	var b: float = 1.0 + bottom_hit * 0.2
	if is_dragging and drag_hover_lane == lane:
		r += 0.07
		g += 0.05
		b += 0.04
	btn.modulate = Color(r, g, b, base.a)
	if top_hit > lane_prev_top_hit[lane] + 0.12 or bottom_hit > lane_prev_bottom_hit[lane] + 0.12:
		var hit_tween: Tween = create_tween()
		btn.scale = Vector2(1.0, 1.0)
		hit_tween.tween_property(btn, "scale", Vector2(1.015, 1.015), 0.07).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		hit_tween.tween_property(btn, "scale", Vector2.ONE, 0.11).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	lane_prev_top_hit[lane] = top_hit
	lane_prev_bottom_hit[lane] = bottom_hit
