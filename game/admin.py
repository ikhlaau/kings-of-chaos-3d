from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Player, Alliance, BattleLog


@admin.register(Player)
class PlayerAdmin(UserAdmin):
    list_display = ["username", "gold", "turns", "battle_rank", "alliance", "is_staff"]
    list_filter = ["alliance", "is_staff"]
    fieldsets = UserAdmin.fieldsets + (
        ("Game Stats", {
            "fields": (
                "gold", "banked_gold", "turns", "max_turns", "citizens",
                "attack_soldiers", "defense_soldiers", "spies", "sentries",
                "attack_weapon", "defense_weapon", "spy_tools", "sentry_tools",
                "battle_rank", "total_kills", "total_gold_stolen",
                "world_x", "world_z", "alliance",
            )
        }),
    )


@admin.register(Alliance)
class AllianceAdmin(admin.ModelAdmin):
    list_display = ["name", "tag", "leader", "created_at"]


@admin.register(BattleLog)
class BattleLogAdmin(admin.ModelAdmin):
    list_display = ["attacker", "defender", "outcome", "gold_stolen", "created_at"]
    list_filter = ["outcome"]
