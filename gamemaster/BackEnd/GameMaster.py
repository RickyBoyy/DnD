from dotenv import load_dotenv
import random
import groq
import os
import json
import sys
import re
from ai_request import LanguageModel






load_dotenv()

# Initialize Cohere API
groq_api_key = os.getenv("GROQ_API_KEY")  # Ensure the correct environment variable name
groq_client = groq.Client(api_key=groq_api_key)


# Game Variables
game_history = []
game_state = {
    "players": [],
    "enemies": [],
    "map": {},
}
language_model = LanguageModel()

# Define the game history
game_history = []

def call_groq(prompt):
    global game_history
    game_history.append(prompt)

    # Combine the game history into a full prompt
    full_prompt = "\n".join(game_history)

    # Generate a response using the language model
    response = language_model.generate_response(full_prompt)

    if response:
        return response.strip()
    else:
        return "Error: Unable to generate response."

def roll_dice(dice: str):
    """Rolls a dice in the format 'd20', '2d6', etc."""
    try:
        count, sides = map(int, dice.split('d'))
        return sum(random.randint(1, sides) for _ in range(count))
    except ValueError:
        raise ValueError("Invalid dice format.")

# Combat System
def initiate_combat(player, enemies):
    """Handles combat for the current player."""
    while player["health"] > 0 and any(enemy["health"] > 0 for enemy in enemies):
        print(f"\n{player['name']}, your turn! Describe your action (attack, spell, or run):")
        action = input().strip()

        if "run" in action.lower():
            result = handle_run(action, player, enemies)
            if result == "escape_successful":
                return "escape_successful"

        player_result = process_player_action(action, player, enemies)
        print(f"\n{player['name']}'s action result: {player_result}")

        for enemy in enemies:
            if enemy["health"] > 0:
                print(f"{enemy['type']} attacks {player['name']}!")
                damage = random.randint(5, 15)
                player["health"] -= damage
                print(f"{player['name']} has {player['health']} health remaining.")

        if player["health"] <= 0:
            print(f"{player['name']} has been defeated!")
            return "player_defeated"

    if all(enemy["health"] <= 0 for enemy in enemies):
        print("All enemies have been defeated!")
        return "victory"

    return "ongoing"

def roll_dexterity_check(player, enemies):
    """Roll for the player's dexterity against the enemy's dexterity to determine if they can escape."""
    player_roll = roll_dice("1d20") + player["attributes"]["DEX"]
    enemy_roll = roll_dice("1d20") + enemies[0]["attributes"]["DEX"]
    
    # Player succeeds if their roll is higher than the enemy's roll
    return player_roll > enemy_roll


def create_enemy(position, game_state):
    """Create a new enemy based on the player's current position and game state."""
    # Define some possible enemy types and their HP ranges
    enemy_types = ['Goblin', 'Orc', 'Troll', 'Dragon']
    enemy_type = random.choice(enemy_types)
    
    # Set the HP based on the enemy type (this could be more complex depending on the game)
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
    
    # Create the enemy dictionary
    enemy = {
        'type': enemy_type,
        'health': hp,
        'position': position,  # Store position if needed
        'attributes': attributes  # Add the attributes field here
    }
    
    # Add the new enemy to the game_state
    game_state["enemies"].append(enemy)

    print("\nUpdated Game State:")
    print(json.dumps(game_state, indent=2))

    return enemy

def check_for_encounter(player, game_state):
    """Determine if a combat encounter should occur and add the enemy to the game state."""
    # Randomly decide if an encounter happens or base it on the narrative
    encounter_chance = random.random()
    if encounter_chance > 0.9:  # 30% chance for an encounter
        # Generate a new enemy dynamically and add it to the game state
        new_enemy = create_enemy(player["position"], game_state)
        print(f"\nAs you proceed, an enemy appears: {new_enemy['type']} with {new_enemy['health']} HP!")
        return [new_enemy]
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
    """Handle the player's attempt to run away from combat."""
    # Assume the player rolls against the enemy's dexterity to escape
    success = roll_dexterity_check(player, enemies)
    
    if success:
        print("You successfully run away from combat!")
        return "escape_successful"  # Flag to indicate escape was successful
    else:
        print("You failed to escape! The enemy is still chasing you.")
        return "escape_failed"

    
