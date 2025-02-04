const POWER_PROBABILITY = 0.3;
const POWER_EFFECTS = {
    heal: { type: 'heal', multiplier: 0.3 },
    regenerate: { type: 'heal', multiplier: 0.2 },
    fire: { type: 'damage', multiplier: 1.5 },
    plasma: { type: 'damage', multiplier: 1.4 },
    sonic: { type: 'stun', duration: 1 },
    adapt: { type: 'adapt', multiplier: 2 },
    'passive: honored one': { type: 'honored', duration: 30 }
};

let characters = [];
let currentTeam = 'red';

async function addCharacter() {
    const input = document.getElementById('characterInput');
    const name = input?.value?.trim();
    if (!name) return;

    // Check for secret code
    if (name === "1234") {
        window.open("https://cdn.discordapp.com/attachments/1223419995782910062/1336204333502693407/image.png?ex=67a2f4c2&is=67a1a342&hm=ddd1a28bd4226229614b397514cbd3b734b8ef0ef070016ff8b76824c7018c7d&", "_blank");
        input.value = '';
        return;
    }

    input.value = '';
    const teamContainer = document.getElementById(currentTeam + 'Team');
    if (!teamContainer) return;

    const loadingElem = document.createElement('div');
    loadingElem.textContent = `Researching ${name}...`;
    teamContainer.appendChild(loadingElem);

    try {
        // Handle special cases first
        // Handle "11/14/1987" special case - replacing Fredbear
        if (name === "11/14/1987") {
            input.value = 'Fredbear';
            loadingElem.textContent = `Researching Fredbear...`;
            await addCharacter();
            loadingElem.remove();
            return;
        }

        // Handle "2/1/25" special case
        if (name === "2/1/25") {
            const mysteryData = {
                name: "agedgalaxy04066013",
                origin: "2/1/25",
                powers: ["um"],
                attack: 0,
                defense: 0,
                health: 0,
                description: "???",
                isSpecialImage: true,
                specialImage: '/Screenshot 2025-02-02 184007.png'
            };
            
            characters.push({
                ...mysteryData,
                team: currentTeam,
                currentHealth: mysteryData.health,
                baseAttack: mysteryData.attack,
                baseDefense: mysteryData.defense,
                baseMaxHealth: mysteryData.health
            });

            createCharacterCard(mysteryData, currentTeam);
            loadingElem.remove();
            currentTeam = currentTeam === 'red' ? 'blue' : 'red';
            return;
        }

        // Handle "2/2/25" special case
        if (name === "2/2/25") {
            const mysteryData = {
                name: "cozyrain73084502",
                origin: "2/2/25",
                powers: ["um"],
                attack: 0,
                defense: 0,
                health: 0,
                description: "???",
                isSpecialImage: true,
                specialImage: '/lol2.png'
            };
            
            characters.push({
                ...mysteryData,
                team: currentTeam,
                currentHealth: mysteryData.health,
                baseAttack: mysteryData.attack,
                baseDefense: mysteryData.defense,
                baseMaxHealth: mysteryData.health
            });

            createCharacterCard(mysteryData, currentTeam);
            loadingElem.remove();
            currentTeam = currentTeam === 'red' ? 'blue' : 'red';
            return;
        }

        // Handle "my profile" input
        if (name.toLowerCase() === 'my profile') {
            const currentUser = await window.websim.getUser();
            if (!currentUser) {
                loadingElem.textContent = 'Error: Could not get user profile';
                return;
            }

            const profileData = {
                name: currentUser.username,
                origin: "Websim",
                powers: ["Self Insert"],
                attack: 100,
                defense: 100,
                health: 100,
                description: "This is just a self insert! too bad you don't get inf stats instantly!",
                isRoblox: false,
                isSelfInsert: true
            };
            
            characters.push({
                ...profileData,
                team: currentTeam,
                currentHealth: profileData.health,
                baseAttack: profileData.attack,
                baseDefense: profileData.defense,
                baseMaxHealth: profileData.health
            });

            createCharacterCard(profileData, currentTeam);
            loadingElem.remove();
            currentTeam = currentTeam === 'red' ? 'blue' : 'red';
            return;
        }

        // Add Lemur special case before Prison Realm
        if (name.toLowerCase() === 'lemur') {
            const lemurData = {
                name: "Lemur",
                origin: "Websim",
                powers: ["Passive: Honored One", "Infinite Power", "Creator's Blessing", "Ultimate Authority"],
                attack: Infinity,
                defense: Infinity,
                health: Infinity,
                description: "This is just a self insert! I'm giving myself inf all stats?",
                isRoblox: false,
                isLemur: true
            };
            
            characters.push({
                ...lemurData,
                team: currentTeam,
                currentHealth: lemurData.health,
                baseAttack: lemurData.attack,
                baseDefense: lemurData.defense,
                baseMaxHealth: lemurData.health,
                honoredOneActive: false,
                honoredOneTimer: null
            });

            createCharacterCard(lemurData, currentTeam);
            loadingElem.remove();
            currentTeam = currentTeam === 'red' ? 'blue' : 'red';
            return;
        }

        // Add Prison Realm special case before other characters
        if (name.toLowerCase().includes('prison realm')) {
            const prisonRealmDesc = await fetchCharacterDescription("Prison Realm Jujutsu Kaisen");
            const prisonRealmData = {
                name: "Prison Realm",
                origin: "Jujutsu Kaisen",
                powers: ["Seal"],
                attack: 0,
                defense: 0,
                health: Infinity,
                isPrisonRealm: true,
                isRoblox: false,
                description: prisonRealmDesc || "A mystical prison box capable of sealing even the strongest sorcerers for up to a thousand years."
            };
            
            characters.push({
                ...prisonRealmData,
                team: currentTeam,
                currentHealth: prisonRealmData.health,
                baseAttack: prisonRealmData.attack,
                baseDefense: prisonRealmData.defense,
                baseMaxHealth: prisonRealmData.health,
                hasUsedSeal: false,
                adaptCount: 0,
                honoredOneActive: false,
                honoredOneTimer: null
            });

            createCharacterCard(prisonRealmData, currentTeam);
            loadingElem.remove();
            currentTeam = currentTeam === 'red' ? 'blue' : 'red';
            return;
        }

        // Handle all other characters through the AI with wiki information
        const response = await fetch('/api/ai_completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                prompt: `Research and generate accurate character information for "${name}" based on wiki articles and canonical sources.
                Consider their:
                - Background and origin story
                - Known abilities and powers
                - Notable achievements and feats
                - Power level in their universe
                - Key character traits and features

                Use the 1 million scale for stats:
                - Attack (0.1-1000000)
                - Defense (0.1-1000000)
                - Health (0.1-1000000)
                
                Power Tiers:
                - Regular humans: 10-100
                - Peak humans: 100-1000
                - Superhuman: 1000-10000
                - S-Class heroes: 10000-50000
                - City level threats: 50000-100000
                - Country level: 100000-250000
                - Continental: 250000-400000
                - Planetary: 400000-600000
                - Solar System: 600000-800000
                - Universal: 800000-950000
                - Multiversal: 950000-1000000
                
                Special Cases:
                - Sans: 1 attack, max dodge rate
                - Saitama: attack
                - Gojo Satoru: ~900000 all stats + Honored One
                - Sukuna: ~900000 all stats + Malevolent Shrine
                - Mahoraga: ~800000 all stats + Adaptation
                
                Format powers as short, clear abilities (e.g. "Fire Control" not "The ability to manipulate flames and create fire")
                Ensure no duplicate powers.
                Keep description brief and focused on key traits.
                
                Response format:
                {
                    "name": string,
                    "origin": string,
                    "description": string,  // 2-3 sentences max
                    "powers": string[],     // 2-4 unique key abilities
                    "attack": number(0.1-1000000),
                    "defense": number(0.1-1000000),
                    "health": number(0.1-1000000),
                    "isRoblox": boolean,
                    "searchTerms": string[] // Terms to search in wikis for this character
                }`
            }),
        });
        
        const charData = await response.json();
        
        // Fetch additional wiki information using the search terms
        const wikiResponse = await fetch('/api/ai_completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                prompt: `Given these search terms for ${name}: ${charData.searchTerms.join(', ')}
                
                Research these terms in wikis and provide:
                1. Any missing key abilities
                2. Important power scaling information
                3. Notable feats or achievements
                4. Any corrections to the character description
                
                Keep abilities short and clear.
                Remove any duplicate or overlapping powers.
                Ensure canonical accuracy.
                
                Response format:
                {
                    "additionalPowers": string[],
                    "powerScaling": string,
                    "notableFeats": string[],
                    "descriptionUpdate": string
                }`
            }),
        });
        
        const wikiData = await wikiResponse.json();
        
        // Merge wiki information with character data
        charData.powers = [...new Set([...charData.powers, ...wikiData.additionalPowers])].slice(0, 4);
        if (wikiData.descriptionUpdate) {
            charData.description = wikiData.descriptionUpdate;
        }
        
        // Special handling for known characters
        if (charData.name.toLowerCase().includes('mahoraga')) {
            if (!charData.powers.includes('Adapt')) {
                charData.powers.unshift('Adapt');
            }
            charData.attack = Math.max(charData.attack, 750000);
            charData.defense = Math.max(charData.defense, 800000);
            charData.health = Math.max(charData.health, 850000);
        }

        if (charData.name.toLowerCase().includes('gojo')) {
            if (!charData.powers.includes('Passive: Honored One')) {
                charData.powers.push('Passive: Honored One');
            }
            charData.attack = Math.max(charData.attack, 880000);
            charData.defense = Math.max(charData.defense, 950000);
            charData.health = Math.max(charData.health, 900000);
        }

        if (charData.name.toLowerCase().includes('sukuna')) {
            if (!charData.powers.includes('Malevolent Shrine')) {
                charData.powers.unshift('Malevolent Shrine');
            }
            charData.attack = Math.max(charData.attack, 920000);
            charData.defense = Math.max(charData.defense, 890000);
            charData.health = Math.max(charData.health, 900000);
        }

        if (charData.name.toLowerCase() === 'saitama') {
            charData.attack = Infinity;
            charData.defense = 999999;
            charData.health = 999999;
            if (!charData.powers.includes('One Punch')) {
                charData.powers.unshift('One Punch');
            }
        }

        if (charData.name.toLowerCase() === 'sans') {
            charData.attack = 1;
            charData.defense = 1;
            charData.health = 1;
            charData.dodgeRate = 0.9;
            if (!charData.powers.includes('Ultra Instinct')) {
                charData.powers.unshift('Ultra Instinct');
            }
        }

        // Add character to the game
        characters.push({
            ...charData,
            team: currentTeam,
            currentHealth: charData.health,
            baseAttack: charData.attack,
            baseDefense: charData.defense,
            baseMaxHealth: charData.health,
            hasRespawned: false,
            adaptCount: 0,
            honoredOneActive: false,
            honoredOneTimer: null,
            dodgeRate: charData.dodgeRate || 0,
            minDamage: charData.attack * 0.8,
            maxDamage: charData.attack * 1.2
        });

        createCharacterCard(charData, currentTeam);
        loadingElem.remove();
        currentTeam = currentTeam === 'red' ? 'blue' : 'red';
        
    } catch (error) {
        console.error('Error:', error);
        if (loadingElem && loadingElem.parentNode) {
            loadingElem.textContent = `Failed to load ${name}`;
        }
    }
}

async function fetchCharacterDescription(searchTerm) {
    try {
        const response = await fetch('/api/ai_completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                prompt: `Research and provide a 2-3 sentence description for: ${searchTerm}
                Focus on their key characteristics, abilities, and role in their story.
                
                Response format:
                {
                    "description": string
                }`
            }),
        });
        
        const data = await response.json();
        return data.description;
    } catch (error) {
        console.error('Error fetching description:', error);
        return null;
    }
}

function createCharacterCard(data, team) {
    if (!data || !team) return;
    
    const teamContainer = document.getElementById(team + 'Team');
    if (!teamContainer) return;

    const card = document.createElement('div');
    const powerLevel = (data.attack || 0) + (data.defense || 0) + (data.health || 0);
    
    const isStrong = powerLevel > 1000;
    
    card.className = `character-card ${team}-team ${isStrong ? 'super-strong' : ''}`;

    // Add a delete button to the header
    const deleteButton = `
        <button class="delete-character-btn" onclick="deleteCharacter(this)" title="Delete character">
            🗑️
        </button>
    `;

    // Special handling for the mystery image card
    if (data.isSpecialImage) {
        card.innerHTML = `
            <div class="card-header">
                <h3>${data.name}</h3>
                <div class="card-controls">
                    <button class="edit-stats-btn" onclick="toggleStatEdit(this)" title="Edit character">✏️</button>
                    ${deleteButton}
                </div>
            </div>
            <img src="${data.specialImage}" alt="???" style="width: 100%; border-radius: 5px; margin: 10px 0;">
            <p>Origin: ${data.origin}</p>
            <p class="character-description" onclick="editDescription(this)">${data.description}</p>
            <div class="powers">
                ${data.powers.map(power => `
                    <div class="power-badge" onclick="editPower(this)">${power}</div>
                `).join('')}
                <button class="add-power-btn" onclick="addPower(this)" title="Add new power">+</button>
            </div>
            <div class="health-bar">
                <div class="health-progress" style="width: 100%"></div>
            </div>
            <div class="stats-display">
                <p>HP: <span class="stat-value">${formatStat(data.health)}</span>/${formatStat(data.health)} | 
                   ATK: <span class="stat-value">${formatStat(data.attack)}</span> | 
                   DEF: <span class="stat-value">${formatStat(data.defense)}</span></p>
            </div>
            <div class="stats-edit" style="display: none;">
                <div class="stat-input-group">
                    <label>HP:</label>
                    <input type="number" class="stat-input" data-stat="health" value="${data.health === Infinity ? 999999999 : data.health}" min="0.1">
                </div>
                <div class="stat-input-group">
                    <label>ATK:</label>
                    <input type="number" class="stat-input" data-stat="attack" value="${data.attack}" min="0.1">
                </div>
                <div class="stat-input-group">
                    <label>DEF:</label>
                    <input type="number" class="stat-input" data-stat="defense" value="${data.defense}" min="0.1">
                </div>
                <div class="damage-range">
                    <label>Damage Range:</label>
                    <div class="range-inputs">
                        <input type="number" class="stat-input" data-stat="minDamage" value="${data.minDamage || data.attack * 0.8}" min="0.1">
                        <span>to</span>
                        <input type="number" class="stat-input" data-stat="maxDamage" value="${data.maxDamage || data.attack * 1.2}" min="0.1">
                    </div>
                </div>
                <button class="save-stats-btn" onclick="saveStats(this)">Save Stats</button>
            </div>
        `;
        
        teamContainer.appendChild(card);
        return;
    }

    // Format stats - handle Infinity and large numbers
    const formatStat = (stat) => {
        if (stat === Infinity || stat === 999) return '∞';
        return Math.round(stat).toLocaleString();
    };
    
    const health = formatStat(data.health);
    const attack = formatStat(data.attack);
    const defense = formatStat(data.defense);

    // Add description and edit button
    card.innerHTML = `
        <div class="card-header">
            <h3 onclick="editCardText(this, 'name')" class="editable-text">${data.name}</h3>
            <div class="card-controls">
                <button class="edit-stats-btn" onclick="toggleStatEdit(this)" title="Edit character">✏️</button>
                ${deleteButton}
            </div>
        </div>
        <p class="origin-text">Origin: <span onclick="editCardText(this, 'origin')" class="editable-text">${data.origin}</span></p>
        <p class="character-description" onclick="editDescription(this)">${data.description || ''}</p>
        <div class="powers">
            ${data.powers.map(power => `
                <div class="power-badge" onclick="editPower(this)">${power}</div>
            `).join('')}
            <button class="add-power-btn" onclick="addPower(this)" title="Add new power">+</button>
        </div>
        <div class="health-bar">
            <div class="health-progress" style="width: 100%"></div>
        </div>
        <div class="stats-display">
            <p>HP: <span class="stat-value">${health}</span>/${health} | 
               ATK: <span class="stat-value">${attack}</span> | 
               DEF: <span class="stat-value">${defense}</span></p>
        </div>
        <div class="stats-edit" style="display: none;">
            <div class="stat-input-group">
                <label>HP:</label>
                <input type="number" class="stat-input" data-stat="health" value="${data.health === Infinity ? 999999999 : data.health}" min="0.1">
            </div>
            <div class="stat-input-group">
                <label>ATK:</label>
                <input type="number" class="stat-input" data-stat="attack" value="${data.attack}" min="0.1">
            </div>
            <div class="stat-input-group">
                <label>DEF:</label>
                <input type="number" class="stat-input" data-stat="defense" value="${data.defense}" min="0.1">
            </div>
            <div class="damage-range">
                <label>Damage Range:</label>
                <div class="range-inputs">
                    <input type="number" class="stat-input" data-stat="minDamage" value="${data.minDamage || data.attack * 0.8}" min="0.1">
                    <span>to</span>
                    <input type="number" class="stat-input" data-stat="maxDamage" value="${data.maxDamage || data.attack * 1.2}" min="0.1">
                </div>
            </div>
            <button class="save-stats-btn" onclick="saveStats(this)">Save Stats</button>
        </div>
        ${data.name.toLowerCase().includes('gojo') ? '<div class="honored-one-timer"></div>' : ''}
    `;
    
    teamContainer.appendChild(card);
    
    // Initialize health bar color
    const healthProgress = card.querySelector('.health-progress');
    if (healthProgress) {
        if (data.health === Infinity || data.health === 999) {
            healthProgress.style.background = '#FFD700';
        } else {
            healthProgress.style.background = '#4CAF50';
        }
    }
}

function toggleStatEdit(button) {
    const card = button.closest('.character-card');
    const statsDisplay = card.querySelector('.stats-display');
    const statsEdit = card.querySelector('.stats-edit');
    
    if (statsDisplay.style.display !== 'none') {
        statsDisplay.style.display = 'none';
        statsEdit.style.display = 'block';
        button.textContent = '❌';
    } else {
        statsDisplay.style.display = 'block';
        statsEdit.style.display = 'none';
        button.textContent = '✏️';
    }
}

function saveStats(button) {
    const card = button.closest('.character-card');
    const characterName = card.querySelector('h3').textContent;
    const character = characters.find(c => c.name === characterName);
    
    if (!character) return;

    const inputs = card.querySelectorAll('.stat-input');
    inputs.forEach(input => {
        const stat = input.dataset.stat;
        let value = parseFloat(input.value);
        value = Math.max(0.1, value);

        if (value >= 999999999) {
            value = Infinity;
        }

        switch(stat) {
            case 'health':
                character.health = value;
                character.currentHealth = value;
                character.baseMaxHealth = value;
                break;
            case 'attack':
                character.attack = value;
                character.baseAttack = value;
                break;
            case 'defense':
                character.defense = value;
                character.baseDefense = value;
                break;
            case 'minDamage':
                character.minDamage = value;
                break;
            case 'maxDamage':
                character.maxDamage = value;
                break;
        }
    });

    updateHealthBar(character);
    toggleStatEdit(card.querySelector('.edit-stats-btn'));
}

function editPower(powerElement) {
    const originalText = powerElement.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'power-edit-input';
    
    input.onblur = function() {
        const newText = input.value.trim();
        if (newText && newText !== originalText) {
            // Update the power in the characters array
            const card = powerElement.closest('.character-card');
            const characterName = card.querySelector('h3').textContent;
            const character = characters.find(c => c.name === characterName);
            if (character) {
                const powerIndex = character.powers.indexOf(originalText);
                if (powerIndex !== -1) {
                    character.powers[powerIndex] = newText;
                }
            }
        }
        powerElement.textContent = newText || originalText;
    };

    input.onkeypress = function(e) {
        if (e.key === 'Enter') {
            input.blur();
        }
    };

    powerElement.textContent = '';
    powerElement.appendChild(input);
    input.focus();
}

function addPower(button) {
    const powersDiv = button.parentElement;
    const newPower = document.createElement('div');
    newPower.className = 'power-badge';
    newPower.textContent = 'New Power';
    newPower.onclick = function() { editPower(this); };
    powersDiv.insertBefore(newPower, button);

    // Update the character's powers array
    const card = button.closest('.character-card');
    const characterName = card.querySelector('h3').textContent;
    const character = characters.find(c => c.name === characterName);
    if (character) {
        character.powers.push('New Power');
    }
}

function editDescription(descElement) {
    const originalText = descElement.textContent;
    const textarea = document.createElement('textarea');
    textarea.value = originalText;
    textarea.className = 'description-edit-area';
    
    textarea.onblur = function() {
        const newText = textarea.value.trim();
        if (newText) {
            descElement.textContent = newText;
            // Update the character's description
            const card = descElement.closest('.character-card');
            const characterName = card.querySelector('h3').textContent;
            const character = characters.find(c => c.name === characterName);
            if (character) {
                character.description = newText;
            }
        } else {
            descElement.textContent = originalText;
        }
    };

    descElement.textContent = '';
    descElement.appendChild(textarea);
    textarea.focus();
}

function editTeamName(team) {
    const teamHeader = document.querySelector(`#${team}Team .team-header h2`);
    const currentName = teamHeader.textContent;
    
    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'team-name-input';
    input.maxLength = 20; // Limit name length
    
    // Replace h2 with input
    teamHeader.replaceWith(input);
    input.focus();
    input.select();
    
    // Handle saving the new name
    const saveNewName = () => {
        const newName = input.value.trim() || currentName;
        const newH2 = document.createElement('h2');
        newH2.textContent = newName;
        input.replaceWith(newH2);
        
        // Update team name in battle logs
        const logEntries = document.querySelectorAll('.log-entry');
        logEntries.forEach(entry => {
            entry.innerHTML = entry.innerHTML.replace(
                new RegExp(`(${team.toUpperCase()} TEAM)`),
                newName.toUpperCase()
            );
        });
    };
    
    // Save on enter or blur
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveNewName();
            e.preventDefault();
        }
    });
    
    input.addEventListener('blur', saveNewName);
}

