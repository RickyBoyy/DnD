from dotenv import load_dotenv
import random
import groq
import os
import json
import sys
import re
from ai_request import LanguageModel

from flask import Flask, request, jsonify

app = Flask(__name__)

load_dotenv()

# Initialize Cohere API
groq_api_key = os.getenv("GROQ_API_KEY")  # Ensure the correct environment variable name
groq_client = groq.Client(api_key=groq_api_key)

visited_locations = set()

# Game Variables
game_history = []
game_state = {
    "players": [],
    "enemies": [],
    "map": {},
}
language_model = LanguageModel()

game_history = []

def call_groq(prompt):
    global game_history
    game_history.append(prompt)

    full_prompt = (
        "You are a Dungeon Master. The story so far is as follows:\n"
        + "\n".join(game_history)
        + "\n\n"
        + "Now continue the story based on the player's latest action."
    )

    response = language_model.generate_response(full_prompt)

    if response:
        first_paragraph = response.strip().split("\n\n")[0]
        sentences = first_paragraph.split('. ')
        limited_response = '. '.join(sentences[:5]).strip()  
        if not limited_response.endswith('.'):
            limited_response += '.' 
        return limited_response
    else:
        return "Error: Unable to generate response."

    
def add_location_to_history(location):
    """Track visited locations to ensure variety in descriptions."""
    if location not in visited_locations:
        visited_locations.add(location)
    else:
        print("You've already been here. The scene looks the same.")

def roll_dice(dice: str):
    """Rolls a dice in the format 'd20', '2d6', etc."""
    try:
        count, sides = map(int, dice.split('d'))
        return sum(random.randint(1, sides) for _ in range(count))
    except ValueError:
        raise ValueError("Invalid dice format.")

# Combat System
def prune_game_history():
    """Limit the size of the game history to avoid excessive repetition."""
    global game_history
    max_history = 10  
    if len(game_history) > max_history:
        game_history = game_history[-max_history:]


def initiate_combat_with_prompt(player, enemies):
    """DnD-style turn-based combat with AI-interpreted prompts."""
    print("\nCombat initiated!")
    while player["health"] > 0 and any(enemy["health"] > 0 for enemy in enemies):
        print(f"\n{player['name']}, your turn! Describe your action:")
        action = input().strip()

        if "check health" in action.lower():
            check_health(player)
            continue 

        if "run" in action.lower():
            result = handle_run(action, player, enemies)
            if result == "escape_successful":
                return "escape_successful"

        response = interpret_action(action, player, enemies)
        print(f"\n{response}")

        for enemy in enemies:
            if enemy["health"] > 0:
                print(f"\nThe {enemy['type']} prepares to counterattack!")
                enemy_action = enemy_attack(enemy, player)
                print(enemy_action)

                if player["health"] <= 0:
                    print(f"{player['name']} has been defeated!")
                    return "player_defeated"

        if all(enemy["health"] <= 0 for enemy in enemies):
            print("All enemies have been defeated!")
            return "victory"

    return "ongoing"

def enemy_attack(enemy, player):
    """Determine enemy's attack based on type and combat situation."""
    attack_choice = random.choice(["fire_breath", "claw_strike", "pierce", "ambush"])

    if attack_choice == "fire_breath" and enemy["type"] == "Dragon":
        damage = random.randint(20, 40)
        print(f"The {enemy['type']} breathes fire, scorching {player['name']}!")
    elif attack_choice == "claw_strike":
        damage = random.randint(10, 20)
        print(f"The {enemy['type']} strikes with its claws!")
    elif attack_choice == "pierce" and enemy["type"] == "Goblin":
        damage = random.randint(5, 15)
        print(f"The {enemy['type']} pierces you with its poisoned dagger!")
    else:  # ambush or random attack
        damage = random.randint(8, 18)
        print(f"The {enemy['type']} attempts a surprise attack!")

    player["health"] -= damage
    return f"The attack dealt {damage} damage! {player['name']} now has {player['health']} health."


