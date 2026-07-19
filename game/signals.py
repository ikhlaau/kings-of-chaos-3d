"""Signal handlers — trigger background tasks on model events."""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import BattleLog
from .tasks import recalculate_all_ranks


@receiver(post_save, sender=BattleLog)
def enqueue_rank_recalc(sender, instance, created, **kwargs):
    """After a battle is logged, enqueue a background rank recalculation."""
    if created:
        recalculate_all_ranks.enqueue()
