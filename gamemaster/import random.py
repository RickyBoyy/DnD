import random

# Modelo inicial do estado do jogo
game_state = {
    "players": [
        {"name": "Elven Mage", "HP": 50, "mana": 30, "position": "Hall", "inventory": ["Magic Staff"]},
        {"name": "Dwarf Warrior", "HP": 70, "mana": 10, "position": "Hall", "inventory": ["Axe"]},
    ],
    "enemies": [
        {"type": "Orc", "HP": 40, "position": "Hall"},
        {"type": "Goblin", "HP": 25, "position": "Corridor"},
    ],
    "map": {
        "Hall": {"description": "A large room with broken columns.", "items": [], "exits": ["Corridor"]},
        "Corridor": {"description": "A narrow hallway filled with cobwebs.", "items": ["Key"], "exits": ["Hall"]},
    },
}

# Função para gerar narrativas com base em ações
def generate_narration(action, target=None):
    if action == "attack":
        return f"The {target['type']} roars and defends itself against the attack!"
    elif action == "explore":
        return "The party searches the room carefully and finds hidden clues."
    elif action == "interact":
        return "You talk to the strange merchant, who offers you a mysterious potion."
    elif action == "move":
        return f"You move to the {target}."
    else:
        return "Nothing happens."

# Função para ações dos jogadores
def player_action(action, player, target=None):
    if action == "attack" and target:
        target["HP"] -= 10  
        return generate_narration("attack", target)
    elif action == "explore":
        current_position = player["position"]
        room_description = game_state["map"][current_position]["description"]
        return f"{room_description}\n" + generate_narration("explore")
    elif action == "move" and target:
        if target in game_state["map"][player["position"]]["exits"]:
            player["position"] = target
            return generate_narration("move", target)
        else:
            return "You can't move in that direction."
    return "Invalid action."

# Decisões dos inimigos com adversarial search
def enemy_decision(enemy, players):
    target = min(players, key=lambda p: p["HP"])  # Simplicacao: atacar o jogador mais fraco
    target["HP"] -= 5
    return f"The {enemy['type']} attacks {target['name']} for 5 damage!"

# Função para desenhar o estado do jogo
def display_game_state():
    print("\n--- Game State ---")
    print("Players:")
    for player in game_state["players"]:
        print(f" - {player['name']} | HP: {player['HP']} | Mana: {player['mana']} | Position: {player['position']}")

    print("Enemies:")
    for enemy in game_state["enemies"]:
        print(f" - {enemy['type']} | HP: {enemy['HP']} | Position: {enemy['position']}")

    print("\nMap:")
    for room, details in game_state["map"].items():
        print(f" - {room}: {details['description']}")
        if details["items"]:
            print(f"   Items: {', '.join(details['items'])}")

# Ciclo principal do jogo
def game_loop():
    while True:
        # Mostrar o estado do jogo
        display_game_state()

        # Turno dos jogadores
        for player in game_state["players"]:
            if player["HP"] <= 0:
                continue  # Jogador está fora do jogo
            print(f"\n{player['name']}'s Turn:")
            print("Actions: attack | explore | move")
            action = input("Choose an action: ").lower()
            target = None

            if action == "attack":
                # Escolher inimigo para atacar
                valid_enemies = [e for e in game_state["enemies"] if e["position"] == player["position"]]
                if not valid_enemies:
                    print("No enemies to attack here!")
                    continue
                print("Available targets:")
                for i, enemy in enumerate(valid_enemies):
                    print(f" {i + 1}. {enemy['type']} (HP: {enemy['HP']})")
                target_idx = int(input("Choose a target: ")) - 1
                target = valid_enemies[target_idx]

            if action == "move":
                # Escolher direção para mover
                exits = game_state["map"][player["position"]]["exits"]
                print(f"Exits: {', '.join(exits)}")
                target = input("Choose a direction: ")

            narration = player_action(action, player, target)
            print(narration)

        # Remover inimigos derrotados
        game_state["enemies"] = [e for e in game_state["enemies"] if e["HP"] > 0]

        # Turno dos inimigos
        for enemy in game_state["enemies"]:
            if enemy["HP"] <= 0:
                continue  # Inimigo está fora do jogo
            narration = enemy_decision(enemy, game_state["players"])
            print(narration)

        # Remover jogadores derrotados
        game_state["players"] = [p for p in game_state["players"] if p["HP"] > 0]

        # Verificar condições de vitória ou derrota
        if not game_state["players"]:
            print("Game Over! All players are defeated.")
            break
        if not game_state["enemies"]:
            print("Victory! All enemies are defeated.")
            break

# Iniciar o jogo
game_loop()