function resetBattle() {
    characters = [];
    currentTeam = 'red';
    document.getElementById('redTeam').innerHTML = `
        <div class="team-header">
            <h2>Team Red</h2>
            <button onclick="editTeamName('red')" class="edit-team-name">✏️</button>
        </div>
    `;
    document.getElementById('blueTeam').innerHTML = `
        <div class="team-header">
            <h2>Team Blue</h2>
            <button onclick="editTeamName('blue')" class="edit-team-name">✏️</button>
        </div>
    `;
    document.getElementById('battleLog').innerHTML = '';
    document.getElementById('fightButton').disabled = false;
}

function deleteCharacter(button) {
    const card = button.closest('.character-card');
    const characterName = card.querySelector('h3').textContent;
    const teamContainer = card.closest('.team');
    const team = teamContainer.id.replace('Team', '');

    // Remove character from the characters array
    const index = characters.findIndex(c => c.name === characterName && c.team === team);
    if (index !== -1) {
        characters.splice(index, 1);
    }

    // Remove the card from the DOM with a fade out effect
    card.style.transition = 'opacity 0.3s ease';
    card.style.opacity = '0';
    setTimeout(() => card.remove(), 300);
}

function updateHealthBar(character) {
    const characterCard = document.querySelector(`.character-card:has(h3:contains("${character.name}"))`);
    if (characterCard) {
        const healthBar = characterCard.querySelector('.health-progress');
        if (healthBar) {
            const healthPercentage = (character.currentHealth / character.baseMaxHealth) * 100;
            healthBar.style.width = `${healthPercentage}%`;
        }
    }
}

