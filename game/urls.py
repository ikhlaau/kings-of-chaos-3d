from django.urls import path

from . import views

urlpatterns = [
    # Auth
    path("register/", views.register_view, name="register"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),

    # 3D Shell
    path("", views.shell, name="shell"),

    # API
    path("api/player/", views.api_player_refresh, name="api_player_refresh"),
    path("api/attack/", views.api_attack, name="api_attack"),
    path("api/train/", views.api_train, name="api_train"),
    path("api/buy-weapon/", views.api_buy_weapon, name="api_buy_weapon"),
    path("api/spy/", views.api_spy, name="api_spy"),
    path("api/bank/", views.api_bank, name="api_bank"),
    path("api/recruit/", views.api_recruit_citizens, name="api_recruit_citizens"),
    path("api/world/", views.api_world_players, name="api_world_players"),
    path("api/battle-log/", views.api_battle_log, name="api_battle_log"),
    path("api/rankings/", views.api_rankings, name="api_rankings"),
    path("api/alliance/", views.api_alliance, name="api_alliance"),
]
