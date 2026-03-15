        const ranks = ['6','7','8','9','10','J','Q','K','A'];
        const suits = ['♥','♦','♣','♠'];
        const rankValues = {'6':0,'7':1,'8':2,'9':3,'10':4,'J':5,'Q':6,'K':7,'A':8};

        let deck = [], playerHand = [], botHand = [];
        let trumpCard = null, trumpSuit = '';
        let tablePairs = [];
        let isPlayerAttacker = true;
        let gameOver = false;

        function createDeck() {
            deck = [];
            for (let suit of suits) for (let rank of ranks) deck.push({rank, suit});
            shuffle(deck);
            playerHand = deck.splice(0, 6);
            botHand = deck.splice(0, 6);
            trumpCard = deck.pop();
            trumpSuit = trumpCard.suit;
            deck.push(trumpCard);
        }

        function shuffle(array) {
            for (let i = array.length-1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        function canBeat(attack, defense) {
            if (!attack || !defense) return false;
            if (attack.suit === defense.suit) return rankValues[defense.rank] > rankValues[attack.rank];
            return defense.suit === trumpSuit && (attack.suit !== trumpSuit || rankValues[defense.rank] > rankValues[attack.rank]);
        }

        function getCardHTML(card, isBack = false) {
            if (isBack) return `<div class="card-back">🂠</div>`;
            const color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
            return `<div class="card ${color}"><div class="rank">${card.rank}</div><div class="suit">${card.suit}</div><div class="rank-bottom">${card.rank}</div></div>`;
        }

        function getTableRanks() {
            const set = new Set();
            tablePairs.forEach(p => {
                set.add(p.attack.rank);
                if (p.defense) set.add(p.defense.rank);
            });
            return set;
        }


        function render() {
            if (gameOver) return;

            document.getElementById('trump-card').innerHTML = getCardHTML(trumpCard);
            document.getElementById('deck-count').textContent = deck.length;
            document.getElementById('bot-count').textContent = botHand.length;

            const botDiv = document.getElementById('bot-hand');
            botDiv.innerHTML = '';
            for (let i = 0; i < Math.min(botHand.length, 6); i++) botDiv.innerHTML += getCardHTML(null, true);

            const ph = document.getElementById('player-hand');
            ph.innerHTML = '';
            playerHand.forEach((c, i) => {
                const el = document.createElement('div');
                el.innerHTML = getCardHTML(c);
                el.onclick = () => handlePlayerCardClick(i);
                ph.appendChild(el);
            });

            const pairsDiv = document.getElementById('table-pairs');
            pairsDiv.innerHTML = '';
            tablePairs.forEach((pair, i) => {
                const p = document.createElement('div');
                p.innerHTML = `
                    <div class="pair-label">ATAK</div>${getCardHTML(pair.attack)}
                    <div class="pair-label">OBRONA</div>${pair.defense ? getCardHTML(pair.defense) : '<div style="width:70px;height:100px;border:2px dashed #ffcc00;border-radius:8px;"></div>'}
                `;
                if (!isPlayerAttacker && !pair.defense) p.onclick = () => { selectedPairIndex = i; render(); };
                pairsDiv.appendChild(p);
            });

            updateButtonsAndStatus();
        }

        function updateButtonsAndStatus() {
            const status = document.getElementById('status');
            const btnDiv = document.getElementById('action-buttons');
            btnDiv.innerHTML = '';

if (isPlayerAttacker) {

    status.textContent = tablePairs.length === 0 
        ? 'Twoja tura'
        : tablePairs.every(p => p.defense !== null)
            ? 'Bot obronił wszystko! Dorzuć więcej lub zakończ atak'
            : 'Bot się jeszcze broni...';

    if (tablePairs.length > 0 && tablePairs.every(p => p.defense !== null)) {

        const endBtn = document.createElement('button');
        endBtn.textContent = "ZAKOŃCZ ATAK";
        endBtn.onclick = playerEndAttack;
        btnDiv.appendChild(endBtn);

    }

}       
 else {
                status.textContent = tablePairs.some(p => !p.defense) 
                    ? 'Przeciwnik atakuje.'
                    : 'Wszystko zbite – czekam na decyzję bota...';
                
                const pasBtn = document.createElement('button');
                pasBtn.textContent = 'PAS – WEŹ KARTY';
                pasBtn.onclick = playerTakeCards;
                btnDiv.appendChild(pasBtn);
            }
        }

        function handlePlayerCardClick(index) {
            if (gameOver) return;
            const card = playerHand[index];
            const tableRanks = getTableRanks();

            if (isPlayerAttacker) {
                if (tablePairs.length === 0 || tableRanks.has(card.rank)) {
                    tablePairs.push({attack: card, defense: null});
                    playerHand.splice(index, 1);
                    render();
                    setTimeout(() => botDefendStep(0), 380);
                } else {
                    const cardEl = document.getElementById('player-hand').children[index];
                        cardEl.classList.add('error-effect');
                        setTimeout(() => cardEl.classList.remove('error-effect'), 300);
                }
            } else {

    // znajdź pierwszą niepokrytą kartę którą da się zbić
    let targetPair = null;

    for (let pair of tablePairs) {
        if (!pair.defense && canBeat(pair.attack, card)) {
            targetPair = pair;
            break;
        }
    }

    if (!targetPair) {
        const cardEl = document.getElementById('player-hand').children[index];
                        cardEl.classList.add('error-effect');
                        setTimeout(() => cardEl.classList.remove('error-effect'), 300);
        return;
    }

    targetPair.defense = card;

    playerHand.splice(index, 1);

    render();

    if (tablePairs.every(p => p.defense !== null)) {
        setTimeout(botTryContinueAttack, 500);
    }
}
        }

        // ==================== BOT ATAKUJE – TYLKO JEDNĄ KARTĘ NA RAZ ====================
        function botStartAttack() {
            if (gameOver) return;
            document.getElementById('status').textContent = 'Bot atakuje jedną kartą...';
            tablePairs = [];

            // BOT ZAWSZE ZACZYNA OD JEDNEJ KARTY
            let possible = botHand.filter(c => c.suit !== trumpSuit);
            if (possible.length === 0) possible = botHand;
            possible.sort((a,b) => rankValues[a.rank] - rankValues[b.rank]);
            const chosen = possible[0];

            tablePairs.push({attack: chosen, defense: null});
            botHand.splice(botHand.indexOf(chosen), 1);

            render();
            isPlayerAttacker = false;   // czekamy na Twoją obronę
        }

        function botDefendStep(step) {
            const openPairs = tablePairs.filter(p => !p.defense);
            if (openPairs.length === 0) return;

            let candidates = [];
            for (let i = 0; i < tablePairs.length; i++) {
                if (!tablePairs[i].defense) {
                    const poss = botHand.filter(c => canBeat(tablePairs[i].attack, c));
                    if (poss.length > 0) candidates.push({idx: i, cards: poss});
                }
            }

            if (candidates.length === 0) {
                botCannotDefend();
                return;
            }

            candidates.sort((a,b) => rankValues[a.cards[0].rank] - rankValues[b.cards[0].rank]);
            const best = candidates[0];
            const beater = best.cards[0];
            tablePairs[best.idx].defense = beater;
            botHand.splice(botHand.indexOf(beater), 1);

            render();
            setTimeout(() => botDefendStep(step + 1), 450);
        }

        function botCannotDefend() {
            document.getElementById('status').textContent = 'Bot nie może zbić! Dorzuć jeszcze karty lub kliknij DAJ KARTY BOTOWI';
            const btnDiv = document.getElementById('action-buttons');
            btnDiv.innerHTML = '';
            const giveBtn = document.createElement('button');
            giveBtn.textContent = 'DAJ KARTY BOTOWI';
            giveBtn.onclick = botTakeCards;
            btnDiv.appendChild(giveBtn);
        }

        function botTakeCards() {
            performDraw();
            const throwRanks = getTableRanks();
            for (let i = playerHand.length - 1; i >= 0; i--) {
                if (throwRanks.has(playerHand[i].rank)) {
                    tablePairs.push({attack: playerHand[i], defense: null});
                    playerHand.splice(i, 1);
                }
            }

            tablePairs.forEach(p => {
                botHand.push(p.attack);
                if (p.defense) botHand.push(p.defense);
            });

            clearTable();
            isPlayerAttacker = true;
            performDraw();
            render();
            checkWin();
        }

        function botTryContinueAttack() {
            const currentRanks = getTableRanks();
            const possibleToAdd = botHand.filter(c => currentRanks.has(c.rank));

            if (possibleToAdd.length > 0 && tablePairs.length < 4) {
                // BOT DORZUCA JEDNĄ KARTĘ (dokładnie jak Ty)
                possibleToAdd.sort((a,b) => rankValues[a.rank] - rankValues[b.rank]);
                const toAdd = possibleToAdd[0];
                tablePairs.push({attack: toAdd, defense: null});
                botHand.splice(botHand.indexOf(toAdd), 1);

                document.getElementById('status').textContent = 'Bot dorzucił jeszcze jedną kartę!';
                render();
                // gracz dalej broni (isPlayerAttacker zostaje false)
            } else {
                // bot nie chce / nie może dorzucić → kończy atak
                clearTable();
                isPlayerAttacker = true;
                document.getElementById('status').textContent = 'Bot skończył atak – Twoja tura!';
                performDraw();
                render();
                checkWin();
            }
        }

        function playerTakeCards() {
            const throwRanks = getTableRanks();
            for (let i = botHand.length - 1; i >= 0; i--) {
                if (throwRanks.has(botHand[i].rank)) {
                    tablePairs.push({attack: botHand[i], defense: null});
                    botHand.splice(i, 1);
                }
            }

            tablePairs.forEach(p => {
                playerHand.push(p.attack);
                if (p.defense) playerHand.push(p.defense);
            });

            clearTable();
            isPlayerAttacker = false;
            performDraw();
            render();
            checkWin();

            setTimeout(botStartAttack, 700);
        }
function playerEndAttack() {

    if (!tablePairs.every(p => p.defense !== null)) {
        alert("Bot jeszcze się nie obronił ze wszystkich kart!");
        return;
    }

    clearTable();

    isPlayerAttacker = false;

    document.getElementById('status').textContent =
        'Koniec ataku – teraz bot atakuje';

    performDraw();
    render();
    checkWin();

    setTimeout(botStartAttack, 700);
}
        function clearTable() { tablePairs = []; }

function performDraw() {

    const attacker = isPlayerAttacker ? playerHand : botHand;
    const defender = isPlayerAttacker ? botHand : playerHand;

    while (deck.length > 0 && attacker.length < 6) {
        attacker.push(deck.shift());
    }

    while (deck.length > 0 && defender.length < 6) {
        defender.push(deck.shift());
    }
}

        function checkWin() {
            if (playerHand.length === 0) {
                gameOver = true;
                showWinScreen("🎉 WYGRALES! 🎉");
            } else if (botHand.length === 0) {
                gameOver = true;
                showWinScreen("😭 BOT WYGRAŁ<br>Jesteś DURNIEM! 😭");
            }
        }

        function showWinScreen(text) {
            document.getElementById('win-text').innerHTML = text;
            document.getElementById('win-screen').style.display = 'flex';
        }

        function startGame() {
            createDeck();
            tablePairs = [];
            selectedPairIndex = -1;
            isPlayerAttacker = true;
            gameOver = false;
            document.getElementById('win-screen').style.display = 'none';
            render();
        }

        function restartGame() {
            startGame();
        }

        window.onload = startGame;
