"""django.tasks definitions — background work."""
from django.tasks import task
from django.db.models import F, Window
from django.db.models.functions import Rank

from .models import Player


@task(priority=5, queue_name="default")
def recalculate_all_ranks():
    """Recalculate battle_rank for all players using a window function."""
    ranked = Player.objects.annotate(
        computed_power=(
            F("attack_soldiers") * (1.0 + F("attack_weapon") * 0.1)
            + F("defense_soldiers") * (1.0 + F("defense_weapon") * 0.1)
            + F("spies") * (1.0 + F("spy_tools") * 0.1)
            + F("sentries") * (1.0 + F("sentry_tools") * 0.1)
        )
    ).annotate(
        new_rank=Window(expression=Rank(), order_by=F("computed_power").desc())
    )

    for p in ranked:
        Player.objects.filter(id=p.id).update(battle_rank=p.new_rank)

    return f"Ranks recalculated for {len(ranked)} players"
