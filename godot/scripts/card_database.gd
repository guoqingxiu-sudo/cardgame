extends Node

var cards: Array = []

func _ready() -> void:
	load_cards()

func load_cards() -> void:
	var file: FileAccess = FileAccess.open("res://data/cards.json", FileAccess.READ)
	if file == null:
		push_error("Cannot open cards.json")
		return
	var json_text: String = file.get_as_text()
	var parsed: Variant = JSON.parse_string(json_text)
	if typeof(parsed) != TYPE_ARRAY:
		push_error("cards.json must be an array")
		return
	cards = parsed

func get_card_by_id(card_id: String) -> Dictionary:
	for c in cards:
		if c.get("id", "") == card_id:
			return c.duplicate(true)
	return {}

func make_default_deck() -> Array:
	var deck: Array = []
	for c in cards:
		var copies: int = int(c.get("default_copies", 0))
		for _i in copies:
			deck.append(c.duplicate(true))
	deck.shuffle()
	return deck
