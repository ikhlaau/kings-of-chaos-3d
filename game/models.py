from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Player(AbstractUser):
    # Resources
    gold = models.BigIntegerField(default=1000)
    banked_gold = models.BigIntegerField(default=0)
    turns = models.IntegerField(default=100)
    max_turns = models.IntegerField(default=200)
    citizens = models.IntegerField(default=10)

    # Military
    attack_soldiers = models.IntegerField(default=0)
    defense_soldiers = models.IntegerField(default=0)
    spies = models.IntegerField(default=10)
    sentries = models.IntegerField(default=0)

    # Weapons (0–20)
    attack_weapon = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(20)]
    )
    defense_weapon = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(20)]
    )
    spy_tools = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(20)]
    )
    sentry_tools = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(20)]
    )

    # Progression
    battle_rank = models.IntegerField(default=0)
    total_kills = models.BigIntegerField(default=0)
    total_gold_stolen = models.BigIntegerField(default=0)

    # Timers for lazy-tick
    last_turn_regen = models.DateTimeField(auto_now_add=True)
    last_gold_tick = models.DateTimeField(auto_now_add=True)

    # World map coordinates
    world_x = models.FloatField(default=0.0)
    world_z = models.FloatField(default=0.0)

    alliance = models.ForeignKey(
        "Alliance",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="members",
    )

    class Meta:
        indexes = [
            models.Index(fields=["battle_rank"]),
            models.Index(fields=["alliance"]),
        ]

    @property
    def military_power(self) -> float:
        return (
            self.attack_soldiers * (1.0 + self.attack_weapon * 0.1)
            + self.defense_soldiers * (1.0 + self.defense_weapon * 0.1)
            + self.spies * (1.0 + self.spy_tools * 0.1)
            + self.sentries * (1.0 + self.sentry_tools * 0.1)
        )

    @property
    def unprotected_gold(self) -> int:
        return self.gold

    @property
    def total_gold(self) -> int:
        return self.gold + self.banked_gold

    def __str__(self):
        return self.username


class Alliance(models.Model):
    name = models.CharField(max_length=64, unique=True)
    tag = models.CharField(max_length=8, unique=True)
    leader = models.OneToOneField(
        Player, on_delete=models.PROTECT, related_name="led_alliance"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.tag}] {self.name}"


class BattleLog(models.Model):
    ATTACKER_WIN = "ATK"
    DEFENDER_WIN = "DEF"
    OUTCOME_CHOICES = [
        (ATTACKER_WIN, "Attacker Win"),
        (DEFENDER_WIN, "Defender Win"),
    ]

    attacker = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name="attacks"
    )
    defender = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name="defenses"
    )
    outcome = models.CharField(max_length=3, choices=OUTCOME_CHOICES)
    gold_stolen = models.BigIntegerField(default=0)
    attacker_losses = models.JSONField(default=dict)
    defender_losses = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
