"""Views: auth, 3D shell, JSON API."""
import json
import random

from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.db import models
from django.db.models import Q
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST, require_http_methods

from .forms import PlayerCreationForm
from .models import Player, Alliance, BattleLog
from .services import (
    tick_player, execute_attack, spy_attempt,
    TRAIN_COSTS, WEAPON_BASE_COSTS, CITIZEN_COST, player_to_dict,
)


# ═══════════════════════════════════════════════════════════════════
# Auth
# ═══════════════════════════════════════════════════════════════════

def register_view(request):
    if request.method == "POST":
        form = PlayerCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            user.world_x = random.uniform(-100, 100)
            user.world_z = random.uniform(-100, 100)
            user.save()
            login(request, user)
            return redirect("shell")
    else:
        form = PlayerCreationForm()
    return render(request, "game/auth/register.html", {"form": form})


def login_view(request):
    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            return redirect("shell")
    else:
        form = AuthenticationForm()
    return render(request, "game/auth/login.html", {"form": form})


def logout_view(request):
    logout(request)
    return redirect("login")


# ═══════════════════════════════════════════════════════════════════
# 3D Shell
# ═══════════════════════════════════════════════════════════════════

@login_required
def shell(request):
    player = tick_player(request.user)
    return render(request, "game/shell.html", {"player": player})


# ═══════════════════════════════════════════════════════════════════
# JSON API
# ═══════════════════════════════════════════════════════════════════

@login_required
def api_player_refresh(request):
    """GET — return fresh player state."""
    player = tick_player(request.user)
    return JsonResponse({"player": player_to_dict(player)})


@login_required
@require_POST
def api_attack(request):
    """POST {target_id} — attack another player."""
    attacker = tick_player(request.user)
    data = json.loads(request.body)
    defender = get_object_or_404(Player, id=data["target_id"])

    try:
        result = execute_attack(attacker, defender)
    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=400)

    attacker.refresh_from_db()
    return JsonResponse({
        "success": True,
        "result": {
            "outcome": result["outcome"],
            "gold_stolen": result["gold_stolen"],
            "attacker_losses": result["attacker_losses"],
            "defender_losses": result["defender_losses"],
        },
        "player": player_to_dict(attacker),
    })


@login_required
@require_POST
def api_train(request):
    """POST {unit_type} — train a batch of units."""
    player = tick_player(request.user)
    data = json.loads(request.body)
    unit_type = data["unit_type"]

    if unit_type not in TRAIN_COSTS:
        return JsonResponse({"error": f"Invalid unit type: {unit_type}"}, status=400)

    cost = TRAIN_COSTS[unit_type]
    if player.turns < cost["turns"]:
        return JsonResponse({"error": "Not enough turns"}, status=400)
    if player.gold < cost["gold"]:
        return JsonResponse({"error": "Not enough gold"}, status=400)

    player.turns -= cost["turns"]
    player.gold -= cost["gold"]
    setattr(player, unit_type, getattr(player, unit_type) + cost["batch"])
    player.save()

    return JsonResponse({
        "success": True,
        "trained": {unit_type: cost["batch"]},
        "player": player_to_dict(player),
    })


@login_required
@require_POST
def api_buy_weapon(request):
    """POST {weapon_type} — upgrade a weapon one level."""
    player = tick_player(request.user)
    data = json.loads(request.body)
    weapon_type = data["weapon_type"]

    if weapon_type not in WEAPON_BASE_COSTS:
        return JsonResponse({"error": f"Invalid weapon type: {weapon_type}"}, status=400)

    current = getattr(player, weapon_type)
    if current >= 20:
        return JsonResponse({"error": "Max level reached"}, status=400)

    cost = WEAPON_BASE_COSTS[weapon_type] * (current + 1) * (current + 1)
    if player.gold < cost:
        return JsonResponse({"error": "Not enough gold"}, status=400)

    player.gold -= cost
    setattr(player, weapon_type, current + 1)
    player.save()

    return JsonResponse({
        "success": True,
        "weapon_level": current + 1,
        "player": player_to_dict(player),
    })


@login_required
@require_POST
def api_spy(request):
    """POST {target_id} — spy on another player."""
    spy_player = tick_player(request.user)
    data = json.loads(request.body)
    target = get_object_or_404(Player, id=data["target_id"])

    if spy_player.turns < 1:
        return JsonResponse({"error": "Not enough turns"}, status=400)

    result = spy_attempt(spy_player, target)
    spy_player.turns -= 1
    spy_player.save()

    spy_player.refresh_from_db()
    return JsonResponse({
        "success": result["success"],
        **result,
        "player": player_to_dict(spy_player),
    })


