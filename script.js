// ========== KONFIGURASI CANVAS ==========
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 40;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;

// ========== PETA ==========
// 0 = tanah, 1 = pohon, 2 = musuh, 3 = piala EXP, 4 = peti harta, 5 = portal boss
const map = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,0,1,1,0,0,2,0,0,1,1,0,0,0,1,1,0,0],
    [0,1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0],
    [0,0,0,2,0,0,0,1,0,0,2,0,0,0,1,0,0,0,0,4],
    [0,1,0,0,0,1,0,0,0,2,0,0,0,1,0,0,1,0,2,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
    [0,2,0,0,0,2,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,2,0,0],
    [0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,5],
    [0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0],
    [0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0],
    [0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// ========== DATA BOSS ==========
const bosses = [
    { // Boss 1: Goblin King (setelah 5 kill)
        name: "👑 GOBLIN KING 👑",
        hp: 200,
        maxHp: 200,
        attack: 25,
        expReward: 150,
        goldReward: 100,
        requiredKills: 5,
        phase: 1,
        skill: "Rage Slash - Damage 2x lipat!"
    },
    { // Boss 2: Dragon Lord (setelah 15 kill)
        name: "🐉 DRAGON LORD 🐉",
        hp: 500,
        maxHp: 500,
        attack: 40,
        expReward: 400,
        goldReward: 300,
        requiredKills: 15,
        phase: 2,
        skill: "Fire Breath - Damage 40 + Burn effect!"
    },
    { // Boss 3: Dark Emperor (setelah 30 kill)
        name: "🌑 DARK EMPEROR 🌑",
        hp: 1000,
        maxHp: 1000,
        attack: 60,
        expReward: 1000,
        goldReward: 800,
        requiredKills: 30,
        phase: 3,
        skill: "Dark Nova - Damage 80 + Heal Reduction!"
    }
];

let currentBossIndex = 0;
let bossBattleActive = false;
let currentBoss = null;
let burnEffect = false;
let burnDamage = 0;
let healReduction = false;

// ========== DATA PEMAIN ==========
let player = {
    x: 0, y: 0,
    hp: 100, maxHp: 100,
    exp: 0, level: 1,
    killCount: 0, gold: 200,
    potions: 3,
    elixirs: 1,
    bossKills: 0,
    weapon: { name: "Bare Hands", atkBonus: 0, price: 0 },
    armor: { name: "Robe", defBonus: 0, price: 0 },
    ring: { name: "None", hpBonus: 0, price: 0 }
};

// ========== SHOP ITEMS ==========
const shopItems = {
    weapon: { name: "Iron Sword", atkBonus: 8, price: 100 },
    armor: { name: "Leather Armor", defBonus: 8, price: 100 },
    ring: { name: "HP Ring", hpBonus: 15, price: 150 }
};

// ========== VARIABEL GAME ==========
let gameRunning = true;
let statusMessage = "Selamat datang! Kalahkan musuh untuk membuka portal boss!";
let battleActive = false;
let currentEnemy = null;
let skillCooldown = false;
let skillCooldownTimer = 0;
let moveCooldown = false;
let originalMap = [];

// ========== FUNGSI STATS ==========
function getTotalAtk() {
    let baseAtk = 15 + player.level * 5;
    return baseAtk + (player.weapon.atkBonus || 0);
}

function getTotalDef() {
    return (player.armor.defBonus || 0);
}

function getMaxHpWithBonus() {
    let baseHp = 100 + (player.level - 1) * 20;
    if (player.ring.hpBonus) {
        return Math.floor(baseHp * (1 + player.ring.hpBonus / 100));
    }
    return baseHp;
}

function updatePlayerStats() {
    let newMaxHp = getMaxHpWithBonus();
    if (newMaxHp !== player.maxHp) {
        let ratio = player.hp / player.maxHp;
        player.maxHp = newMaxHp;
        player.hp = Math.floor(ratio * player.maxHp);
    } else {
        player.maxHp = newMaxHp;
    }
    
    document.getElementById('maxHpDisplay').innerText = player.maxHp;
    document.getElementById('atkDisplay').innerText = getTotalAtk();
    document.getElementById('defDisplay').innerText = getTotalDef();
    document.getElementById('bossKillDisplay').innerText = player.bossKills;
}

// ========== UPDATE UI ==========
function updateUI() {
    document.getElementById('hpDisplay').innerText = player.hp;
    document.getElementById('maxHpDisplay').innerText = player.maxHp;
    document.getElementById('expDisplay').innerText = player.exp;
    document.getElementById('levelDisplay').innerText = player.level;
    document.getElementById('killDisplay').innerText = player.killCount;
    document.getElementById('goldDisplay').innerText = player.gold;
    document.getElementById('bossKillDisplay').innerText = player.bossKills;
    
    document.getElementById('weaponName').innerText = player.weapon.name;
    document.getElementById('armorName').innerText = player.armor.name;
    document.getElementById('ringName').innerText = player.ring.name;
    
    document.getElementById('inventoryList').innerHTML = `💊 Potion: ${player.potions}<br>🍎 Elixir: ${player.elixirs}`;
    
    let skillText = "";
    if (player.level >= 15) {
        skillText = "✨ Ultimate Slash (Lv.15)<br>💚 Heal (Lv.10)<br>🔥 Serangan Ganda (Lv.5)";
    } else if (player.level >= 10) {
        skillText = "💚 Heal (Lv.10)<br>🔥 Serangan Ganda (Lv.5)<br>🔒 Lv.15: Ultimate Slash";
    } else if (player.level >= 5) {
        skillText = "🔥 Serangan Ganda (Lv.5)<br>🔒 Lv.10: Heal<br>🔒 Lv.15: Ultimate Slash";
    } else {
        skillText = "🔒 Lv.5: Serangan Ganda<br>🔒 Lv.10: Heal<br>🔒 Lv.15: Ultimate Slash";
    }
    document.getElementById('skillInfo').innerHTML = skillText;
    
    document.getElementById('statusMsg').innerHTML = statusMessage;
    
    updatePlayerStats();
    
    // Update boss info bar jika battle boss
    if (bossBattleActive && currentBoss) {
        document.getElementById('bossInfoBar').classList.remove('hidden');
        document.getElementById('bossName').innerHTML = currentBoss.name;
        let hpPercent = (currentBoss.hp / currentBoss.maxHp) * 100;
        document.getElementById('bossHpFill').style.width = hpPercent + '%';
        document.getElementById('bossHpText').innerHTML = `HP: ${Math.max(0, currentBoss.hp)}/${currentBoss.maxHp}`;
        
        // Tentukan phase berdasarkan HP
        let phaseText = "Phase 1";
        if (currentBoss.hp <= currentBoss.maxHp * 0.3) phaseText = "💀 PHASE 3 - ENRAGED! 💀";
        else if (currentBoss.hp <= currentBoss.maxHp * 0.6) phaseText = "⚡ PHASE 2 - ANGRY! ⚡";
        else phaseText = "🔥 PHASE 1 🔥";
        document.getElementById('bossPhase').innerHTML = phaseText;
    } else {
        document.getElementById('bossInfoBar').classList.add('hidden');
    }
}

function setStatus(msg) {
    statusMessage = msg;
    updateUI();
}

// ========== LEVEL UP ==========
function levelUp() {
    player.level++;
    updatePlayerStats();
    player.hp = player.maxHp;
    setStatus(`✨ LEVEL UP! Sekarang Level ${player.level}! Nyawa pulih penuh! ✨`);
    
    if (player.level === 5) {
        setStatus(`🔥 SKILL UNLOCK: Serangan Ganda! Damage 2x lipat! 🔥`);
    } else if (player.level === 10) {
        setStatus(`💚 SKILL UNLOCK: Heal! Pulihkan 50 HP! 💚`);
    } else if (player.level === 15) {
        setStatus(`⚡ ULTIMATE SKILL UNLOCK: Ultimate Slash! Damage 3x lipat! ⚡`);
    }
    updateUI();
}

function addExp(amount) {
    player.exp += amount;
    let expNeeded = player.level * 50;
    while (player.exp >= expNeeded) {
        player.exp -= expNeeded;
        levelUp();
        expNeeded = player.level * 50;
    }
    updateUI();
}

// ========== SHOP ==========
function buyWeapon() {
    if (player.weapon.name !== "Bare Hands") {
        setStatus("Kamu sudah punya senjata!");
        return false;
    }
    if (player.gold >= shopItems.weapon.price) {
        player.gold -= shopItems.weapon.price;
        player.weapon = { name: shopItems.weapon.name, atkBonus: shopItems.weapon.atkBonus, price: shopItems.weapon.price };
        setStatus(`🗡️ Membeli ${shopItems.weapon.name}! ATK +${shopItems.weapon.atkBonus}`);
        updateUI();
        return true;
    } else {
        setStatus(`💰 Gold tidak cukup! Butuh ${shopItems.weapon.price} gold.`);
        return false;
    }
}

function buyArmor() {
    if (player.armor.name !== "Robe") {
        setStatus("Kamu sudah punya armor!");
        return false;
    }
    if (player.gold >= shopItems.armor.price) {
        player.gold -= shopItems.armor.price;
        player.armor = { name: shopItems.armor.name, defBonus: shopItems.armor.defBonus, price: shopItems.armor.price };
        setStatus(`🛡️ Membeli ${shopItems.armor.name}! DEF +${shopItems.armor.defBonus}`);
        updateUI();
        return true;
    } else {
        setStatus(`💰 Gold tidak cukup! Butuh ${shopItems.armor.price} gold.`);
        return false;
    }
}

function buyRing() {
    if (player.ring.name !== "None") {
        setStatus("Kamu sudah punya ring!");
        return false;
    }
    if (player.gold >= shopItems.ring.price) {
        player.gold -= shopItems.ring.price;
        player.ring = { name: shopItems.ring.name, hpBonus: shopItems.ring.hpBonus, price: shopItems.ring.price };
        setStatus(`💍 Membeli ${shopItems.ring.name}! Max HP +${shopItems.ring.hpBonus}%`);
        updateUI();
        return true;
    } else {
        setStatus(`💰 Gold tidak cukup! Butuh ${shopItems.ring.price} gold.`);
        return false;
    }
}

// ========== INVENTORY ==========
function buyPotion() {
    if (battleActive) {
        setStatus("Tidak bisa beli saat battle!");
        return false;
    }
    if (player.gold >= 30) {
        player.gold -= 30;
        player.potions++;
        setStatus(`💊 Membeli Potion!`);
        updateUI();
        return true;
    } else {
        setStatus(`💰 Gold tidak cukup! Butuh 30 gold.`);
        return false;
    }
}

function buyElixir() {
    if (battleActive) {
        setStatus("Tidak bisa beli saat battle!");
        return false;
    }
    if (player.gold >= 80) {
        player.gold -= 80;
        player.elixirs++;
        setStatus(`🍎 Membeli Elixir!`);
        updateUI();
        return true;
    } else {
        setStatus(`💰 Gold tidak cukup! Butuh 80 gold.`);
        return false;
    }
}

function usePotion() {
    if (player.potions <= 0) {
        setStatus("💊 Tidak punya potion!");
        return false;
    }
    
    let healAmount = 40;
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    player.potions--;
    setStatus(`💊 Minum potion! Pulih ${healAmount} HP.`);
    updateUI();
    draw();
    return true;
}

function useElixir() {
    if (player.elixirs <= 0) {
        setStatus("🍎 Tidak punya elixir!");
        return false;
    }
    
    let healAmount = 100;
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    player.elixirs--;
    setStatus(`🍎 Minum elixir! Pulih ${healAmount} HP! 🍎`);
    updateUI();
    draw();
    return true;
}

// ========== SKILL SYSTEM ==========
function useSkill() {
    if (!battleActive && !bossBattleActive) {
        setStatus("Skill hanya bisa digunakan saat battle!");
        return false;
    }
    
    if (skillCooldown) {
        setStatus(`⏳ Skill cooldown! Tunggu ${skillCooldownTimer} turn lagi.`);
        return false;
    }
    
    let target = bossBattleActive ? currentBoss : currentEnemy;
    if (!target) return false;
    
    // Ultimate Slash (Level 15+)
    if (player.level >= 15) {
        let damage = getTotalAtk() * 3;
        target.hp -= damage;
        setStatus(`⚡ ULTIMATE SLASH! Damage ${damage} ke ${target.name}! ⚡`);
        
        if (target.hp <= 0) {
            if (bossBattleActive) {
                finishBossFight();
            } else {
                finishNormalFight();
            }
            return true;
        }
        
        skillCooldown = true;
        skillCooldownTimer = 3;
        
        if (bossBattleActive) {
            bossCounterAttack();
        } else {
            enemyCounterAttack();
        }
        updateUI();
        draw();
        return true;
    }
    
    // Heal skill (Level 10+)
    if (player.level >= 10 && player.hp < player.maxHp * 0.9) {
        let healAmount = healReduction ? 25 : 50;
        player.hp = Math.min(player.maxHp, player.hp + healAmount);
        setStatus(`💚 HEAL! Pulih ${healAmount} HP! ${healReduction ? "(Reduced by curse)" : ""} 💚`);
        skillCooldown = true;
        skillCooldownTimer = 2;
        updateUI();
        draw();
        return true;
    }
    
    // Serangan Ganda (Level 5+)
    if (player.level >= 5) {
        let damage = getTotalAtk() * 2;
        target.hp -= damage;
        setStatus(`🔥 SERANGAN GANDA! Damage ${damage} ke ${target.name}! 🔥`);
        
        if (target.hp <= 0) {
            if (bossBattleActive) {
                finishBossFight();
            } else {
                finishNormalFight();
            }
            return true;
        }
        
        skillCooldown = true;
        skillCooldownTimer = 2;
        
        if (bossBattleActive) {
            bossCounterAttack();
        } else {
            enemyCounterAttack();
        }
        updateUI();
        draw();
        return true;
    }
    
    setStatus(`🔒 Skill belum terbuka! Capai level 5.`);
    return false;
}

// ========== BOSS BATTLE ==========
function startBossBattle(bossIndex) {
    if (battleActive || bossBattleActive) return;
    
    // Cek apakah player sudah memenuhi syarat
    if (player.killCount < bosses[bossIndex].requiredKills) {
        setStatus(`⚠️ Kamu harus mengalahkan ${bosses[bossIndex].requiredKills} musuh dulu untuk membuka boss ini! (Sekarang: ${player.killCount}) ⚠️`);
        return;
    }
    
    currentBoss = JSON.parse(JSON.stringify(bosses[bossIndex]));
    bossBattleActive = true;
    burnEffect = false;
    healReduction = false;
    
    setStatus(`⚔️🔥 BOSS BATTLE! ${currentBoss.name} muncul! HP: ${currentBoss.hp}/${currentBoss.maxHp} 🔥⚔️`);
    updateUI();
    draw();
}

function bossCounterAttack() {
    let damage = Math.max(1, currentBoss.attack - getTotalDef());
    
    // Boss special attacks based on HP phase
    let bossMessage = `${currentBoss.name} menyerang! Damage ${damage}`;
    
    if (currentBoss.hp <= currentBoss.maxHp * 0.3) {
        // Phase 3: Enraged - triple attack!
        damage = Math.floor(damage * 1.5);
        bossMessage = `💀 ${currentBoss.name} ENRAGED! Serangan brutal! Damage ${damage} 💀`;
    } else if (currentBoss.hp <= currentBoss.maxHp * 0.6) {
        // Phase 2: Special skill
        if (currentBoss.name.includes("GOBLIN")) {
            damage = Math.floor(damage * 1.3);
            bossMessage = `👑 ${currentBoss.name} menggunakan Rage Slash! Damage ${damage} 👑`;
        } else if (currentBoss.name.includes("DRAGON")) {
            damage = Math.floor(damage * 1.4);
            burnEffect = true;
            burnDamage = 10;
            bossMessage = `🐉 ${currentBoss.name} menggunakan Fire Breath! Damage ${damage} + Burn! 🐉`;
        } else if (currentBoss.name.includes("DARK")) {
            damage = Math.floor(damage * 1.4);
            healReduction = true;
            bossMessage = `🌑 ${currentBoss.name} menggunakan Dark Nova! Damage ${damage} + Curse (Heal -50%)! 🌑`;
        }
    }
    
    player.hp -= damage;
    setStatus(`😖 ${bossMessage}. Sisa nyawa: ${player.hp}/${player.maxHp}`);
    
    // Burn effect damage
    if (burnEffect && !bossBattleActive) {
        player.hp -= burnDamage;
        setStatus(`🔥 Terbakar! -${burnDamage} HP! 🔥`);
        burnEffect = false;
    }
    
    if (player.hp <= 0) {
        gameRunning = false;
        setStatus(`💀 GAME OVER! Dikalahkan oleh ${currentBoss.name}! 💀`);
        bossBattleActive = false;
        battleActive = false;
    }
}

function playerAttackBoss() {
    if (!bossBattleActive || !gameRunning) return;
    
    let damage = getTotalAtk();
    currentBoss.hp -= damage;
    setStatus(`💥 Serang! Damage ${damage} ke ${currentBoss.name}. Sisa HP boss: ${currentBoss.hp}/${currentBoss.maxHp}`);
    
    if (currentBoss.hp <= 0) {
        finishBossFight();
        return;
    }
    
    bossCounterAttack();
    decreaseSkillCooldown();
    updateUI();
    draw();
}

function finishBossFight() {
    let rewardExp = currentBoss.expReward;
    let rewardGold = currentBoss.goldReward;
    
    player.bossKills++;
    player.killCount += 5; // Bonus kill count
    addExp(rewardExp);
    player.gold += rewardGold;
    
    setStatus(`🎉✨ VICTORY! ${currentBoss.name} Dikalahkan! ✨🎉\n+${rewardExp} EXP, +${rewardGold} Gold, +1 Boss Kill!`);
    
    // Hapus portal dari map
    for (let i = 0; i < MAP_HEIGHT; i++) {
        for (let j = 0; j < MAP_WIDTH; j++) {
            if (map[i][j] === 5) {
                map[i][j] = 0;
            }
        }
    }
    
    // Spawn portal untuk boss berikutnya jika ada
    if (player.bossKills < bosses.length) {
        setStatus(`🌟 Portal baru muncul untuk boss berikutnya! Cari tanda 🔴 di peta! 🌟`);
        spawnPortal();
    } else {
        setStatus(`🏆 SELAMAT! Kamu telah menyelesaikan semua boss! Kamu adalah LEGEND! 🏆`);
    }
    
    bossBattleActive = false;
    currentBoss = null;
    burnEffect = false;
    healReduction = false;
    skillCooldown = false;
    updateUI();
    draw();
}

function spawnPortal() {
    // Cari posisi kosong untuk portal
    for (let i = 0; i < MAP_HEIGHT && i < 15; i++) {
        for (let j = 0; j < MAP_WIDTH && j < 20; j++) {
            if (map[i][j] === 0) {
                map[i][j] = 5;
                return;
            }
        }
    }
}

// ========== NORMAL BATTLE ==========
function startNormalBattle(enemyType) {
    if (battleActive || bossBattleActive) return;
    
    let enemyHp = 30 + (player.level - 1) * 8;
    let enemyExp = 20 + (player.level - 1) * 5;
    let enemyAttack = 10 + Math.floor(player.level * 1.5);
    
    currentEnemy = {
        name: enemyType === 2 ? "👾 Goblin" : "🐺 Serigala",
        hp: enemyHp,
        maxHp: enemyHp,
        exp: enemyExp,
        attack: enemyAttack
    };
    
    battleActive = true;
    setStatus(`⚔️ BATTLE! ${currentEnemy.name} muncul! HP: ${currentEnemy.hp}. Tekan S(Serang), F(Kabur), Skill, atau Potion! ⚔️`);
    updateUI();
}

function playerAttackNormal() {
    if (!battleActive || !gameRunning) return;
    
    let damage = getTotalAtk();
    currentEnemy.hp -= damage;
    setStatus(`💥 Serang! Damage ${damage} ke ${currentEnemy.name}. Sisa HP musuh: ${currentEnemy.hp}/${currentEnemy.maxHp}`);
    
    if (currentEnemy.hp <= 0) {
        finishNormalFight();
        return;
    }
    
    enemyCounterAttack();
    decreaseSkillCooldown();
    updateUI();
    draw();
}

function enemyCounterAttack() {
    let damage = Math.max(1, currentEnemy.attack - getTotalDef());
    player.hp -= damage;
    setStatus(`😖 ${currentEnemy.name} menyerang! Damage ${damage}. Sisa nyawa: ${player.hp}/${player.maxHp}`);
    
    if (player.hp <= 0) {
        gameRunning = false;
        setStatus(`💀 GAME OVER! 💀`);
        battleActive = false;
    }
}

function finishNormalFight() {
    let earnedExp = currentEnemy.exp;
    let goldDrop = 10 + Math.floor(Math.random() * 25);
    player.killCount++;
    player.gold += goldDrop;
    addExp(earnedExp);
    map[player.y][player.x] = 0;
    setStatus(`🎉 MENANG! +${earnedExp} EXP +${goldDrop} Gold! (Total kill: ${player.killCount}) 🎉`);
    
    // Cek apakah bisa spawn portal boss
    let nextBossIndex = player.bossKills;
    if (nextBossIndex < bosses.length && player.killCount >= bosses[nextBossIndex].requiredKills) {
        if (!mapHasPortal()) {
            spawnPortal();
            setStatus(`🔥 PORTAL BOSS TELAH TERBUKA! Cari tanda 🔴 di peta! 🔥`);
        }
    }
    
    battleActive = false;
    currentEnemy = null;
    skillCooldown = false;
    updateUI();
    draw();
}

function mapHasPortal() {
    for (let i = 0; i < MAP_HEIGHT; i++) {
        for (let j = 0; j < MAP_WIDTH; j++) {
            if (map[i][j] === 5) return true;
        }
    }
    return false;
}

function fleeBattle() {
    if (!battleActive && !bossBattleActive) return;
    
    if (Math.random() > 0.4) {
        setStatus(`🏃‍♂️ Berhasil kabur!`);
        battleActive = false;
        bossBattleActive = false;
        currentEnemy = null;
        currentBoss = null;
        skillCooldown = false;
        burnEffect = false;
        healReduction = false;
    } else {
        if (bossBattleActive) {
            bossCounterAttack();
        } else {
            enemyCounterAttack();
        }
        setStatus(`😱 Gagal kabur!`);
        if (player.hp <= 0) {
            gameRunning = false;
            setStatus(`💀 GAME OVER! 💀`);
            battleActive = false;
            bossBattleActive = false;
        }
        updateUI();
    }
    draw();
}

function decreaseSkillCooldown() {
    if (skillCooldownTimer > 0) {
        skillCooldownTimer--;
        if (skillCooldownTimer === 0) {
            skillCooldown = false;
            setStatus("✨ Skill siap digunakan lagi! ✨");
        }
    }
}

// ========== SAVE & LOAD ==========
function saveGame() {
    const saveData = {
        player: {
            x: player.x, y: player.y,
            hp: player.hp, maxHp: player.maxHp,
            exp: player.exp, level: player.level,
            killCount: player.killCount, gold: player.gold,
            potions: player.potions, elixirs: player.elixirs,
            bossKills: player.bossKills,
            weapon: player.weapon, armor: player.armor, ring: player.ring
        },
        mapState: [],
        timestamp: new Date().toLocaleString()
    };
    
    for (let i = 0; i < MAP_HEIGHT; i++) {
        saveData.mapState[i] = [...map[i]];
    }
    
    localStorage.setItem('rpgSaveData', JSON.stringify(saveData));
    setStatus(`💾 Game tersimpan! (${saveData.timestamp}) 💾`);
}

function loadGame() {
    const saveDataRaw = localStorage.getItem('rpgSaveData');
    if (!saveDataRaw) {
        setStatus("❌ Tidak ada save game! ❌");
        return false;
    }
    
    try {
        const saveData = JSON.parse(saveDataRaw);
        player = saveData.player;
        
        for (let i = 0; i < MAP_HEIGHT; i++) {
            for (let j = 0; j < MAP_WIDTH; j++) {
                map[i][j] = saveData.mapState[i][j];
            }
        }
        
        gameRunning = true;
        battleActive = false;
        bossBattleActive = false;
        currentEnemy = null;
        currentBoss = null;
        skillCooldown = false;
        skillCooldownTimer = 0;
        burnEffect = false;
        healReduction = false;
        
        updateUI();
        draw();
        setStatus(`📂 Load sukses! (${saveData.timestamp}) 📂`);
        return true;
    } catch(e) {
        setStatus("❌ Gagal load save game! ❌");
        return false;
    }
}

// ========== RESET ==========
function saveOriginalMap() {
    for (let i = 0; i < MAP_HEIGHT; i++) {
        originalMap[i] = [...map[i]];
    }
}

function resetMapToOriginal() {
    for (let i = 0; i < MAP_HEIGHT; i++) {
        for (let j = 0; j < MAP_WIDTH; j++) {
            map[i][j] = originalMap[i][j];
        }
    }
}

function resetGame() {
    player = {
        x: 0, y: 0,
        hp: 100, maxHp: 100,
        exp: 0, level: 1,
        killCount: 0, gold: 200,
        potions: 3, elixirs: 1,
        bossKills: 0,
        weapon: { name: "Bare Hands", atkBonus: 0, price: 0 },
        armor: { name: "Robe", defBonus: 0, price: 0 },
        ring: { name: "None", hpBonus: 0, price: 0 }
    };
    
    gameRunning = true;
    battleActive = false;
    bossBattleActive = false;
    currentEnemy = null;
    currentBoss = null;
    skillCooldown = false;
    skillCooldownTimer = 0;
    burnEffect = false;
    healReduction = false;
    
    resetMapToOriginal();
    updateUI();
    draw();
    setStatus("🔄 Game direset! Selamat bermain! 🔄");
}

// ========== GERAKAN ==========
function isWalkable(tileX, tileY) {
    if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return false;
    if (battleActive || bossBattleActive) return false;
    const tile = map[tileY][tileX];
    return tile === 0 || tile === 2 || tile === 3 || tile === 4 || tile === 5;
}

function tryMove(dx, dy) {
    if (!gameRunning) {
        setStatus("Game over. Tekan reset.");
        return false;
    }
    if (battleActive || bossBattleActive) {
        setStatus("Sedang battle! Gunakan S(Serang), F(Kabur), Skill, atau Potion/Elixir.");
        return false;
    }
    
    const newX = player.x + dx;
    const newY = player.y + dy;
    
    if (!isWalkable(newX, newY)) {
        setStatus("Tidak bisa lewat! Ada rintangan.");
        return false;
    }
    
    const tile = map[newY][newX];
    player.x = newX;
    player.y = newY;
    
    if (tile === 5) {
        let bossIndex = player.bossKills;
        if (bossIndex < bosses.length) {
            startBossBattle(bossIndex);
        } else {
            setStatus("🏆 Kamu sudah menyelesaikan semua boss! 🏆");
            map[newY][newX] = 0;
        }
    } else if (tile === 2) {
        startNormalBattle(2);
    } else if (tile === 3) {
        let bonusExp = 25;
        addExp(bonusExp);
        setStatus(`🏆 PIALA! +${bonusExp} EXP! 🏆`);
        map[newY][newX] = 0;
    } else if (tile === 4) {
        let goldFound = 30 + Math.floor(Math.random() * 40);
        player.gold += goldFound;
        setStatus(`💰 Peti harta! +${goldFound} Gold! 💰`);
        map[newY][newX] = 0;
    } else {
        setStatus(`Bergerak ke (${player.x}, ${player.y})`);
    }
    
    draw();
    return true;
}

// ========== DRAW ==========
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let row = 0; row < MAP_HEIGHT; row++) {
        for (let col = 0; col < MAP_WIDTH; col++) {
            let tile = map[row][col];
            let x = col * TILE_SIZE;
            let y = row * TILE_SIZE;
            
            if (tile === 0) {
                ctx.fillStyle = "#4a784a";
                ctx.fillRect(x, y, TILE_SIZE-1, TILE_SIZE-1);
            } else if (tile === 1) {
                ctx.fillStyle = "#2d5a2d";
                ctx.fillRect(x, y, TILE_SIZE-1, TILE_SIZE-1);
                ctx.fillStyle = "#1e3a1e";
                ctx.fillRect(x+5, y+5, TILE_SIZE-11, TILE_SIZE-11);
            } else if (tile === 2) {
                ctx.fillStyle = "#8b0000";
                ctx.fillRect(x, y, TILE_SIZE-1, TILE_SIZE-1);
                ctx.font = "24px monospace";
                ctx.fillStyle = "#ff4444";
                ctx.fillText("👾", x+8, y+32);
            } else if (tile === 3) {
                ctx.fillStyle = "#daa520";
                ctx.fillRect(x, y, TILE_SIZE-1, TILE_SIZE-1);
                ctx.font = "24px monospace";
                ctx.fillStyle = "#ffff00";
                ctx.fillText("🏆", x+8, y+32);
            } else if (tile === 4) {
                ctx.fillStyle = "#8b6914";
                ctx.fillRect(x, y, TILE_SIZE-1, TILE_SIZE-1);
                ctx.font = "24px monospace";
                ctx.fillStyle = "#ffd700";
                ctx.fillText("📦", x+8, y+32);
            } else if (tile === 5) {
                // Portal boss
                ctx.fillStyle = "#ff0000";
                ctx.fillRect(x, y, TILE_SIZE-1, TILE_SIZE-1);
                ctx.fillStyle = "#ff6600";
                ctx.fillRect(x+8, y+8, TILE_SIZE-17, TILE_SIZE-17);
                ctx.font = "20px monospace";
                ctx.fillStyle = "#ffffff";
                ctx.fillText("🔴", x+12, y+30);
            }
            ctx.strokeStyle = "#00000033";
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        }
    }
    
    let px = player.x * TILE_SIZE;
    let py = player.y * TILE_SIZE;
    ctx.fillStyle = "#4169e1";
    ctx.fillRect(px+5, py+5, TILE_SIZE-10, TILE_SIZE-10);
    ctx.font = "28px monospace";
    ctx.fillStyle = "#ffd700";
    ctx.fillText("⚔️", px+8, py+32);
    
    // Battle UI
    if ((battleActive || bossBattleActive) && !bossBattleActive) {
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, canvas.height-100, canvas.width, 100);
        ctx.fillStyle = "#ff5555";
        ctx.font = "bold 14px monospace";
        ctx.fillText(`${currentEnemy?.name} ❤️ ${currentEnemy?.hp}/${currentEnemy?.maxHp}`, 15, canvas.height-75);
        ctx.fillStyle = "#55ff55";
        ctx.fillText(`Kamu ❤️ ${player.hp}/${player.maxHp} (ATK:${getTotalAtk()} DEF:${getTotalDef()})`, 15, canvas.height-50);
        ctx.fillStyle = "#ffffaa";
        ctx.font = "11px monospace";
        ctx.fillText(`S(Serang) F(Kabur) | Skill | Potion/Elixir`, 15, canvas.height-25);
        if (skillCooldown) {
            ctx.fillStyle = "#ffaa00";
            ctx.fillText(`⏳ Skill cooldown: ${skillCooldownTimer} turn`, 15, canvas.height-10);
        }
    }
}