def interpret_action(action, player, enemies):
    """
    AI interprets the player's free-form action and generates a response.
    """
    target_enemy = enemies[0]  # Default to the first enemy
    if any(enemy["type"].lower() in action for enemy in enemies):
        for enemy in enemies:
            if enemy["type"].lower() in action and enemy["health"] > 0:
                target_enemy = enemy
                break
    
    roll_result = attack_roll(player, target_enemy)
    if roll_result["hit"]:
        damage = calculate_damage(player)
        target_enemy["health"] -= damage
        response = (
            f"You successfully {action}. The {target_enemy['type']} takes {damage} damage and now has "
            f"{target_enemy['health']} health."
        )
    else:
        response = f"You attempt to {action}, but it misses!"
    return response

def trim_repetition(response, previous_responses):
    """Remove repeated sentences from the AI's response."""
    sentences = response.split(". ")
    unique_sentences = []
    seen_sentences = set(previous_responses)

    for sentence in sentences:
        if sentence not in seen_sentences:
            unique_sentences.append(sentence)
            seen_sentences.add(sentence)

    return ". ".join(unique_sentences).strip() + "."

def check_health(player):
    """Allow the player to check their current health."""
    print(f"{player['name']}, you currently have {player['health']} health remaining.")

def roll_dexterity_check(player, enemies):
    """Roll for the player's dexterity against the enemy's dexterity to determine if they can escape."""
    player_roll = roll_dice("1d20") + player["attributes"]["DEX"]
    enemy_roll = roll_dice("1d20") + enemies[0]["attributes"]["DEX"]
    
    # Player succeeds if their roll is higher than the enemy's roll
    return player_roll > enemy_roll


def create_enemy(position, game_state):
    """Create a new enemy based on the player's current position and game state."""
    
    enemy_types = ['Goblin', 'Orc', 'Troll', 'Dragon']
    enemy_type = random.choice(enemy_types)
    
    
    if enemy_type == 'Goblin':
        hp = random.randint(10, 30)
    elif enemy_type == 'Orc':
        hp = random.randint(30, 60)
    elif enemy_type == 'Troll':
        hp = random.randint(60, 100)
    elif enemy_type == 'Dragon':
        hp = random.randint(100, 200)
    
    # Set the attributes for the enemy
    attributes = {
        'STR': random.randint(8, 15),
        'DEX': random.randint(8, 15),
        'CON': random.randint(8, 15),
        'INT': random.randint(8, 15),
        'WIS': random.randint(8, 15),
        'CHA': random.randint(8, 15)
    }
    
    
    enemy = {
        'type': enemy_type,
        'health': hp,
        'position': position,  
        'attributes': attributes  
    }
    
    # Add the new enemy to the game_state
    game_state["enemies"].append(enemy)

    print("\nUpdated Game State:")
    print(json.dumps(game_state, indent=2))

    return enemy

def check_for_encounter(player, game_state):
    """Determine if a combat encounter should occur based on the AI's narrative decision."""
    global game_history

    story_so_far = "\n".join(game_history).replace("\\", "\\\\")
    prompt = (
        f"The player {player['name']} is currently in {player['position']}."
        f" Based on the story so far:\n\n{story_so_far}\n\n"
        f"Should a combat encounter take place here? If so, describe the enemy and the context of the encounter. "
        f"Otherwise, continue the story without combat."
    )

    response = call_groq(prompt)

    combat_keywords = ["enemy", "threat", "attack", "ambush", "danger"]
    if any(keyword in response.lower() for keyword in combat_keywords):
        if "enemy" in response.lower():
            new_enemy = create_enemy(player["position"], game_state)
            print(f"\nAs the story progresses, an enemy appears: {new_enemy['type']} with {new_enemy['health']} HP!")
            return [new_enemy]

    print(f"\n{response.strip()}")
    return []

def process_player_action(action, player, enemies):
    """Process the player's action."""
    if "attack" in action.lower() or "strike" in action.lower():
        return handle_action(action, player, enemies)
    elif "spell" in action.lower() or "cast" in action.lower():
        return handle_spell(action, player, enemies)
    else:
        return handle_creative_action(action, player, enemies)

