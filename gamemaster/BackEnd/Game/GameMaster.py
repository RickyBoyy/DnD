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

SPECIAL_ABILITIES = {
    "Fighter": "Power Strike: A powerful melee attack dealing extra damage.",
    "Wizard": "Fireball: An explosive spell that deals damage to all enemies.",
    "Cleric": "Healing Wave: Restores health to the player.",
    "Rogue": "Precision Strike: A precise attack dealing high damage to a single target.",
    "Barbarian": "Rage: Gain temporary health and deal increased damage next turn.",
}

def call_groq(prompt):
    global game_history
    prune_game_history()  
    if not game_history:
        game_history.append("The adventure begins. The players find themselves in a mysterious setting.")

    full_prompt = (
        "You are a Dungeon Master. Here is the summarized story so far:\n"
        + game_history[0]  
        + "\nRecent developments:\n"
        + "\n".join(game_history[1:])
        + "\n\nNow respond to the following:\n"
        + prompt
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

def summarize_game_history(history):
    """Summarize the older parts of the game history."""
    combined_history = " ".join(history)
    prompt = (
        "Summarize the following game history to retain key context and important events:\n"
        + combined_history
    )
    summary = language_model.generate_response(prompt)
    return summary.strip() if summary else "Summary not available."
    
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


def initiate_combat_with_prompt(players, enemies):
    """Turn-based combat with combat narration."""
    print("\nCombat initiated!")

    while any(player["health"] > 0 for player in players) and any(enemy["health"] > 0 for enemy in enemies):
        # Players' Turn
        for player in players:
            if player["health"] <= 0:
                print(f"{player['name']} is unconscious and cannot act.")
                continue  # Skip if player is defeated

            print(f"\n{player['name']}, your turn! Choose an action:")
            print("1. Attack")
            print("2. Defend")
            if player["special_cooldown"] > 0:
                print(f"3. Use Special Ability (Unavailable, {player['special_cooldown']} turn(s) remaining)")
            else:
                print("3. Use Special Ability")
            print("4. Attempt Tactical Move")

            action = input("Enter the number of your action: ").strip()
            recent_action = ""

            if action == "1":
                # Attack
                target = choose_target(enemies)
                recent_action = attack(player, target)
                print(recent_action)
            elif action == "2":
                # Defend
                recent_action = defend(player)
                print(recent_action)
            elif action == "3":
                # Use Special Ability
                if player["special_cooldown"] > 0:
                    recent_action = f"{player['name']} cannot use their special ability for {player['special_cooldown']} more turn(s)."
                    print(recent_action)
                else:
                    print(f"\n{player['class']} Special Ability: {SPECIAL_ABILITIES.get(player['class'], 'No ability available.')}")
                    recent_action = use_special_ability(player, enemies)
                    print(recent_action)
                    player["special_cooldown"] = 3  # Set cooldown to 3 turns
            elif action == "4":
                # Tactical Move
                recent_action = perform_tactical_move(player, enemies)
                print(recent_action)
            else:
                recent_action = f"{player['name']} made no valid move this turn."
                print("Invalid choice! You lose your turn.")

            # Reduce cooldown after the player's turn
            if player["special_cooldown"] > 0:
                player["special_cooldown"] -= 1

            # Narrate the combat after the player's turn
            narration = narrate_combat(players, enemies, recent_action)
            print(f"\n{narration}")

            # Check if all enemies are defeated
            if all(enemy["health"] <= 0 for enemy in enemies):
                print("All enemies have been defeated!")
                return "victory"

        # Enemies' Turn
        print("\nEnemies' turn!")
        recent_action = ""
        for enemy in enemies:
            if enemy["health"] > 0:
                # Randomly target an alive player
                alive_players = [p for p in players if p["health"] > 0]

                if alive_players:
                    target = random.choice(alive_players)
                    recent_action += enemy_attack(enemy, target) + "\n"

        print(recent_action.strip())

        # Narrate the combat after the enemies' turn
        narration = narrate_combat(players, enemies, recent_action)
        print(f"\n[NARRATION]: {narration}")

        # Check if all players are defeated
        if all(player["health"] <= 0 for player in players):
            print("All players have been defeated!")
            return "player_defeated"

    # Combat conclusion
    if all(player["health"] <= 0 for player in players):
        return "player_defeated"
    elif all(enemy["health"] <= 0 for enemy in enemies):
        return "victory"
    else:
        return "ongoing"



def perform_tactical_move(player, enemies):
    """Perform a creative tactical move."""
    print("\nChoose a tactical move:")
    print("1. Dodge")
    print("2. Shove Enemy")
    print("3. Use Environment")

    choice = input("Enter the number of your tactical move: ").strip()

    if choice == "1":
        # Dodge: Player attempts to avoid the next attack
        success = roll_dice("1d20") + (player["attributes"]["DEX"] // 2) > 15
        if success:
            player["dodging"] = True  # Mark the player as dodging
            return f"{player['name']} successfully dodges the next attack!"
        else:
            return f"{player['name']} tries to dodge but fails."

    elif choice == "2":
        # Shove Enemy: Push an enemy back
        target = choose_target(enemies)
        success = roll_dice("1d20") + (player["attributes"]["STR"] // 2) > 12
        if success:
            target["shoved"] = True  # Mark the enemy as shoved
            return f"{player['name']} shoves {target['type']}, knocking them off balance!"
        else:
            return f"{player['name']} attempts to shove {target['type']} but fails."

    elif choice == "3":
        # Use Environment: Interact with surroundings
        outcome = random.choice([
            "You knock over a barrel, tripping the nearest enemy!",
            "You climb to higher ground, gaining a better position.",
            "You hurl a rock, distracting the enemies momentarily.",
        ])
        return f"{player['name']} uses the environment: {outcome}"

    else:
        return "Invalid choice! Tactical move failed."


def attack(attacker, target):
    """Perform an attack on the target."""
    attack_roll = roll_dice("1d20") + (attacker["attributes"]["STR"] // 2)  # STR modifier
    armor_class = 10 + (target["attributes"]["DEX"] // 2)  # DEX modifier for AC

    if attack_roll >= armor_class:
        damage = random.randint(5, 15) + (attacker["attributes"]["STR"] // 2)
        target["health"] -= damage
        return f"{attacker['name']} attacks {target['type']} and deals {damage} damage! {target['type']} has {target['health']} health remaining."
    else:
        return f"{attacker['name']} attacks {target['type']} but misses!"

def defend(player):
    """Set the player to a defensive stance."""
    player["defending"] = True
    return f"{player['name']} is defending and will take reduced damage next turn."


def use_special_ability(player, enemies):
    """Activate a special ability based on the player's class."""
    if player["class"] == "Fighter":
        # Fighter: Power Strike
        target = choose_target(enemies)
        damage = random.randint(20, 35) + (player["attributes"]["STR"] // 2)
        target["health"] -= damage
        return f"{player['name']} uses Power Strike and deals {damage} damage to {target['type']}! {target['type']} has {target['health']} health remaining."

    elif player["class"] == "Wizard":
        # Wizard: Fireball
        damage = random.randint(15, 30)
        for enemy in enemies:
            enemy["health"] -= damage
        return f"{player['name']} casts Fireball, dealing {damage} damage to all enemies!"

    elif player["class"] == "Cleric":
        # Cleric: Healing Wave
        healing = random.randint(15, 25)
        player["health"] += healing
        return f"{player['name']} uses Healing Wave and restores {healing} health! {player['health']} health remaining."

    elif player["class"] == "Rogue":
        # Rogue: Precision Strike
        target = choose_target(enemies)
        damage = random.randint(15, 30) + (player["attributes"]["DEX"] // 2)
        target["health"] -= damage
        return f"{player['name']} uses Precision Strike and deals {damage} damage to {target['type']}! {target['type']} has {target['health']} health remaining."

    elif player["class"] == "Barbarian":
        # Barbarian: Rage
        player["health"] += 15  # Gains temporary health
        return f"{player['name']} enters a Rage, gaining 15 temporary health! {player['health']} health remaining."
    
    elif player["class"] == "Paladin":
        # Paladin: Divine Smite
        target = choose_target(enemies)
        damage = random.randint(25, 40)
        target["health"] -= damage
        return f"{player['name']} uses Divine Smite, dealing {damage} radiant damage to {target['type']}! {target['type']} has {target['health']} health remaining."
    
    elif player["class"] == "Sorcerer":
        # Sorcerer: Arcane Bolt
        target = choose_target(enemies)
        damage = random.randint(15, 30)
        target["health"] -= damage
        return f"{player['name']} uses Arcane Bolt, dealing {damage} arcane damage to {target['type']}! {target['type']} has {target['health']} health remaining."
    
    elif player["class"] == "Druid":
        # Druid: Thorn Whip
        target = choose_target(enemies)
        damage = random.randint(10, 20)
        target["health"] -= damage
        return f"{player['name']} uses Thorn Whip, dealing {damage} damage and pulling {target['type']} closer!"
    
    elif player["class"] == "Monk":
        # Monk: Flurry of Blows
        total_damage = 0
        for _ in range(2):  # Attack twice
            target = choose_target(enemies)
            damage = random.randint(8, 15)
            target["health"] -= damage
            total_damage += damage
        return f"{player['name']} uses Flurry of Blows, striking twice and dealing a total of {total_damage} damage!"

    elif player["class"] == "Warlock":
        # Warlock: Eldritch Blast
        damage = random.randint(15, 25)
        target = choose_target(enemies)
        target["health"] -= damage
        return f"{player['name']} casts Eldritch Blast, dealing {damage} damage to {target['type']}! {target['type']} has {target['health']} health remaining."


    else:
        return f"{player['name']} has no special abilities available."

       
def enemy_attack(enemy, player):
    """Determine and execute an enemy's attack."""
    attack_roll = roll_dice("1d20") + (enemy["attributes"]["STR"] // 2)
    player_armor_class = 10 + (player["attributes"]["DEX"] // 2)

    if attack_roll >= player_armor_class:
        damage = random.randint(8, 18)
        if player.get("defending", False):
            damage //= 2  # Halve damage if defending
        player["health"] -= damage
        return f"The {enemy['type']} attacks {player['name']} and deals {damage} damage! {player['name']} has {player['health']} health remaining."
    else:
        return f"The {enemy['type']} attacks {player['name']} but misses!"

def choose_target(enemies):
    """Let the player choose an enemy target."""
    print("\nChoose a target:")
    for i, enemy in enumerate(enemies):
        print(f"{i + 1}. {enemy['type']} (Health: {enemy['health']})")
    
    while True:
        try:
            choice = int(input("Enter the number of your target: ").strip()) - 1
            if 0 <= choice < len(enemies) and enemies[choice]["health"] > 0:
                return enemies[choice]
            else:
                print("Invalid choice or enemy is already defeated. Try again.")
        except ValueError:
            print("Invalid input. Enter a number corresponding to an enemy.")

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
    global game_history

    # Use the game's history and position to craft a dynamic enemy description
    story_so_far = "\n".join(game_history)
    prompt = (
        f"The player is currently at {position}. Based on the game's current narrative:\n\n"
        f"{story_so_far}\n\n"
        f"Describe an enemy that would be appropriate to this setting. "
        f"Provide the enemy's name, type, health, attributes (STR, DEX, CON, INT, WIS, CHA), and any "
        f"special traits that fit the situation. "
        f"Ensure that you provide the complete description of the enemy, including these details in the response."
    )

    # Get the AI's response
    response = call_groq(prompt)

    # Debugging: Print the raw response from call_groq to inspect it
    print("\n[DEBUG] Raw response from call_groq:")
    print(response)

    try:
        # Ensure that we have a valid response
        if not response:
            raise ValueError("Empty response received from call_groq.")

        # Initialize name, type, and other attributes as defaults
        name = "Riporos"
        enemy_type = "Dragon"
        health = random.randint(50, 100)
        attributes = {
            'STR': random.randint(8, 15),
            'DEX': random.randint(8, 15),
            'CON': random.randint(8, 15),
            'INT': random.randint(8, 15),
            'WIS': random.randint(8, 15),
            'CHA': random.randint(8, 15),
        }
        special_traits = ["Hard Scales"]  # Default special trait

        # Parse the AI response directly to extract the name, type, attributes, etc.
        # Assuming a structured response format like:
        # "The enemy is a [name], a [type] creature. Health: [value], STR: [value], DEX: [value], etc."

        if "enemy is a" in response.lower():
            name_start = response.lower().find("enemy is a") + len("enemy is a")
            name_end = response.find(",", name_start)
            name = response[name_start:name_end].strip() if name_end != -1 else response[name_start:].strip()

        # Attempt to extract the type of the enemy from the description
        if "creature" in response.lower():
            type_start = response.lower().find(name.lower()) + len(name)
            type_end = response.lower().find("creature", type_start)
            if type_end == -1:
                type_end = response.lower().find("enemy", type_start)
            enemy_type = response[type_start:type_end].strip() if type_end != -1 else "Unknown Type"

        # Extract other attributes, such as health, STR, DEX, etc.
        health_match = re.search(r"Health: (\d+)", response)
        if health_match:
            health = int(health_match.group(1))

        # Extract the attributes if available
        attribute_matches = re.findall(r"([A-Z]+): (\d+)", response)
        for attribute, value in attribute_matches:
            if attribute in attributes:
                attributes[attribute] = int(value)

        # Extract any special traits, if they exist
        special_traits_match = re.findall(r"special trait: (\w+)", response)
        if special_traits_match:
            special_traits = special_traits_match

        # Debugging: Print the extracted details
        print(f"[DEBUG] Extracted name: {name}")
        print(f"[DEBUG] Extracted type: {enemy_type}")
        print(f"[DEBUG] Extracted health: {health}")
        print(f"[DEBUG] Extracted attributes: {attributes}")
        print(f"[DEBUG] Extracted special traits: {special_traits}")

        # Create an enemy object based on extracted information
        enemy = {
            'name': name,
            'type': enemy_type,
            'health': health,
            'position': position,
            'attributes': attributes,
            'special_traits': special_traits
        }

    except Exception as e:
        # Fallback in case something goes wrong during parsing
        print(f"[ERROR] Failed to parse response: {e}")
        # Default fallback
        enemy = {
            'name': 'Mysterious Creature',
            'type': 'Mysterious Enemy',
            'health': random.randint(10, 100),
            'position': position,
            'attributes': {
                'STR': random.randint(8, 15),
                'DEX': random.randint(8, 15),
                'CON': random.randint(8, 15),
                'INT': random.randint(8, 15),
                'WIS': random.randint(8, 15),
                'CHA': random.randint(8, 15),
            },
            'special_traits': ["Unpredictable"],
        }

    # Add the new enemy to the game_state
    game_state["enemies"].append(enemy)
    print("\nNew enemy created based on story context:")
    print(json.dumps(enemy, indent=2))
    return enemy

    
def check_for_encounter(player, game_state):
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
        print("\nAI Response:", response) 
        new_enemy = create_enemy(player["position"], game_state)
        print(f"An enemy appears: {new_enemy['type']} with {new_enemy['health']} HP!")
        return [new_enemy]

    print("No combat encounter detected.")
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
    attack_bonus = attacker["attributes"].get("STR", 0) // 2 - 5  
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

def narrate_combat(players, enemies, recent_action):
    """Generate combat narration using call_groq."""
    combat_state = f"Players:\n"
    for player in players:
        combat_state += f"- {player['name']} ({player['class']}): {player['health']} HP\n"

    combat_state += f"\nEnemies:\n"
    for enemy in enemies:
        combat_state += f"- {enemy['type']}: {enemy['health']} HP\n"

    # Include the recent action for context
    prompt = (
        f"The following combat is taking place:\n\n"
        f"{combat_state}\n\n"
        f"Most recent action: {recent_action}\n\n"
        f"Provide a vivid and immersive narration of the current state of the battle."
    )

    # Call call_groq to generate narration
    narration = call_groq(prompt)
    return narration


    

def interactive_storytelling(game_state):
    """Handles interactive storytelling in a turn-based manner for multiple players."""
    combat_initiated = False
    while True:
        for player in game_state["players"]:
            if player["health"] <= 0:
                print(f"{player['name']} is unconscious and cannot take a turn.")
                continue

            print(f"\n{player['name']}'s turn! What would you like to do?")
            player_action = input().strip()

            # Remove "action:" if it exists
            if player_action.lower().startswith("action:"):
                player_action = player_action[7:].strip()

            if player_action.lower() == "initiate combat" and not combat_initiated:
                # Check if enemies exist; if not, create one
                if not game_state["enemies"]:
                    position = "current_position_placeholder"  # Replace with actual position
                    create_enemy(position, game_state)
                
                # Extract players and enemies from game_state
                players = game_state["players"]
                enemies = game_state["enemies"]
                
                # Initiate combat with the players and enemies
                initiate_combat_with_prompt(players, enemies)
                combat_initiated = True  # Set flag to True to prevent multiple initiations
                continue  # Skip processing further actions after initiating combat

            # Process the player's action if combat has not been initiated
            if combat_initiated:
                # Process other player actions here (attacking, defending, etc.)
                story_response = process_input({
                    "action": player_action,
                    "player": player["name"],
                    "game_state": game_state,
                })

                # Limit response to a single paragraph
                limited_response = story_response.strip().split("\n\n")[0]
                print("\n", limited_response)
            else:
                print("You must initiate combat first by typing 'initiate combat'.")

            
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
    global game_history

    intro_prompt = (
        "You are a Dungeon Master creating an immersive introduction for a group of players in a Dungeons and Dragons game. "
        "The introduction should be at least six lines long, including deep descriptions of the setting, "
        "detailed sensory elements (smells, sounds, textures), and a rich atmosphere. "
        "The players should feel immediately drawn into the world. "
        "Provide a clear group objective. "
        "The players are starting in a specific place, and you should describe what they are doing in that moment. "
        "Don't forget to end with an engaging prompt that invites the players to take action."
    )

    if not game_history:
        game_history.append("The adventure begins. A group of travelers gathers in a dimly lit tavern...")

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
        introduction = start_game()  
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


PORT = int(os.getenv('GAME_PORT',6001))



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT)



# Main Function
def main():
    print("Welcome to the game!")
    
    # Initialize the player with attributes
    player1 = {
        "name": "Hagrid",
        "class": "Rogue",
        "race": "Human",  
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
        "defending": False,
        "special_cooldown": 0,
    }

    player2 = {
        "name": "Aurora",  
        "class": "Cleric",
        "race": "Elf",  
        "position": "Hall",
        "health": 150,
        "attributes": {          
            "DEX": 10,          
            "STR": 11,           
            "CON": 12,
            "INT": 14,
            "WIS": 13,
            "CHA": 15,
              
        },
        "defending": False,
        "special_cooldown": 0,
    }

    game_state["players"] = [player1, player2]

    # Start the game with an introduction
    start_game()

    # Enter interactive storytelling
    interactive_storytelling(game_state)

def start_combat_test():
    """Set up a combat scenario for testing turn-based mechanics."""
    # Create players
    players = [
        {
            "name": "Aelin",
            "race": "Human",
            "class": "Rogue",
            "position": "Forest",
            "health": 100,
            "attributes": {
                "DEX": 14,
                "STR": 12,
                "CON": 10,
                "INT": 10,
                "WIS": 10,
                "CHA": 12,
            },
            "defending": False,
            "special_cooldown": 0,
        },
        {
            "name": "Thrain",
            "race": "Dwarf",
            "class": "Fighter",
            "position": "Forest",
            "health": 120,
            "attributes": {
                "DEX": 10,
                "STR": 16,
                "CON": 14,
                "INT": 8,
                "WIS": 10,
                "CHA": 10,
            },
            "defending": False,
            "special_cooldown": 0,
        },
        {
            "name": "Eldrin",
            "race": "Elf",
            "class": "Wizard",
            "position": "Forest",
            "health": 90,
            "attributes": {
                "DEX": 12,
                "STR": 8,
                "CON": 10,
                "INT": 16,
                "WIS": 14,
                "CHA": 10,
            },
            "defending": False,
            "special_cooldown": 0,
        },
    ]

    # Create enemies
    enemies = [
        {
            "type": "Goblin",
            "health": 30,
            "attributes": {
                "DEX": 12,
                "STR": 10,
                "CON": 8,
                "INT": 8,
                "WIS": 8,
                "CHA": 6,
            },
        },
        {
            "type": "Orc",
            "health": 50,
            "attributes": {
                "DEX": 10,
                "STR": 14,
                "CON": 12,
                "INT": 8,
                "WIS": 8,
                "CHA": 6,
            },
        },
    ]

    # Print initial setup
    print("Combat Test Initialized!")
    for player in players:
        print(f"Player: {player['name']} ({player['race']} {player['class']}) - Health: {player['health']}")

    print("\nEnemies:")
    for enemy in enemies:
        print(f"  {enemy['type']} - Health: {enemy['health']}")

    # Start combat
    combat_result = initiate_combat_with_prompt(players, enemies)

    # Print combat outcome
    if combat_result == "victory":
        print("The players have emerged victorious!")
    elif combat_result == "player_defeated":
        print("The players have been defeated!")
    else:
        print("Combat ended inconclusively.")



if __name__ == "__main__":
   main()