// ========== EVENT & INIT ==========
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (battleActive || bossBattleActive) {
        if (key === 's') {
            if (bossBattleActive) playerAttackBoss();
            else playerAttackNormal();
        } else if (key === 'f') {
            fleeBattle();
        }
        return;
    }
    switch(key) {
        case 'arrowup': tryMove(0, -1); break;
        case 'arrowdown': tryMove(0, 1); break;
        case 'arrowleft': tryMove(-1, 0); break;
        case 'arrowright': tryMove(1, 0); break;
    }
});

function init() {
    saveOriginalMap();
    player.x = 0; player.y = 0;
    updateUI();
    draw();
    
    document.getElementById('resetBtn').onclick = () => resetGame();
    document.getElementById('saveBtn').onclick = () => saveGame();
    document.getElementById('loadBtn').onclick = () => loadGame();
    document.getElementById('usePotionBtn').onclick = () => usePotion();
    document.getElementById('useElixirBtn').onclick = () => useElixir();
    document.getElementById('buyPotionBtn').onclick = () => buyPotion();
    document.getElementById('buyElixirBtn').onclick = () => buyElixir();
    document.getElementById('useSkillBtn').onclick = () => useSkill();
    document.getElementById('weaponShopBtn').onclick = () => buyWeapon();
    document.getElementById('armorShopBtn').onclick = () => buyArmor();
    document.getElementById('ringShopBtn').onclick = () => buyRing();
    
    document.querySelectorAll('.moveBtn').forEach(btn => {
        btn.onclick = (e) => {
            if (moveCooldown) return;
            moveCooldown = true;
            let dx = parseInt(btn.dataset.dx);
            let dy = parseInt(btn.dataset.dy);
            tryMove(dx, dy);
            setTimeout(() => moveCooldown = false, 200);
        };
    });
    
    setStatus("Selamat datang! Kalahkan musuh, buka portal 🔴, dan kalahkan boss!");
}

init();
