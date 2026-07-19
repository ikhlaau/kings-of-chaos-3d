"""Game engine: resource ticking, combat, spying, economy."""
import random
from datetime import datetime, timezone

from django.db import transaction

from .models import BattleLog

# ── Tuning constants ──────────────────────────────────────────────

TURN_REGEN_RATE = 1        # turns per period
TURN_REGEN_PERIOD = 120    # seconds (2 min)
GOLD_PER_CITIZEN = 5       # gold per tick per citizen
GOLD_TICK_PERIOD = 60      # seconds (1 min)

TRAIN_COSTS = {
    "attack_soldiers":  {"gold": 100, "turns": 1, "batch": 10},
    "defense_soldiers": {"gold": 100, "turns": 1, "batch": 10},
    "spies":            {"gold": 200, "turns": 2, "batch": 5},
    "sentries":         {"gold": 200, "turns": 2, "batch": 5},
}

WEAPON_BASE_COSTS = {
    "attack_weapon": 500,
    "defense_weapon": 500,
    "spy_tools": 800,
    "sentry_tools": 800,
}

CITIZEN_COST = 500  # gold per citizen

# ── Lazy-tick ──────────────────────────────────────────────────────


def tick_player(player):
    """Regenerate gold + turns since last tick. Returns player (saved)."""
    now = datetime.now(timezone.utc)
    updated = False

    # Turn regen
    elapsed_turn = (now - player.last_turn_regen).total_seconds()
    if elapsed_turn >= TURN_REGEN_PERIOD:
        gained = int(elapsed_turn // TURN_REGEN_PERIOD * TURN_REGEN_RATE)
        if gained > 0:
            player.turns = min(player.turns + gained, player.max_turns)
            player.last_turn_regen = now
            updated = True

    # Gold income
    elapsed_gold = (now - player.last_gold_tick).total_seconds()
    if elapsed_gold >= GOLD_TICK_PERIOD:
        gained = int(elapsed_gold // GOLD_TICK_PERIOD * player.citizens * GOLD_PER_CITIZEN)
        if gained > 0:
            player.gold += gained
            player.last_gold_tick = now
            updated = True

    if updated:
        player.save(update_fields=["turns", "gold", "last_turn_regen", "last_gold_tick"])

    return player


# ── Combat ─────────────────────────────────────────────────────────


def compute_battle(attacker, defender) -> dict:
    """Pure function: returns battle outcome dict."""
    atk_power = attacker.attack_soldiers * (1.0 + attacker.attack_weapon * 0.1)
    def_power = defender.defense_soldiers * (1.0 + defender.defense_weapon * 0.1)

    atk_roll = atk_power * random.uniform(0.85, 1.15)
    def_roll = def_power * random.uniform(0.85, 1.15)

    if atk_roll > def_roll:
        outcome = BattleLog.ATTACKER_WIN
        gold_stolen = int(defender.gold * random.uniform(0.10, 0.30))
        atk_loss_pct = random.uniform(0.03, 0.10)
        def_loss_pct = random.uniform(0.10, 0.30)
    else:
        outcome = BattleLog.DEFENDER_WIN
        gold_stolen = int(attacker.gold * random.uniform(0.05, 0.15))
        atk_loss_pct = random.uniform(0.10, 0.25)
        def_loss_pct = random.uniform(0.03, 0.08)

    atk_losses = {
        "attack_soldiers": max(1, int(attacker.attack_soldiers * atk_loss_pct)),
        "spies": max(1, int(attacker.spies * atk_loss_pct * 0.5)),
    }
    def_losses = {
        "defense_soldiers": max(1, int(defender.defense_soldiers * def_loss_pct)),
        "sentries": max(1, int(defender.sentries * def_loss_pct * 0.5)),
    }

    return {
        "outcome": outcome,
        "gold_stolen": gold_stolen,
        "attacker_losses": atk_losses,
        "defender_losses": def_losses,
    }


@transaction.atomic
def execute_attack(attacker, defender) -> dict:
    """Execute a battle: validate, compute, apply losses, log it."""
    if attacker.turns < 1:
        raise ValueError("Not enough turns")
    if attacker.id == defender.id:
        raise ValueError("Cannot attack yourself")

    result = compute_battle(attacker, defender)

    # Apply unit losses
    attacker.attack_soldiers = max(
        0, attacker.attack_soldiers - result["attacker_losses"]["attack_soldiers"]
    )
    attacker.spies = max(
        0, attacker.spies - result["attacker_losses"]["spies"]
    )
    defender.defense_soldiers = max(
        0, defender.defense_soldiers - result["defender_losses"]["defense_soldiers"]
    )
    defender.sentries = max(
        0, defender.sentries - result["defender_losses"]["sentries"]
    )

    # Gold transfer
    if result["outcome"] == BattleLog.ATTACKER_WIN:
        stolen = min(result["gold_stolen"], defender.gold)
        defender.gold -= stolen
        attacker.gold += stolen
        attacker.total_gold_stolen += stolen
    else:
        stolen = min(result["gold_stolen"], attacker.gold)
        attacker.gold -= stolen
        defender.gold += stolen

    attacker.turns -= 1
    attacker.total_kills += sum(result["defender_losses"].values())
    defender.total_kills += sum(result["attacker_losses"].values())

    attacker.save()
    defender.save()

    BattleLog.objects.create(
        attacker=attacker,
        defender=defender,
        outcome=result["outcome"],
        gold_stolen=stolen,
        attacker_losses=result["attacker_losses"],
        defender_losses=result["defender_losses"],
    )

    result["gold_stolen"] = stolen
    return result


# ── Spying ─────────────────────────────────────────────────────────


def spy_attempt(spy_player, target_player) -> dict:
    """Return {success: bool, data/captured}."""
    spy_power = spy_player.spies * (1.0 + spy_player.spy_tools * 0.1)
    sentry_power = target_player.sentries * (1.0 + target_player.sentry_tools * 0.1)

    total = spy_power + sentry_power
    success_chance = spy_power / total if total > 0 else 0.5
    success = random.random() < success_chance

    if success:
        return {
            "success": True,
            "data": {
                "gold": target_player.gold,
                "banked_gold": target_player.banked_gold,
                "attack_soldiers": target_player.attack_soldiers,
                "defense_soldiers": target_player.defense_soldiers,
                "spies": target_player.spies,
                "sentries": target_player.sentries,
                "attack_weapon": target_player.attack_weapon,
                "defense_weapon": target_player.defense_weapon,
                "battle_rank": target_player.battle_rank,
            },
        }
    else:
        captured = max(1, int(spy_player.spies * random.uniform(0.05, 0.15)))
        spy_player.spies = max(0, spy_player.spies - captured)
        spy_player.save()
        return {"success": False, "captured": captured}


# ── Helpers ────────────────────────────────────────────────────────


def player_to_dict(player) -> dict:
    """Serialize player state for JSON API."""
    return {
        "id": player.id,
        "username": player.username,
        "gold": player.gold,
        "banked_gold": player.banked_gold,
        "turns": player.turns,
        "max_turns": player.max_turns,
        "citizens": player.citizens,
        "attack_soldiers": player.attack_soldiers,
        "defense_soldiers": player.defense_soldiers,
        "spies": player.spies,
        "sentries": player.sentries,
        "attack_weapon": player.attack_weapon,
        "defense_weapon": player.defense_weapon,
        "spy_tools": player.spy_tools,
        "sentry_tools": player.sentry_tools,
        "battle_rank": player.battle_rank,
        "total_kills": player.total_kills,
        "total_gold_stolen": player.total_gold_stolen,
        "military_power": player.military_power,
        "world_x": player.world_x,
        "world_z": player.world_z,
        "alliance_id": player.alliance_id,
        "alliance_name": player.alliance.name if player.alliance else None,
        "alliance_tag": player.alliance.tag if player.alliance else None,
    }
