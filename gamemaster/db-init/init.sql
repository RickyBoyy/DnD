CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(50) UNIQUE,
    password VARCHAR(255),
    country VARCHAR(50)
);

CREATE TABLE campaign (
    campaign_id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_name VARCHAR(50),
    current_act INT NOT NULL,
    start_date DATETIME,
    last_updated DATETIME
);

CREATE TABLE character_player (
    character_id INT AUTO_INCREMENT PRIMARY KEY,
    character_name VARCHAR(50),
    character_race VARCHAR(50),
    character_class VARCHAR(50),
    character_backstory TEXT,
    character_alignment VARCHAR(50),
    character_level INT NOT NULL,
    character_strength INT NOT NULL,
    character_dexterity INT NOT NULL,
    character_constitution INT NOT NULL,
    character_intelligence INT NOT NULL,
    character_charisma INT NOT NULL,
    character_wisdom INT NOT NULL,
    character_personality VARCHAR(50),
    character_role VARCHAR(50),
    character_status VARCHAR(50),
    character_user_id INT NOT NULL,
    campaign_id INT NOT NULL,
    CONSTRAINT character_fk_user FOREIGN KEY (character_user_id) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT campaign_fk_character FOREIGN KEY (campaign_id) REFERENCES campaign(campaign_id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE quest (
    quest_id INT AUTO_INCREMENT PRIMARY KEY,
    quest_name VARCHAR(50),
    quest_type VARCHAR(50),
    quest_description TEXT,
    quest_objective TEXT,
    quest_status VARCHAR(50),
    quest_reward VARCHAR(50),
    quest_start_date DATETIME,
    quest_end_date DATETIME,
    campaign_id INT NOT NULL,
    CONSTRAINT campaign_fk_quest FOREIGN KEY (campaign_id) REFERENCES campaign(campaign_id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(50),
    item_type VARCHAR(50),
    item_description TEXT,
    owner_id INT NOT NULL,
    quest_id INT NOT NULL,
    CONSTRAINT items_fk_character FOREIGN KEY (owner_id) REFERENCES character_player(character_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT item_fk_quest FOREIGN KEY (quest_id) REFERENCES quest(quest_id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE player_choice (
    choice_id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_choice_id INT NOT NULL,
    character_choice_id INT NOT NULL,
    quest_choice_id INT NOT NULL,
    choice_description TEXT,
    consequence TEXT,
    time_choice TIMESTAMP,
    CONSTRAINT choice_fk_campaign FOREIGN KEY (campaign_choice_id) REFERENCES campaign(campaign_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT choice_fk_character FOREIGN KEY (character_choice_id) REFERENCES character_player(character_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT choice_fk_quest FOREIGN KEY (quest_choice_id) REFERENCES quest(quest_id) ON DELETE NO ACTION ON UPDATE NO ACTION
);