def attack_roll(attacker, defender):
    """Perform an attack roll."""
    attack_bonus = attacker["attributes"].get("DEX", 0) // 2 - 5
    roll = roll_dice("1d20") + attack_bonus
    armor_class = 10 + (defender["attributes"].get("DEX", 0) // 2 - 5)

    if roll >= armor_class:
        return {"hit": True, "message": f"Attack roll successful! You rolled {roll} against AC {armor_class}."}
    else:
        return {"hit": False, "message": f"Attack roll failed. You rolled {roll} against AC {armor_class}."}

def calculate_damage(player):
    """Calculate the damage dealt by the player."""
    return random.randint(5, 15)
def handle_spell(action, player, enemies):
    """Handle spell casting logic with more descriptive results."""
    # Target the first enemy still alive
    target_enemy = next((e for e in enemies if e["health"] > 0), None)
    if not target_enemy:
        return "There are no valid targets for your spell."

    # Generate spell effects based on the player's input
    prompt = f"The player, an Elven Mage, casts a spell described as: '{action}'. " \
             "Create a detailed description of the spell's effect on the surroundings, " \
             "the enemy, and the emotional atmosphere, based on a fantasy setting."

    spell_description = call_groq(prompt)

    
    spell_damage = random.randint(10, 20)
    target_enemy["health"] -= spell_damage

    if target_enemy["health"] <= 0:
        defeat_message = f"The {target_enemy['type']} is defeated! Its charred remains fall to the ground, " \
                         f"its last roar echoing through the Hall."
    else:
        remaining_hp = f"It now has {target_enemy['health']} health remaining."
        defeat_message = f"The {target_enemy['type']} reels back from the impact, growling in pain. {remaining_hp}"

    return f"{spell_description}\nThe spell deals {spell_damage} damage. {defeat_message}"

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

    # Create a prompt for the AI to answer the question
    prompt = (
        f"As the Dungeon Master, the player asks: '{question}'. Based on the current game state and history, "
        f"answer the question in the context of the story. Provide a detailed and immersive response. "
        f"Do not generate new room names or unrelated content."
    )

    # Use the AI to generate a response
    answer = call_groq(prompt)
    return answer

    

def interactive_storytelling(game_state):
    """Handles interactive storytelling in a turn-based manner for multiple players."""
    while True:
        for player in game_state["players"]:
            # Skip players who are defeated
            if player["health"] <= 0:
                print(f"{player['name']} is unconscious and cannot take a turn.")
                continue

            print(f"\n{player['name']}'s turn! What would you like to do?")
            player_action = input().strip()

            if player_action.lower().startswith("ask:"):
                # Handle player questions
                question = player_action[4:].strip()
                answer = process_question(question)
                print(f"\nAnswer: {answer}")
                continue

            if player_action.lower().startswith("action:"):
                # Process player actions
                action = player_action[7:].strip()
                story_response = process_input({
                    "action": action,
                    "player": player["name"],
                    "game_state": game_state,
                })
                print("\nStory response:", story_response)

            # Check for encounters specific to the current player
            enemies = check_for_encounter(player, game_state)
            if enemies:
                print(f"Combat initiated for {player['name']}! Facing: {', '.join([enemy['type'] for enemy in enemies])}.")
                combat_result = initiate_combat(player, enemies)

                # Handle combat outcomes
                if combat_result == "victory":
                    print(f"{player['name']} defeated the enemies! Returning to the story...")
                elif combat_result == "player_defeated":
                    print(f"{player['name']} has been defeated and is out of the game.")

        # Optional: Check if all players are defeated
        if all(player["health"] <= 0 for player in game_state["players"]):
            print("All players have been defeated. Game over.")
            break
            



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

    if enemies_in_combat:
        # In combat, focus on the player's action and its consequences
        prompt = (
            f"The player {player_name}, a {player['name']}, is engaged in combat with "
            f"a {enemies_in_combat[0]['type']} with {enemies_in_combat[0]['health']} HP. "
            f"The player takes the action: '{user_input}'. Describe the result of this action in detail, "
            f"including its effects on the enemy and the surrounding environment while describing in a DnD game style narration."
        )
    else:
        # Exploration and storytelling
        prompt = (
            f"The player {player_name}, a {player['name']}, is exploring the environment. "
            f"The player takes the action: '{user_input}'. Continue the immersive story, "
            f"describing the environment, the effects of their action, and any new details they uncover. "
            f"Do not generate summaries or non-immersive text; focus on storytelling like a Dungeon Master in Dungeons and Dragons."
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