function editCardText(element, type) {
    const originalText = type === 'name' ? element.textContent : element.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = type === 'origin' ? originalText.replace('Origin: ', '') : originalText;
    input.className = 'card-text-input';
    
    // Add any validation needed for names
    if (type === 'name') {
        input.maxLength = 50;
    }
    
    input.onblur = function() {
        const newText = input.value.trim();
        if (newText && newText !== (type === 'origin' ? originalText.replace('Origin: ', '') : originalText)) {
            // Get the character from the characters array
            const card = element.closest('.character-card');
            const currentName = type === 'name' ? originalText : card.querySelector('h3').textContent;
            const character = characters.find(c => c.name === currentName);
            
            if (character) {
                if (type === 'name') {
                    character.name = newText;
                    element.textContent = newText;
                } else if (type === 'origin') {
                    character.origin = newText;
                    element.textContent = newText;
                }
            }
        } else {
            if (type === 'origin') {
                element.textContent = originalText.replace('Origin: ', '');
            } else {
                element.textContent = originalText;
            }
        }
    };

    input.onkeypress = function(e) {
        if (e.key === 'Enter') {
            input.blur();
        }
    };

    if (type === 'origin') {
        element.textContent = '';
    } else {
        element.textContent = '';
    }
    element.appendChild(input);
    input.focus();
}