def handle_action(action, player, enemies):
    """Handle both attack and creative actions in one function, focusing on health updates."""
    
    # First, handle the combat part (if the action is an attack)
    if "attack" in action.lower():
        # Handle combat logic for attacking
        enemies_at_location = [e for e in game_state["enemies"] if e["position"] == player["position"]]
        
        if not enemies_at_location:
            return "There are no enemies here to attack."
        
        # Assuming you're attacking the first enemy at that position
        target_enemy = enemies_at_location[0]
        
        # Print the correct enemy you're attacking
        print(f"\nYou are attacking the {target_enemy['type']} with {target_enemy['health']} HP!")

        # Roll for attack
        attack_roll_result = attack_roll(player, target_enemy)
        
        if attack_roll_result["hit"]:
            # Successful hit
            damage = calculate_damage(player)
            target_enemy["health"] -= damage
            if target_enemy["health"] <= 0:
                # Enemy is defeated
                print(f"You successfully attack the {target_enemy['type']} and deal {damage} damage. The {target_enemy['type']} is defeated!")
                game_state["enemies"].remove(target_enemy)  # Remove defeated enemy
            else:
                # Enemy still alive
                print(f"You attack the {target_enemy['type']} and deal {damage} damage. The {target_enemy['type']} now has {target_enemy['health']} HP.")
        else:
            # Missed attack
            print(f"You attempt to attack the {target_enemy['type']} but miss.")

        # Report player and enemy health
        print(f"\nPlayer Health: {player['health']} HP")
        print(f"{target_enemy['type']} Health: {target_enemy['health']} HP")
        
        return ""  # No story output, just health status.
    
def handle_run(action, player, enemies):
    """Handle the player's attempt to run away from combat with added environment context."""
    # Use environment details (e.g., if there's a river or a cliff) to make escape attempts more exciting
    if "river" in player["position"].lower():
        print("The river's current is too strong! You can’t escape via the water.")
    elif "forest" in player["position"].lower():
        print("You sprint into the dense forest, weaving between trees, hoping to lose them!")
    else:
        print("You attempt to flee the battlefield!")
    
    success = roll_dexterity_check(player, enemies)
    
    if success:
        print("You successfully escape the combat!")
        return "escape_successful"
    else:
        print("You fail to escape! The enemies close in on you!")
        return "escape_failed"

    