@login_required
@require_POST
def api_bank(request):
    """POST {action: 'deposit'|'withdraw', amount: int}."""
    player = tick_player(request.user)
    data = json.loads(request.body)
    action = data["action"]
    amount = int(data["amount"])

    if amount <= 0:
        return JsonResponse({"error": "Amount must be positive"}, status=400)

    if action == "deposit":
        if player.gold < amount:
            return JsonResponse({"error": "Not enough gold"}, status=400)
        player.gold -= amount
        player.banked_gold += amount
    elif action == "withdraw":
        if player.banked_gold < amount:
            return JsonResponse({"error": "Not enough banked gold"}, status=400)
        player.banked_gold -= amount
        player.gold += amount
    else:
        return JsonResponse({"error": "Invalid action"}, status=400)

    player.save()
    return JsonResponse({"success": True, "player": player_to_dict(player)})


@login_required
@require_POST
def api_recruit_citizens(request):
    """POST {count: int} — recruit citizens (costs gold)."""
    player = tick_player(request.user)
    data = json.loads(request.body)
    count = int(data.get("count", 1))

    cost = count * CITIZEN_COST
    if player.gold < cost:
        return JsonResponse({"error": "Not enough gold"}, status=400)

    player.gold -= cost
    player.citizens += count
    player.save()

    return JsonResponse({"success": True, "player": player_to_dict(player)})


@login_required
def api_world_players(request):
    """GET — all players for world map."""
    tick_player(request.user)
    players = Player.objects.exclude(id=request.user.id).values(
        "id", "username", "world_x", "world_z",
        "battle_rank", "attack_soldiers", "defense_soldiers",
        "alliance_id", "alliance__name", "alliance__tag",
    )
    return JsonResponse({"players": list(players)})


@login_required
def api_battle_log(request):
    """GET — recent battles for the current player."""
    tick_player(request.user)
    logs = BattleLog.objects.filter(
        Q(attacker=request.user) | Q(defender=request.user)
    )[:30].select_related("attacker", "defender").values(
        "id", "attacker__username", "defender__username",
        "outcome", "gold_stolen", "attacker_losses", "defender_losses",
        "created_at",
    )
    return JsonResponse({"logs": list(logs)})


@login_required
def api_rankings(request):
    """GET ?page=1 — leaderboard."""
    tick_player(request.user)
    page = int(request.GET.get("page", 1))
    players = Player.objects.order_by("-battle_rank")[
        (page - 1) * 50 : page * 50
    ].values("id", "username", "battle_rank", "attack_soldiers",
              "defense_soldiers", "alliance__name", "alliance__tag")
    return JsonResponse({"rankings": list(players), "page": page})


@login_required
@require_http_methods(["GET", "POST"])
def api_alliance(request):
    """GET — alliance info. POST — create/join/leave."""
    player = tick_player(request.user)

    if request.method == "GET":
        if not player.alliance:
            # List all alliances
            alliances = Alliance.objects.annotate(
                member_count=models.Count("members")
            ).order_by("-member_count").values(
                "id", "name", "tag", "leader__username", "member_count"
            )
            return JsonResponse({"alliance": None, "alliances": list(alliances)})
        else:
            members = Player.objects.filter(alliance=player.alliance).values(
                "id", "username", "battle_rank"
            )
            return JsonResponse({
                "alliance": {
                    "id": player.alliance.id,
                    "name": player.alliance.name,
                    "tag": player.alliance.tag,
                    "leader": player.alliance.leader.username,
                },
                "members": list(members),
            })

    # POST
    data = json.loads(request.body)
    action = data.get("action")

    if action == "create":
        if player.alliance:
            return JsonResponse({"error": "Already in an alliance"}, status=400)
        if player.gold < 1000 or player.turns < 5:
            return JsonResponse({"error": "Not enough resources"}, status=400)

        alliance = Alliance.objects.create(
            name=data["name"], tag=data["tag"], leader=player
        )
        player.alliance = alliance
        player.gold -= 1000
        player.turns -= 5
        player.save()
        return JsonResponse({"success": True, "alliance_id": alliance.id})

    elif action == "join":
        alliance = get_object_or_404(Alliance, id=data["alliance_id"])
        if player.alliance:
            return JsonResponse({"error": "Already in an alliance"}, status=400)
        player.alliance = alliance
        player.save()
        return JsonResponse({"success": True})

    elif action == "leave":
        if not player.alliance:
            return JsonResponse({"error": "Not in an alliance"}, status=400)
        if player.alliance.leader == player:
            # Transfer leadership or disband
            other = player.alliance.members.exclude(id=player.id).first()
            if other:
                player.alliance.leader = other
                player.alliance.save()
            else:
                player.alliance.delete()
        player.alliance = None
        player.save()
        return JsonResponse({"success": True})

    return JsonResponse({"error": "Invalid action"}, status=400)
