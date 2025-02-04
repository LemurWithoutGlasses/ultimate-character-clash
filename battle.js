let gojoHonoredOneAudio = null;
let malevonentShrineAudio = null;

function getPowerEffect(powerName) {
    const lowerPower = powerName.toLowerCase();
    
    // Special handling for ROBLOX respawn ability
    if (lowerPower === 'pacifist: respawn') {
        return { type: 'respawn', multiplier: 2 };
    }
    
    // Special handling for Mahoraga's adapt ability
    if (lowerPower === 'adapt') {
        return { type: 'adapt', multiplier: 2 };
    }
    
    for (const [keyword, effect] of Object.entries(POWER_EFFECTS)) {
        if (lowerPower.includes(keyword)) return effect;
    }
    return { type: 'special', multiplier: 1.2 };
}

async function startBattle() {
    const log = document.getElementById('battleLog');
    const fightButton = document.getElementById('fightButton');
    
    // Add null checks for DOM elements
    if (!log || !fightButton) {
        console.error('Required DOM elements not found');
        return;
    }

    // Check for minimum characters
    if (!characters.length || characters.length < 2) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'log-entry';
        errorMsg.style.background = '#ff4444';
        errorMsg.innerHTML = '⚠️ Need at least 2 characters to start a battle!';
        log.appendChild(errorMsg);
        return;
    }

    // Disable fight button
    fightButton.disabled = true;
    log.innerHTML = '';

    try {
        // Reset any existing honored one timers and transformations
        characters.forEach(char => {
            if (char.honoredOneTimer) {
                clearInterval(char.honoredOneTimer);
                char.honoredOneTimer = null;
            }
            char.honoredOneActive = false; // Reset honored one state
            // Reset any UI transformations
            if (char.isUIGoku) {
                char.hasTransformed = false;
            }
        });

        // Check for Prison Realm's first move at the start of battle
        const prisonRealm = characters.find(c => c && c.isPrisonRealm && !c.hasUsedSeal);
        if (prisonRealm) {
            const defenders = characters.filter(c => c && c.team !== prisonRealm.team);
            
            // Create sealing effect log
            const sealLog = document.createElement('div');
            sealLog.className = 'log-entry seal-effect';
            sealLog.innerHTML = `
                🔮 <span style="color: ${prisonRealm.team === 'red' ? '#ff4444' : '#4444ff'}">
                ${prisonRealm.name}</span> activates its sealing technique! 🔮
            `;
            log.appendChild(sealLog);
            
            // Create sealing animation overlay
            const sealOverlay = document.createElement('div');
            sealOverlay.className = 'seal-overlay';
            document.body.appendChild(sealOverlay);

            await new Promise(r => setTimeout(r, 2000));

            // Seal all opponents
            for (const defender of defenders) {
                // Create sealing effect for each opponent
                const sealedLog = document.createElement('div');
                sealedLog.className = 'log-entry sealed-effect';
                sealedLog.innerHTML = `
                    ⚡ <span style="color: ${defender.team === 'red' ? '#ff4444' : '#4444ff'}">
                    ${defender.name}</span> has been sealed away! ⚡
                `;
                log.appendChild(sealedLog);

                // Find defender's card and apply sealed effect
                const defenderCard = document.querySelector(`.character-card:has(h3:contains('${defender.name}')`);
                if (defenderCard) {
                    defenderCard.classList.add('sealed');
                }

                defender.currentHealth = 0.1;
                updateHealthBar(defender);
                await new Promise(r => setTimeout(r, 1000));
            }

            // Remove sealing overlay
            setTimeout(() => {
                if (sealOverlay.parentNode) {
                    document.body.removeChild(sealOverlay);
                }
            }, 3000);

            prisonRealm.hasUsedSeal = true;
            
            // End battle since Prison Realm has sealed everyone
            const victoryMsg = document.createElement('div');
            victoryMsg.className = 'log-entry victory-effect';
            victoryMsg.innerHTML = `🏆 ${prisonRealm.name} seals the victory! 🏆`;
            log.appendChild(victoryMsg);
            
            return; // End battle after sealing
        }

        while (characters.filter(c => c && c.currentHealth > 0.1).length > 1) {
            const attackers = characters.filter(c => c && c.currentHealth > 0.1);
            if (!attackers.length) break;
            
            const attacker = attackers[Math.floor(Math.random() * attackers.length)];
            if (!attacker) break;

            const defenders = attackers.filter(c => c && c.team !== attacker.team && c.currentHealth > 0.1);
            if (!defenders.length) break;

            // Special case: Gojo refusing to attack Geto
            if (attacker.name.toLowerCase().includes('gojo')) {
                const nonGetoDefenders = defenders.filter(d => !d.name.toLowerCase().includes('geto'));
                
                if (defenders.length !== nonGetoDefenders.length) {
                    // There is a Geto in the defenders
                    const refusalLog = document.createElement('div');
                    refusalLog.className = 'log-entry';
                    refusalLog.style.background = '#2a2a2a';
                    refusalLog.style.border = '2px solid #00ffff';
                    refusalLog.innerHTML = `
                        💔 <span style="color: #00ffff">${attacker.name} refuses to attack Geto...</span> 💔
                    `;
                    log.appendChild(refusalLog);
                    await new Promise(r => setTimeout(r, 1500));
                    continue;
                }
            }

            const defender = defenders[Math.floor(Math.random() * defenders.length)];
            if (!defender) break;

            // Check for Chara's SAVE ability
            if (defender.name === 'Chara' && 
                defender.currentHealth <= 100 && 
                defender.currentHealth > 0.1 && 
                !defender.hasSaved) {
                
                defender.hasSaved = true; // Can only use once per battle
                
                // Create save point overlay and icon
                const saveOverlay = document.createElement('div');
                saveOverlay.className = 'save-overlay';
                document.body.appendChild(saveOverlay);
                
                const saveIcon = document.createElement('img');
                saveIcon.src = '/hsc17w3p1tb91-removebg-preview.png';
                saveIcon.className = 'save-icon';
                document.body.appendChild(saveIcon);
                
                // Play save point sound
                const saveSound = new Audio('/savepoint.mp3');
                saveSound.volume = 0.7;
                saveSound.play().catch(err => console.log('Audio playback failed:', err));
                
                // Create save effect log
                const saveLog = document.createElement('div');
                saveLog.className = 'log-entry save-effect';
                saveLog.innerHTML = `
                    💫 <span style="color: #ffff00">${defender.name}'s DETERMINATION activates!</span>
                    The power of SAVE fills you with determination! 💫
                `;
                log.appendChild(saveLog);
                
                // Boost Chara's stats by 1.5x
                defender.attack *= 1.5;
                defender.defense *= 1.5;
                defender.health *= 1.5;
                
                // Heal Chara and team to full
                const teammates = characters.filter(c => c && c.team === defender.team);
                teammates.forEach(teammate => {
                    teammate.currentHealth = teammate.health;
                    updateHealthBar(teammate);
                    
                    const healLog = document.createElement('div');
                    healLog.className = 'log-entry save-effect';
                    healLog.innerHTML = `
                        ✨ <span style="color: #ffff00">${teammate.name}</span> 
                        has been fully restored by DETERMINATION! ✨
                    `;
                    log.appendChild(healLog);
                });
                
                // Remove overlay and icon after animation
                setTimeout(() => {
                    if (saveOverlay.parentNode) {
                        document.body.removeChild(saveOverlay);
                    }
                    if (saveIcon.parentNode) {
                        document.body.removeChild(saveIcon);
                    }
                }, 2000);
                
                await new Promise(r => setTimeout(r, 2500));
                continue;
            }

            // Special case for Saitama as attacker
            if (attacker.name.toLowerCase() === 'saitama') {
                defender.currentHealth = 0.1;
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry';
                logEntry.innerHTML = `
                    <span style="color: ${attacker.team === 'red' ? '#ff4444' : '#4444ff'}">${attacker.name}</span>
                    unleashes One Punch on
                    <span style="color: ${defender.team === 'red' ? '#ff4444' : '#4444ff'}">${defender.name}</span>
                    for <span class="critical-effect">∞ damage!</span>
                `;
                log.appendChild(logEntry);
                updateHealthBar(defender);
                await new Promise(r => setTimeout(r, 1500));
                continue;
            }

            // Special case for Saitama as defender
            if (defender.name.toLowerCase() === 'saitama') {
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry';
                logEntry.innerHTML = `
                    <span style="color: ${attacker.team === 'red' ? '#ff4444' : '#4444ff'}">${attacker.name}</span>
                    attacks
                    <span style="color: ${defender.team === 'red' ? '#ff4444' : '#4444ff'}">${defender.name}</span>
                    but it has no effect!
                `;
                log.appendChild(logEntry);
                await new Promise(r => setTimeout(r, 1500));
                continue;
            }

            // Handle Goku's transformation to UI
            if (defender.name === 'Goku' && defender.currentHealth <= 0.1 && !defender.hasTransformed) {
                defender.hasTransformed = true;
                defender.name = 'UI Goku';
                defender.attack = 1;
                defender.defense = 999999;
                defender.health = 9999;
                defender.currentHealth = defender.health;
                defender.powers = [...(defender.powers || []), 'Pacifist: Ultra Instinct'];
                
                const transformLog = document.createElement('div');
                transformLog.className = 'log-entry transform-effect';
                transformLog.innerHTML = `
                    ⚡ <span style="color: #00ffff">${defender.name} has transformed into Ultra Instinct!</span>
                    Greatly increasing defense but losing offensive power! ⚡
                `;
                log.appendChild(transformLog);
                
                // Update the character card to show the transformation
                updateCharacterCard(defender);
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            // Check for Gojo's Honored One activation - only check once when health drops below 50%
            if (defender.name.toLowerCase().includes('gojo') && 
                defender.currentHealth <= defender.health * 0.5 && 
                defender.currentHealth > 0.1 && 
                !defender.honoredOneActive &&
                !defender.hasTriggeredHonoredOne) { // New flag to ensure it only triggers once
                
                defender.hasTriggeredHonoredOne = true; // Set flag
                
                // Create and animate the sorcerer icon
                const sorcererIcon = document.createElement('img');
                sorcererIcon.src = '/SorcererIcon.png';
                sorcererIcon.className = 'sorcerer-icon';
                document.body.appendChild(sorcererIcon);
                
                // Add a background overlay
                const blueOverlay = document.createElement('div');
                blueOverlay.className = 'gojo-honored-overlay';
                document.body.appendChild(blueOverlay);
                
                // Trigger the animations
                sorcererIcon.style.animation = 'sorcererIconEffect 2s forwards';
                
                // Remove the elements after animation
                setTimeout(() => {
                    document.body.removeChild(sorcererIcon);
                    document.body.removeChild(blueOverlay);
                }, 2000);
                
                // Play Honored One theme
                if (gojoHonoredOneAudio) {
                    gojoHonoredOneAudio.pause();
                    gojoHonoredOneAudio = null;
                }
                gojoHonoredOneAudio = new Audio('/gojo-satoru-the-honored-one-jujutsu-kaisen-season-2-ost-made-with-Voicemod.mp3');
                gojoHonoredOneAudio.volume = 0.7;
                gojoHonoredOneAudio.loop = true;
                gojoHonoredOneAudio.play().catch(err => console.log('Audio playback failed:', err));
                
                defender.honoredOneActive = true;
                defender.preBoostStats = {
                    attack: defender.attack,
                    defense: defender.defense,
                    health: defender.health,
                    currentHealth: defender.currentHealth
                };
                
                // Apply power boost
                defender.attack *= 2.5;
                defender.defense *= 2.5;
                defender.health *= 2;
                defender.currentHealth = Math.round((defender.currentHealth / defender.preBoostStats.health) * defender.health);
                
                // Add visual effects to Gojo's card
                const gojoCard = document.querySelector(`.character-card`);
                if (gojoCard && gojoCard.querySelector('h3').textContent.toLowerCase().includes('gojo')) {
                    gojoCard.classList.add('honored-one-active');
                }
                
                const honoredLog = document.createElement('div');
                honoredLog.className = 'log-entry honored-one-effect';
                honoredLog.innerHTML = `
                    ⚡ <span style="color: #00ffff">${defender.name} unleashes Unlimited Void!</span>
                    Greatly boosting all stats! ⚡
                `;
                log.appendChild(honoredLog);
                
                // Start the timer
                let timeLeft = 30;
                const timerElem = document.querySelector(`.honored-one-timer`);
                
                if (defender.honoredOneTimer) {
                    clearInterval(defender.honoredOneTimer);
                }
                
                defender.honoredOneTimer = setInterval(() => {
                    if (!timerElem || timeLeft <= 0) {
                        clearInterval(defender.honoredOneTimer);
                        defender.honoredOneActive = false;
                        
                        // Stop the Honored One theme
                        if (gojoHonoredOneAudio) {
                            gojoHonoredOneAudio.pause();
                            gojoHonoredOneAudio = null;
                        }
                        
                        // Restore original stats
                        if (defender.preBoostStats) {
                            defender.attack = defender.preBoostStats.attack;
                            defender.defense = defender.preBoostStats.defense;
                            defender.health = defender.preBoostStats.health;
                            defender.currentHealth = Math.round((defender.currentHealth / (defender.preBoostStats.health * 2)) * defender.preBoostStats.health);
                        }
                        
                        if (timerElem) {
                            timerElem.textContent = '';
                        }
                        
                        // Remove the visual effects
                        const gojoCard = document.querySelector(`.character-card`);
                        if (gojoCard && gojoCard.querySelector('h3').textContent.toLowerCase().includes('gojo')) {
                            gojoCard.classList.remove('honored-one-active');
                        }
                        
                        const expireLog = document.createElement('div');
                        expireLog.className = 'log-entry';
                        expireLog.innerHTML = `${defender.name}'s Unlimited Void has expired!`;
                        log.appendChild(expireLog);
                        
                        updateHealthBar(defender);
                    } else {
                        timerElem.textContent = `Unlimited Void: ${timeLeft}s`;
                        timeLeft--;
                    }
                }, 1000);
                
                updateHealthBar(defender);
                await new Promise(r => setTimeout(r, 1500));
            }

            // Check for Sukuna's Malevolent Shrine - only check when not already active
            if (attacker.name.toLowerCase().includes('sukuna') && 
                Math.random() < 0.2 && 
                !attacker.malevolentShrineActive) {
                
                attacker.malevolentShrineActive = true;
                
                // Create and animate the Malevolent Shrine overlay
                const shrineOverlay = document.createElement('div');
                shrineOverlay.className = 'malevolent-shrine-overlay';
                shrineOverlay.innerHTML = `
                    <img src="/malevolent-shrine-jujutsu-kaisen.gif" alt="Malevolent Shrine">
                `;
                document.body.appendChild(shrineOverlay);
                
                // Play Malevolent Shrine theme
                if (malevonentShrineAudio) {
                    malevonentShrineAudio.pause();
                    malevonentShrineAudio = null;
                }
                malevonentShrineAudio = new Audio('/malevolent-shrine-made-with-Voicemod.mp3');
                malevonentShrineAudio.volume = 0.7;
                malevonentShrineAudio.loop = true;
                malevonentShrineAudio.play().catch(err => console.log('Audio playback failed:', err));

                const shrineLog = document.createElement('div');
                shrineLog.className = 'log-entry shrine-effect';
                shrineLog.innerHTML = `
                    🔮 <span style="color: ${attacker.team === 'red' ? '#ff4444' : '#4444ff'}">${attacker.name}</span>
                    unleashes Malevolent Shrine! Activating Domain Expansion! 🔮
                `;
                log.appendChild(shrineLog);
                
                let shrineTimer = 0;
                const shrineDamageInterval = setInterval(() => {
                    // Check if Sukuna is dead
                    if (attacker.currentHealth <= 0.1) {
                        clearInterval(shrineDamageInterval);
                        if (shrineOverlay.parentNode) {
                            document.body.removeChild(shrineOverlay);
                        }
                        if (malevonentShrineAudio) {
                            malevonentShrineAudio.pause();
                            malevonentShrineAudio = null;
                        }
                        attacker.malevolentShrineActive = false;
                        return;
                    }

                    // Check if 20 seconds have passed
                    if (shrineTimer >= 20) {
                        clearInterval(shrineDamageInterval);
                        if (shrineOverlay.parentNode) {
                            document.body.removeChild(shrineOverlay);
                        }
                        if (malevonentShrineAudio) {
                            malevonentShrineAudio.pause();
                            malevonentShrineAudio = null;
                        }
                        attacker.malevolentShrineActive = false;
                        return;
                    }
                    
                    // Get current live opponents
                    const currentDefenders = characters.filter(c => c && c.team !== attacker.team && c.currentHealth > 0.1);
                    
                    // Apply damage to all current opponents
                    currentDefenders.forEach(opponent => {
                        if (opponent.currentHealth > 0.1) {
                            const shrineDamage = Math.floor(attacker.attack * 0.15);
                            opponent.currentHealth = Math.max(0.1, opponent.currentHealth - shrineDamage);
                            updateHealthBar(opponent);
                            
                            const damageLog = document.createElement('div');
                            damageLog.className = 'log-entry shrine-damage';
                            damageLog.innerHTML = `
                                💀 Malevolent Shrine slashes <span style="color: ${opponent.team === 'red' ? '#ff4444' : '#4444ff'}">${opponent.name}</span> 
                                for <span class="critical-effect">${shrineDamage} damage!</span> 💀
                            `;
                            log.appendChild(damageLog);
                        }
                    });
                    
                    shrineTimer++;
                }, 1000);
                
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            // Add special case for Medusa's petrification
            if (attacker.name.toLowerCase().includes('medusa') && Math.random() < 0.3) {
                const petrifyLog = document.createElement('div');
                petrifyLog.className = 'log-entry petrify-effect';
                petrifyLog.innerHTML = `
                    🗿 <span style="color: ${attacker.team === 'red' ? '#ff4444' : '#4444ff'}">${attacker.name}</span>
                    turns
                    <span style="color: ${defender.team === 'red' ? '#ff4444' : '#4444ff'}">${defender.name}</span>
                    to stone! 🗿
                `;
                log.appendChild(petrifyLog);
                
                // Find defender's card and apply stone effect
                const defenderCard = document.querySelector(`#${defender.team}Team .character-card`);
                if (defenderCard) {
                    defenderCard.classList.add('petrified');
                }
                
                defender.currentHealth = 0.1;
                updateHealthBar(defender);
                await new Promise(r => setTimeout(r, 1500));
                continue;
            }

            // Check for Colossal Titan's first move
            if (attacker.name === "Colossal Titan" && !attacker.hasUsedTransformation) {
                attacker.hasUsedTransformation = true;
                
                // Reduce defender's stats by 25%
                defender.attack *= 0.75;
                defender.defense *= 0.75;
                defender.health *= 0.75;
                defender.currentHealth = Math.min(defender.currentHealth, defender.health);
                
                const transformLog = document.createElement('div');
                transformLog.className = 'log-entry transform-effect';
                transformLog.innerHTML = `
                    ☢️ <span style="color: ${attacker.team === 'red' ? '#ff4444' : '#4444ff'}">${attacker.name}</span>
                    unleashes Atomic Transformation on
                    <span style="color: ${defender.team === 'red' ? '#ff4444' : '#4444ff'}">${defender.name}</span>,
                    reducing their stats by 25%! ☢️
                `;
                log.appendChild(transformLog);
                
                updateHealthBar(defender);
                await new Promise(r => setTimeout(r, 1500));
                continue;
            }

            // Handle Thanos's snap ability
            if (attacker.name === 'Thanos' && Math.random() < 0.25) {  
                const defenders = characters.filter(c => c && c.team !== attacker.team && c.currentHealth > 0.1);
                if (!defenders.length) continue;

                // Play snap sound effect
                const snapSound = new Audio('/thanos-snap-sound-effect.mp3');
                snapSound.volume = 0.7;
                snapSound.play().catch(err => console.log('Audio playback failed:', err));

                // Create snap flash effect
                const snapOverlay = document.createElement('div');
                snapOverlay.className = 'snap-flash-overlay';
                document.body.appendChild(snapOverlay);

                // Remove overlay after animation
                setTimeout(() => {
                    if (snapOverlay.parentNode) {
                        document.body.removeChild(snapOverlay);
                    }
                }, 3000);

                // Create snap effect log
                const snapLog = document.createElement('div');
                snapLog.className = 'log-entry snap-effect';
                snapLog.innerHTML = `
                    💫 <span style="color: ${attacker.team === 'red' ? '#ff4444' : '#4444ff'}">${attacker.name}</span>
                    snaps his fingers with the Infinity Gauntlet! 💫
                `;
                log.appendChild(snapLog);

                // Thanos loses health from using the snap
                attacker.currentHealth = Math.max(0.1, attacker.currentHealth - 40);
                updateHealthBar(attacker);

                if (defenders.length === 1) {
                    // If only one defender, reduce their stats by 95%
                    const defender = defenders[0];
                    defender.attack *= 0.05;
                    defender.defense *= 0.05;
                    defender.currentHealth = Math.max(1, Math.floor(defender.currentHealth * 0.05));
                    
                    const reduceLog = document.createElement('div');
                    reduceLog.className = 'log-entry snap-single-effect';
                    reduceLog.innerHTML = `
                        🌌 <span style="color: ${defender.team === 'red' ? '#ff4444' : '#4444ff'}">${defender.name}</span>
                        is devastated by the snap, losing 95% of their power! 🌌
                    `;
                    log.appendChild(reduceLog);
                    updateHealthBar(defender);
                } else {
                    // Randomly eliminate half of the defenders
                    const eliminateCount = Math.ceil(defenders.length / 2);
                    const shuffled = defenders.sort(() => Math.random() - 0.5);
                    const eliminated = shuffled.slice(0, eliminateCount);

                    eliminated.forEach(defender => {
                        defender.currentHealth = 0.1;
                        updateHealthBar(defender);
                    });

                    const snapVictimsLog = document.createElement('div');
                    snapVictimsLog.className = 'log-entry snap-multi-effect';
                    snapVictimsLog.innerHTML = `
                        🌌 ${eliminated.map(d => 
                            `<span style="color: ${d.team === 'red' ? '#ff4444' : '#4444ff'}">${d.name}</span>`
                        ).join(', ')} turned to dust! 🌌
                    `;
                    log.appendChild(snapVictimsLog);
                }

                await new Promise(r => setTimeout(r, 3500));
                continue;
            }

            let damage = 0;
            let effect = null;
            let usedPower = null;

            // Store defender's initial health to check for adaptation trigger
            const initialHealth = defender.currentHealth;

            // Check for ROBLOX respawn
            if (defender.isRoblox && !defender.hasRespawned && defender.currentHealth < defender.health * 0.5) {
                defender.hasRespawned = true;
                defender.currentHealth = defender.health;
                defender.attack = defender.baseAttack * 2;
                
                const respawnLog = document.createElement('div');
                respawnLog.className = 'log-entry respawn-effect';
                respawnLog.innerHTML = `
                    ⭐ <span style="color: ${defender.team === 'red' ? '#ff4444' : '#4444ff'}">${defender.name}</span>
                    has respawned with double damage! ⭐
                `;
                log.appendChild(respawnLog);
                updateHealthBar(defender);
                await new Promise(r => setTimeout(r, 1500));
                continue;
            }

            if (Math.random() < POWER_PROBABILITY && attacker.powers?.length) {
                usedPower = attacker.powers[Math.floor(Math.random() * attacker.powers.length)];
                effect = getPowerEffect(usedPower);
            }

            if (effect?.type === 'heal') {
                const healAmount = Math.round(attacker.attack * effect.multiplier * 100) / 100;
                attacker.currentHealth = Math.min(attacker.health, attacker.currentHealth + healAmount);
                damage = -healAmount;
            } else {
                const baseDamage = attacker.attack - (defender.defense * 0.5);
                damage = Math.max(0.1, 
                    Math.round((baseDamage + Math.floor(Math.random() * 10)) * 
                    (effect?.multiplier || 1) * 100) / 100
                );
                if (effect?.type === 'stun') {
                    damage *= 2;
                }
                defender.currentHealth = Math.max(0.1, defender.currentHealth - damage);
            }

            // Add Sans dodge check before damage calculation
            if (defender.name === 'Sans' && Math.random() < defender.dodgeRate) {
                const dodgeLog = document.createElement('div');
                dodgeLog.className = 'log-entry';
                dodgeLog.style.background = '#000';
                dodgeLog.style.color = '#00ffff';
                dodgeLog.innerHTML = `
                    ⚡ <span style="text-shadow: 0 0 5px #00ffff">${defender.name} dodged the attack!</span> ⚡
                `;
                log.appendChild(dodgeLog);
                await new Promise(r => setTimeout(r, 1500));
                continue;
            } else if (defender.name === 'Sans') {
                // If Sans fails to dodge, set health to minimal value instead of 1
                defender.currentHealth = 0.1;
                const failedDodgeLog = document.createElement('div');
                failedDodgeLog.className = 'log-entry';
                failedDodgeLog.style.background = '#660000';
                failedDodgeLog.innerHTML = `
                    💔 <span style="color: #ff4444">${defender.name} failed to dodge!</span> 💔
                `;
                log.appendChild(failedDodgeLog);
                updateHealthBar(defender);
                await new Promise(r => setTimeout(r, 1500));
                continue;
            }

            // Check for Mahoraga's adaptation
            if (defender.name.toLowerCase().includes('mahoraga') && 
                defender.currentHealth < initialHealth && 
                defender.currentHealth > 0.1) {
                
                // Create and animate the dharmachakra icon
                const dharmachakraIcon = document.createElement('img');
                dharmachakraIcon.src = '/noFilter.png';
                dharmachakraIcon.className = 'dharmachakra-icon';
                document.body.appendChild(dharmachakraIcon);
                
                // Trigger the animation
                dharmachakraIcon.style.animation = 'dharmachakraEffect 2s forwards';
                
                // Remove the icon after animation
                setTimeout(() => {
                    document.body.removeChild(dharmachakraIcon);
                }, 2000);

                // Play the adaptation sound after 0.5 seconds
                setTimeout(() => {
                    const adaptSound = new Audio('/mahoraga-adapting-made-with-Voicemod.mp3');
                    adaptSound.volume = 0.7; // Set volume to 70%
                    adaptSound.play().catch(err => console.log('Audio playback failed:', err));
                }, 500);
                
                defender.defense *= 2;
                defender.adaptCount++;
                
                const adaptLog = document.createElement('div');
                adaptLog.className = 'log-entry adapt-effect';
                adaptLog.innerHTML = `
                    🔄 <span style="color: #00ffff">${defender.name} adapts</span> and doubles their defense! 
                    (${defender.adaptCount}x adaptation) 🔄
                `;
                log.appendChild(adaptLog);
                updateHealthBar(defender);
                await new Promise(r => setTimeout(r, 1000));
            }

            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${effect?.type === 'heal' ? 'healing-effect' : ''}`;
            
            let actionText = '';
            if (usedPower) {
                actionText = `<span style="color: #ffdd00">uses ${usedPower}</span> and `;
                if (effect.type === 'heal') {
                    actionText += `<span style="color: #4CAF50">heals themselves for ${-damage} HP!</span>`;
                } else {
                    actionText += `hits`;
                }
            }

            logEntry.innerHTML = `
                <span style="color: ${attacker.team === 'red' ? '#ff4444' : '#4444ff'}">${attacker.name}</span>
                ${actionText || 'attacks'} 
                <span style="color: ${defender.team === 'red' ? '#ff4444' : '#4444ff'}">${defender.name}</span>
                ${usedPower && effect.type !== 'heal' ? `for <span class="critical-effect">${damage} damage!</span>` : ''}
            `;

            log.appendChild(logEntry);
            
            if (effect?.type === 'heal') {
                updateHealthBar(attacker);
            } else {
                updateHealthBar(defender);
            }

            await new Promise(r => setTimeout(r, 1500));
        }

        const winner = characters.find(c => c && c.currentHealth > 0.1);  // Add null check in find
        if (winner) {
            const teamHeader = document.querySelector(`#${winner.team}Team .team-header h2`);
            if (teamHeader) {  // Add null check for team header
                const winningTeamName = teamHeader.textContent;
                const victoryMsg = document.createElement('div');
                victoryMsg.className = 'log-entry';
                victoryMsg.style.background = '#4CAF50';
                victoryMsg.innerHTML = `🏆 ${winner.name} (${winningTeamName.toUpperCase()}) VICTORY! 🏆`;
                log.appendChild(victoryMsg);
            }
        }

    } catch (error) {
        console.error('Battle error:', error);
        // Re-enable fight button on error
        fightButton.disabled = false;
        
        // Show error message in battle log
        const errorMsg = document.createElement('div');
        errorMsg.className = 'log-entry';
        errorMsg.style.background = '#ff4444';
        errorMsg.innerHTML = '⚠️ An error occurred during battle. Please try again.';
        log.appendChild(errorMsg);
    }
}

function updateHealthBar(character) {
    if (!character) return;
    
    const teamElem = document.getElementById(character.team + 'Team');
    if (!teamElem) return;
    
    const cards = teamElem.getElementsByClassName('character-card');
    let targetCard = null;
    
    // Find the correct character card
    for (const card of cards) {
        const nameElem = card.querySelector('h3');
        if (!nameElem) continue;
        
        if (nameElem.textContent === character.name) {
            targetCard = card;
            break;
        }
    }
    
    if (!targetCard) return;

    const healthProgress = targetCard.querySelector('.health-progress');
    const statsText = targetCard.querySelector('p:last-child');
    
    if (healthProgress && statsText) {
        // Special handling for Lemur and infinite health
        const isSpecialHealth = character.health >= 1000000 || 
                              character.health === Infinity || 
                              character.name === 'Lemur';
        
        if (isSpecialHealth) {
            healthProgress.style.width = '100%';
            healthProgress.style.background = character.name === 'Lemur' 
                ? 'linear-gradient(90deg, #ff00ff, #ff69b4)'
                : 'linear-gradient(90deg, #FFD700, #FFA500)';
        } else {
            // Calculate health percentage
            const healthPercent = Math.max(0, Math.min(100, (character.currentHealth / character.health) * 100));
            healthProgress.style.width = `${healthPercent}%`;
            
            // Update health bar color based on percentage
            if (healthPercent <= 25) {
                healthProgress.style.background = '#ff4444';
            } else if (healthPercent <= 50) {
                healthProgress.style.background = '#ffbb33';
            } else {
                healthProgress.style.background = '#4CAF50';
            }
        }
        
        // Format stats for display
        const formatStat = (stat) => {
            if (stat === Infinity) return '∞';
            if (stat >= 1000000) return '1M+';
            if (stat >= 100000) return `${Math.floor(stat/1000)}K`;
            if (stat >= 10000) return `${(stat/1000).toFixed(1)}K`;
            if (stat >= 1000) return `${Math.floor(stat/1000)}K`;
            return Math.round(stat).toLocaleString();
        };
        
        // Update stats text with current values
        statsText.innerHTML = `
            HP: <span style="color: ${character.currentHealth < character.health * 0.25 ? '#ff4444' : '#4CAF50'}">
                ${formatStat(character.currentHealth)}/${formatStat(character.health)}
            </span> | 
            ATK: ${formatStat(character.attack)} | 
            DEF: ${formatStat(character.defense)}
        `;
    }
}

function updateCharacterCard(character) {
    const teamContainer = document.getElementById(character.team + 'Team');
    if (!teamContainer) return;
    
    const cards = teamContainer.getElementsByClassName('character-card');
    for (const card of cards) {
        if (card.querySelector('h3').textContent === 'Goku') {
            // Update the card for UI transformation
            card.querySelector('h3').textContent = character.name;
            
            // Update powers display
            const powersDiv = card.querySelector('.powers');
            if (powersDiv) {
                powersDiv.innerHTML = character.powers.map(power => 
                    `<div class="power-badge">${power}</div>`
                ).join('');
            }
            
            // Update stats display
            updateHealthBar(character);
            break;
        }
    }
}

function resetBattle() {
    // Stop Honored One theme if playing
    if (gojoHonoredOneAudio) {
        gojoHonoredOneAudio.pause();
        gojoHonoredOneAudio = null;
    }
    
    // Stop Malevolent Shrine theme if playing
    if (malevonentShrineAudio) {
        malevonentShrineAudio.pause();
        malevonentShrineAudio = null;
    }
    
    characters = [];
    currentTeam = 'red';
    document.getElementById('redTeam').innerHTML = '';
    document.getElementById('blueTeam').innerHTML = '';
    document.getElementById('battleLog').innerHTML = '';
    document.getElementById('fightButton').disabled = false;
}