def attack_roll(attacker, defender):
    """Perform an attack roll using DnD mechanics."""
    attack_bonus = attacker["attributes"].get("STR", 0) // 2 - 5  # Default to STR for melee
    roll = roll_dice("1d20") + attack_bonus
    armor_class = 10 + (defender["attributes"].get("DEX", 0) // 2 - 5)

    hit = roll >= armor_class
    return {
        "hit": hit,
        "message": (
            f"{attacker['name']} rolled {roll} against {defender['type']}'s AC {armor_class}. "
            f"{'Hit!' if hit else 'Miss!'}"
        )
    }

def calculate_damage(player):
    """Calculate the damage dealt by the player."""
    return random.randint(5, 15)
def handle_spell(action, player, enemies):
    """Handle spell casting with environmental effects and creative impact."""
    # Target the first enemy still alive
    target_enemy = next((e for e in enemies if e["health"] > 0), None)
    if not target_enemy:
        return "There are no valid targets for your spell."

    # Generate a more immersive spell description
    spell_effects = {
        "fireball": lambda: f"A fiery ball of flames erupts from your hands, incinerating {target_enemy['type']}!",
        "ice_blast": lambda: f"Cold, biting winds sweep over {target_enemy['type']}, freezing them in place.",
        "healing_wave": lambda: f"A soothing wave of energy envelops you, restoring your health."
    }

    spell_choice = random.choice(list(spell_effects.keys()))
    spell_description = spell_effects[spell_choice]()

    # Calculate damage or effect
    if spell_choice == "fireball":
        damage = random.randint(15, 30)
    elif spell_choice == "ice_blast":
        damage = random.randint(10, 20)
        target_enemy["health"] -= damage
        status_effect = "frozen in place"  # Add a status effect
        spell_description += f" The {target_enemy['type']} is now {status_effect}."
    else:  # healing wave
        healing = random.randint(10, 20)
        player["health"] += healing
        spell_description += f" You heal for {healing} health! Your health is now {player['health']}."

    target_enemy["health"] -= damage
    if target_enemy["health"] <= 0:
        return f"{spell_description} The {target_enemy['type']} is defeated!"
    else:
        return f"{spell_description} The {target_enemy['type']} now has {target_enemy['health']} health remaining."

def handle_creative_action(action, player, enemies):
    """Handle a player's creative action."""
    prompt = f"The player describes their action: '{action}'. As the Dungeon Master, interpret this action " \
             f"and provide a resolution based on the game state, including any effects on the enemies."
    return call_groq(prompt)

def enemy_turn(enemy, player):
    """Handle the enemy's action."""
    damage = random.randint(5, 15)
    player["health"] -= damage
    return f"The {enemy['type']} attacks you for {damage} damage! You have {player['health']} health remaining."

def process_question(question):
    """Handle a player's question and provide a relevant response."""
    global game_history
    global game_state

    prompt = (
        f"As the Dungeon Master, the player asks: '{question}'. Based on the current game state and history, "
        f"answer the question in the context of the story. Provide a detailed and immersive response, "
        f"possibly with new elements based on current world dynamics."
    )

    # Use the AI to generate a response
    answer = call_groq(prompt)
    return answer

    

def interactive_storytelling(game_state):
    """Handles interactive storytelling in a turn-based manner for multiple players."""
    while True:
        for player in game_state["players"]:
            # Debugging output
            print(f"Processing action for player: {player['name']}")

            if player["health"] <= 0:
                print(f"{player['name']} is unconscious and cannot take a turn.")
                continue

            print(f"\n{player['name']}'s turn! What would you like to do?")
            player_action = input().strip()

            if player_action.lower().startswith("action:"):
                action = player_action[7:].strip()
                # Debugging output: Ensure only one call per action
                print("Calling process_input for action:", action)

                story_response = process_input({
                    "action": action,
                    "player": player["name"],
                    "game_state": game_state,
                })
                
                # Limit response to a single paragraph
                
                limited_response = story_response.strip().split("\n\n")[0]
                

                print("\nStory response:", limited_response)


            
def update_world_state(player, action):
    """Update the world based on player action, e.g., adding lore, side quests, or environmental effects."""
    if "find" in action.lower() and "artifact" in action.lower():
        # Generate a plot twist or side quest
        prompt = f"Player {player['name']} discovers a mysterious artifact that glows with ancient power. What happens next?"
        artifact_story = call_groq(prompt)
        print(artifact_story)

    elif "explore" in action.lower() and "forest" in action.lower():
        # Change the environment and add a new encounter
        prompt = f"Player {player['name']} explores the deep forest. Describe the forest and any potential dangers or encounters."
        forest_story = call_groq(prompt)
        print(forest_story)


def process_input(data):
    """Process user input and continue the story."""
    user_input = data.get("action")
    player_name = data.get("player")
    current_state = data.get("game_state", game_state)
    player = next((p for p in current_state["players"] if p["name"] == player_name), None)

    if not player:
        return {"error": f"Player {player_name} not found."}

    # Check if combat is ongoing
    enemies_in_combat = [enemy for enemy in current_state["enemies"] if enemy["health"] > 0]

    # Define a prompt for storytelling or combat
    if enemies_in_combat:
        prompt = (
            f"The player {player_name}, a {player['name']}, is engaged in combat with "
            f"a {enemies_in_combat[0]['type']} with {enemies_in_combat[0]['health']} HP. "
            f"The player takes the action: '{user_input}'. "
            f"Describe the result of this action in detail, including its effects on the enemy and the environment. "
            f"Do not repeat details already described earlier in the story. Focus on dynamic, fresh narration."
        )
    else:
        prompt = (
           f"The player {player_name}, a {player['name']}, is currently located in {player['position']}.\n"
        f"The story so far:\n{'\n'.join(game_history)}\n\n"
        f"The player takes the action: '{user_input}'.\n"
        f"Continue the story in a logical way, ensuring it aligns with the context and avoids repetition. "
        f"Focus on advancing the narrative and providing clear options for the next move."
        )

    # Generate the response
    response = call_groq(prompt)
    return response







def start_game():
    """Starts the game with an AI-generated introduction and map."""
    
    intro_prompt = (
        "You are a Dungeon Master creating an immersive introduction for a group of players in a Dungeons and Dragons game. "
        "The introduction should be at least six lines long, including deep descriptions of the setting, "
        "detailed sensory elements (smells, sounds, textures), and a rich atmosphere. "
        "The players should feel immediately drawn into the world. "
        "Provide a clear group objective. "
        "The players are starting in a specific place, and you should describe what they are doing in that moment. "
        "Don't forget to end with an engaging prompt that invites the players to take action."
    )
    intro = call_groq(intro_prompt)
    game_history.append(intro)
    print(intro)
    return intro


   
def transform_to_json(response_text):
    rooms = {}
    current_room = None
    for line in response_text.splitlines():
        line = line.strip()
        if not line:
            continue

        room_match = re.match(r"^([A-Za-z0-9\s,':-]+):$", line)
        if room_match:
            current_room = room_match.group(1).strip()
            rooms[current_room] = {"description": "", "items": [], "exits": []}
            continue

        if current_room and line.lower().startswith("description:"):
            rooms[current_room]["description"] = line.split(":", 1)[1].strip() or "No description available."

        if current_room and line.lower().startswith("items:"):
            items = line.split(":", 1)[1].strip()
            rooms[current_room]["items"] = [item.strip() for item in items.split(",") if item.strip()]

        if current_room and line.lower().startswith("exits:"):
            exits = line.split(":", 1)[1].strip()
            rooms[current_room]["exits"] = [exit.strip() for exit in exits.split(",") if exit.strip()]

    if not rooms:
        raise ValueError("No valid rooms detected in the map response.")

    return rooms



@app.route("/startGame", methods=["POST"])
def start_game_endpoint():
    global game_state
    data = request.json
    print("Received data:", data)

    game_code = data.get("gameCode")
    players = data.get("players")

    if not game_code or not players:
        print("Invalid data received.")
        return jsonify({"error": "Invalid data: Missing gameCode or players"}), 400

    game_state["players"] = players

    try:
        introduction = start_game()  # Ensure this is accessible
    except Exception as e:
        print("Error during game initialization:", str(e))
        return jsonify({"error": "Internal Server Error"}), 500

    return jsonify({"introduction": introduction, "gameState": game_state})




@app.route("/processAction", methods=["POST"])
def process_action_endpoint():
    data = request.json
    print("Received data for processing action:", data)

    action = data.get("action")
    player = data.get("player")
    game_state = data.get("gameState", {})

    # Ensure gameState has required keys
    if "enemies" not in game_state:
        print("Enemies key missing in gameState. Initializing to empty list.")
        game_state["enemies"] = []

    if not action or not player or not game_state:
        print("Invalid data received:", data)
        return jsonify({"error": "Invalid data"}), 400

    try:
        # Process the action using the AI
        response = process_input({
            "action": action,
            "player": player,
            "game_state": game_state,
        })
        print("Generated AI response:", response)
        return jsonify({"response": response})
    except Exception as e:
        print("Error processing action:", str(e))
        return jsonify({"error": "Internal Server Error"}), 500





if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6000)



# Main Function
def main():
    print("Welcome to the game!")
    
    # Initialize the player with attributes
    player1 = {
        "name": "Human Rogue",  
        "position": "Hall",
        "health": 100,
        "attributes": {          
            "DEX": 14,          
            "STR": 10,           
            "CON": 12,
            "INT": 11,
            "WIS": 13,
            "CHA": 15,
              
        },
    }

    player2 = {
        "name": "Human Thief",  
        "position": "Hall",
        "health": 100,
        "attributes": {          
            "DEX": 14,          
            "STR": 10,           
            "CON": 12,
            "INT": 11,
            "WIS": 13,
            "CHA": 15,
              
        },
    }

    game_state["players"] = [player1, player2]

    # Start the game with an introduction
    start_game()

    # Enter interactive storytelling
    interactive_storytelling(game_state)

if __name__ == "__main__":
    main()
