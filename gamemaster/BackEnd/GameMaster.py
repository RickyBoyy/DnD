from dotenv import load_dotenv
import random
import cohere
import os
import json
import sys

load_dotenv()

# Initialize Cohere API
cohere_api_key = os.getenv("COHERE_API_KEY")
co = cohere.Client(cohere_api_key)

# Game Variables
game_history = []
game_state = {
    "players": [{"name": "Elven Mage", "position": "Hall"}],
    "enemies": [
        {"type": "Orc", "HP": 40, "position": "Hall"},
        {"type": "Goblin", "HP": 25, "position": "Corridor"},
    ],
    "map": {
        "Hall": {"description": "A large room with broken columns.", "items": [], "exits": ["Corridor"]},
        "Corridor": {"description": "A narrow hallway filled with cobwebs.", "items": ["Key"], "exits": ["Hall"]},
    },
}
def add_player(player_name, position="Hall"):
    # Ensure the player is not already in the game
    if any(p["name"] == player_name for p in game_state["players"]):
        return {"error": f"Player {player_name} is already in the game."}

    # Add the new player to the game state
    game_state["players"].append({"name": player_name, "position": position})
    return {"game_state": game_state}

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

def process_input(data):
    global game_state

    action = data.get("action")
    player_name = data.get("player")
    current_state = data.get("game_state", game_state)  # Default to global game_state

    # Ensure "players" key exists in game_state
    if "players" not in current_state:
        return {"error": "Game state is missing 'players' key."}

    # Find the player
    player = next((p for p in current_state["players"] if p["name"] == player_name), None)
    if not player:
        return {"error": f"Player {player_name} not found."}

    # Process the user input
    action_result = player_action(action, player, current_state)
    return {"game_state": current_state, "result": action_result}



def player_action(action, player, target=None):
    """Handle game actions from the player."""
    action = action.lower()

    # Handle "attack"
    if action == "attack" and target:
        enemy = next((e for e in game_state["enemies"] if e["type"].lower() == target.lower()), None)
        if not enemy:
            action_result = f"No enemy named {target} found."
            game_history.append(action_result)  # Log action
            return call_cohere(action_result)

        # Update enemy health
        enemy["HP"] -= 10
        action_result = f"{player['name']} attacks {target} and deals 10 damage."
        if enemy["HP"] <= 0:
            game_state["enemies"].remove(enemy)
            action_result += f" The {target} is defeated!"

        game_history.append(action_result)  # Log action
        return call_cohere(action_result)

    # Handle "explore"
    elif action == "explore":
        room_description = game_state["map"][player["position"]]["description"]
        action_result = f"{player['name']} explores the {player['position']}: {room_description}"
        game_history.append(action_result)  # Log action
        return call_cohere(action_result)

    # Handle "move"
    elif action == "move" and target:
        if target in game_state["map"][player["position"]]["exits"]:
            player["position"] = target
            action_result = f"{player['name']} moves to the {target}."
            game_history.append(action_result)  # Log action
            return call_cohere(action_result)
        else:
            action_result = f"Invalid move. {target} is not accessible from {player['position']}."
            game_history.append(action_result)  # Log action
            return call_cohere(action_result)

    # Default case for invalid actions
    action_result = f"Invalid action: {action}."
    game_history.append(action_result)  # Log action
    return call_cohere(action_result)




def main():
    input_data = sys.stdin.read()  
    data = json.loads(input_data)  

    result = process_input(data)  
    sys.stdout.write(json.dumps(result) + "\n")  
    sys.stdout.flush()

if __name__ == "__main__":
    main()
