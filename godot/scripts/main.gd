extends Control

@onready var battle_root: Control = $BattleRoot

func _ready() -> void:
	GameState.reset_battle()
	battle_root.refresh_ui()
