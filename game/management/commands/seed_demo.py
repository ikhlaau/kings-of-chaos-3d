"""Seed demo players for testing."""
import random

from django.core.management.base import BaseCommand

from game.models import Player


class Command(BaseCommand):
    help = "Create demo players with varied stats for testing."

    def add_arguments(self, parser):
        parser.add_argument("--players", type=int, default=50, help="Number of demo players")

    def handle(self, *args, **options):
        count = options["players"]
        existing = set(Player.objects.values_list("username", flat=True))

        to_create = []
        for i in range(count):
            username = f"player_{i + 1}"
            if username in existing:
                continue

            to_create.append(Player(
                username=username,
                gold=random.randint(500, 5000),
                banked_gold=random.randint(0, 2000),
                turns=random.randint(10, 200),
                citizens=random.randint(5, 50),
                attack_soldiers=random.randint(0, 200),
                defense_soldiers=random.randint(0, 200),
                spies=random.randint(5, 50),
                sentries=random.randint(0, 30),
                attack_weapon=random.randint(0, 10),
                defense_weapon=random.randint(0, 10),
                spy_tools=random.randint(0, 5),
                sentry_tools=random.randint(0, 5),
                world_x=random.uniform(-100, 100),
                world_z=random.uniform(-100, 100),
            ))

        if to_create:
            Player.objects.bulk_create(to_create)
            self.stdout.write(self.style.SUCCESS(f"Created {len(to_create)} demo players."))
        else:
            self.stdout.write("No new players to create.")
