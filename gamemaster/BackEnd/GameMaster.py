from dotenv import load_dotenv
import random
import cohere
import os
import json
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit

load_dotenv()

# Initialize Cohere API and Flask
cohere_api_key = os.getenv("COHERE_API_KEY")
co = cohere.Client(cohere_api_key)

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "secret!")
socketio = SocketIO(app, cors_allowed_origins="*")

# Game Variables
game_history = []
game_state = {
    "players": [],
    "enemies": [
        {"type": "Orc", "HP": 40, "position": "Hall"},
        {"type": "Goblin", "HP": 25, "position": "Corridor"},
    ],
    "map": {
        "Hall": {"description": "A large room with broken columns.", "items": [], "exits": ["Corridor"]},
        "Corridor": {"description": "A narrow hallway filled with cobwebs.", "items": ["Key"], "exits": ["Hall"]},
    },
}

# Function to communicate with Cohere API
def call_cohere(prompt):
    global game_history
    game_history.append(prompt)
    trim_history()

    full_prompt = "\n".join(game_history)
    try:
        response = co.generate(
            model="command",
            prompt=full_prompt,
            max_tokens=200,
            temperature=0.7,
            stop_sequences=["\n"],
        )
        return response.generations[0].text.strip()
    except cohere.error.CohereAPIError as e:
        return f"API error: {e.message}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"



def trim_history(max_length=10):
    """Ensure game history doesn't grow indefinitely."""
    global game_history
    if len(game_history) > max_length:
        game_history = game_history[-max_length:]


@socketio.on("connect")
def handle_connect():
    print("Client connected.")
    emit("gameState", game_state)  # Send the current game state to the new client


@socketio.on("joinGame")
def handle_join(data):
    """Handle player joining the game."""
    username = data.get("username")
    if username:
        new_player = {
            "name": username,
            "HP": 50,
            "mana": 30,
            "position": "Hall",
            "inventory": [],
        }
        game_state["players"].append(new_player)
        emit("playerJoined", new_player, broadcast=True)  # Notify all players about the new player
        emit("gameState", game_state)  # Send the updated game state


@socketio.on("playerAction")
def handle_action(data):
    """Handle player action."""
    action = data.get("action")
    player_name = data.get("player")
    target = data.get("target")

    player = next((p for p in game_state["players"] if p["name"] == player_name), None)
    if not player:
        emit("actionResult", {"error": "Player not found."})
        return

    # Handle the action based on the type
    narration = player_action(action, player, target)
    emit("actionResult", {"result": narration}, broadcast=True)  # Broadcast action result
    emit("gameState", game_state)  # Send updated game state


def player_action(action, player, target=None):
    """Handle game actions from the player."""
    if action == "attack" and target:
        enemy = next((e for e in game_state["enemies"] if e["type"] == target), None)
        if not enemy:
            return f"No enemy named {target} found."
        enemy["HP"] -= 10
        action_result = f"{player['name']} attacks {target} and deals 10 damage."
        game_history.append(action_result)
        if enemy["HP"] <= 0:
            game_state["enemies"].remove(enemy)
            action_result += f" The {target} is defeated!"
        return call_cohere(action_result)  # Call Cohere API to generate more narrative

    elif action == "explore":
        room_description = game_state["map"][player["position"]]["description"]
        action_result = f"{player['name']} explores the {player['position']}: {room_description}"
        game_history.append(action_result)
        return call_cohere(action_result)

    elif action == "move" and target:
        if target in game_state["map"][player["position"]]["exits"]:
            player["position"] = target
            action_result = f"{player['name']} moves to the {target}."
            game_history.append(action_result)
            return call_cohere(action_result)
        else:
            return "Invalid move. You can't go that way."

    return "Invalid action."


@socketio.on("enemyTurn")
def enemy_turn():
    """Simulate enemy actions."""
    for enemy in game_state["enemies"]:
        target = min(game_state["players"], key=lambda p: p["HP"])  # Attack the player with the least HP
        target["HP"] -= 5
        narration = f"The {enemy['type']} attacks {target['name']} for 5 damage!"
        game_history.append(narration)
        emit("actionResult", {"result": narration}, broadcast=True)  # Broadcast enemy action result

    emit("gameState", game_state)  # Send updated game state


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected.")


if __name__ == "__main__":
    socketio.run(app, debug=True)
