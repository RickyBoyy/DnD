from dotenv import load_dotenv
import random
import cohere
import os
import json
import sys
import openai

load_dotenv()

# Initialize Cohere API
cohere_api_key = os.getenv("open_ai_key")
co = cohere.Client(cohere_api_key)


# Game Variables
game_history = []
game_state = {
    "players": [],
    "enemies": [],
    "map": {
        "Hall": {"description": "A large room with broken columns.", "items": [], "exits": ["Corridor"]},
        "Corridor": {"description": "A narrow hallway filled with cobwebs.", "items": ["Key"], "exits": ["Hall"]},
    },
}

# Core Functions
def call_cohere(prompt):
    global game_history
    game_history.append(prompt)
    

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


def roll_dice(dice: str):
    """Rolls a dice in the format 'd20', '2d6', etc."""
    try:
        count, sides = map(int, dice.split('d'))
        return sum(random.randint(1, sides) for _ in range(count))
    except ValueError:
        raise ValueError("Invalid dice format.")

# Combat System
def initiate_combat(player, enemies):
    """Handles combat until all enemies are defeated or the player dies."""
    while player["health"] > 0 and any(enemy["health"] > 0 for enemy in enemies):
        print(f"Your turn! What would you like to do? (Describe your attack, spell, or run)")

        action = input().strip()

        # If the player wants to run away
        if "run" in action.lower():
            result = handle_run(action, player, enemies)
            if result == "escape_successful":
                return "escape_successful"  # Successfully escaped combat

        # Process player action and describe combat result
        player_result = process_player_action(action, player, enemies)
        print(f"Player action result: {player_result}")

        # Enemy turn
        for enemy in enemies:
            if enemy["health"] > 0:
                print(f"\nEnemy turn! {enemy['type']} attacks!")
                damage = random.randint(5, 15)  # Random damage for enemy
                player["health"] -= damage
                print(f"You have {player['health']} health remaining.")

        if player["health"] <= 0:
            print("You have been defeated!")
            return "player_defeated"

    if all(enemy["health"] <= 0 for enemy in enemies):
        print("\nAll enemies have been defeated!")
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
    if encounter_chance > 0.7:  # 30% chance for an encounter
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

    spell_description = call_cohere(prompt)

    
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
    return call_cohere(prompt)

def enemy_turn(enemy, player):
    """Handle the enemy's action."""
    damage = random.randint(5, 15)
    player["health"] -= damage
    return f"The {enemy['type']} attacks you for {damage} damage! You have {player['health']} health remaining."

def interactive_storytelling(player, game_state):
    """Handles the interactive storytelling phase, with questions answered as needed."""
    while True:
        # Prompt the player for their action
        player_action = input("\nWhat would you like to do?\n").strip()
        
        # Handle questions that begin with "ask:"
        if player_action.lower().startswith("ask:"):
            question = player_action[4:].strip()  # Remove the "ask:" part and handle the rest as a question.
            
            # Call the process_question function to handle the question
            answer = process_question(question)
            print(f"\nAnswer: {answer}")
            
            # Skip combat initiation or further story processing after answering the question
            continue
        
        # Handle player actions like running, attacking, etc.
        if player_action.lower().startswith("action:"):
            action = player_action[7:].strip()  # Get the action from the input
            story_response = process_input({
                "action": action,
                "player": player["name"],
                "game_state": game_state,
            })
            print("\nStory response:", story_response)
            
            # Check if an encounter happens (no question asked)
            enemies = check_for_encounter(player, game_state)
            if enemies:
                print(f"Combat initiated! You face: {', '.join([f'{enemy['type']} with {enemy['health']} HP' for enemy in enemies])}.")
                combat_result = initiate_combat(player, enemies)
                        
                if combat_result == "victory":
                    print("Combat has ended. Returning to the story...")
                elif combat_result == "player_defeated":
                    print("Game over.")
                    break
            



def process_input(data):
    """Process user input and continue the story."""
    user_input = data.get("action")
    player_name = data.get("player")
    current_state = data.get("game_state", game_state)
    player = next((p for p in current_state["players"] if p["name"] == player_name), None)

    if not player:
        return {"error": f"Player {player_name} not found."}

    # Get the current enemy and check if combat is ongoing
    enemies_in_combat = [enemy for enemy in current_state["enemies"] if enemy["health"] > 0]

    # If the player is in combat with an enemy, adjust the prompt to reflect the combat scenario
    if enemies_in_combat:
        # Example: Attack Dragon with 187 HP
        combat_enemy = enemies_in_combat[0]
        prompt = f"As the Dungeon Master, the player, {player_name}, is currently fighting a {combat_enemy['type']} with {combat_enemy['health']} HP. " \
                 f"The player takes the action: '{user_input}'. Continue the story and describe the effects of this action in the context of the ongoing battle."
    else:
        # No enemies in combat, just continuing the narrative
        prompt = f"As the Dungeon Master, the player, {player_name}, takes the action: '{user_input}'. Continue the story based on this action."

    # Now, call Cohere API to generate the narrative
    return call_cohere(prompt)

def process_question(question):
    """Handle questions."""
    prompt = f"As the Dungeon Master, the player asks: '{question}'. Provide a relevant response. According to what was previous said"
    return call_cohere(prompt)

def start_game():
    """Starts the game with an AI-generated detailed introduction."""
    prompt = (
        "You are a Dungeon Master creating an immersive introduction for a group of players in a Dungeons and Dragons game. "
        "The introduction should be at least six lines long, including deep descriptions of the setting, "
        "detailed sensory elements (smells, sounds, textures), and a rich atmosphere. "
        "The players should feel immediately drawn into the world. "
        "Provide a clear group objective. "
        "The players are starting in a specific place, and you should describe what they are doing in that moment. "
        "End with an engaging prompt that invites the players to take action."
    )

    intro = call_cohere(prompt)
    game_history.append(intro)
    print(intro)
# Main Function
def main():
    print("Welcome to the game!")
    
    # Initialize the player with attributes
    player = {
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

    game_state["players"] = [player]

    # Start the game with an introduction
    start_game()

    # Enter interactive storytelling
    interactive_storytelling(player, game_state)

if __name__ == "__main__":
    main()
