// Memory Game Upgrade
const symbols = ["🍎", "🍌", "🍇", "🍓", "🍒", "🍑", "🍍", "🥝", "🍉", "🥥", "🍋", "🍊"];

let moves = 0;
let flippedCards = [];
let matchedCount = 0;
let timerInterval;
let timeElapsed = 0;
let totalCards; 
const globalMovesKey = "memoryGameGlobalMoves";
const gameStateKey = "memoryGameState";
const moveChannel = new BroadcastChannel("memoryGameMoveChannel");

const cardFlipSound = new Audio("audio/card-flip-sound.mp3");
const matchSound = new Audio("audio/Match-sound.mp3");
const mismatchSound = new Audio("audio/game-fail-90322.mp3");
const winSound = new Audio("audio/funny-comedy-memes-music-comic-humor-joke-background-intro-theme-288430.mp3");

const shuffle = (array) => array.sort(() => Math.random() - 0.5);

// Cache DOM elements
const grid = document.getElementById("grid");
const moveCountDisplay = document.getElementById("move-count");
const timerDisplay = document.getElementById("timer");
const globalMoveCountDisplay = document.getElementById("global-move-count");
const resetGameButton = document.getElementById("reset-game");
const resetGlobalMovesButton = document.getElementById("reset-global-moves");
const difficultySelect = document.getElementById("difficulty");

function saveGameState() {
    const state = {
        difficulty: difficultySelect.value,
        moves,
        timeElapsed,
        matchedCount,
        grid: Array.from(document.querySelectorAll(".card")).map(card => ({
            symbol: card.dataset.symbol,
            matched: card.classList.contains("matched"),
            visible: !card.classList.contains("hidden")
        }))
    };
    localStorage.setItem(gameStateKey, JSON.stringify(state));
}

function loadGameState() {
    const savedState = localStorage.getItem(gameStateKey);
    return savedState ? JSON.parse(savedState) : null;
}

function updateGlobalMoves() {
    let totalMoves = parseInt(localStorage.getItem(globalMovesKey) || "0", 10);
    totalMoves++;
    localStorage.setItem(globalMovesKey, totalMoves);
    moveChannel.postMessage(totalMoves);
    globalMoveCountDisplay.textContent = totalMoves;
}

moveChannel.onmessage = (event) => {
    globalMoveCountDisplay.textContent = event.data;
};

resetGlobalMovesButton.addEventListener("click", () => {
    localStorage.setItem(globalMovesKey, "0");
    moveChannel.postMessage(0);
    globalMoveCountDisplay.textContent = "0";
});

function startGame() {
    const difficulty = difficultySelect.value;
    const [rows, cols] = difficulty.split("x").map(Number);
    const numCards = (rows * cols) / 2;

    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${cols}, 100px)`;

    let cards;
    const savedState = loadGameState();

    if (savedState && savedState.difficulty === difficulty) {
        cards = savedState.grid.map(cardData => cardData.symbol);
    } else {
        cards = shuffle([...symbols.slice(0, numCards), ...symbols.slice(0, numCards)]);
    }

    cards.forEach(symbol => {
        const card = document.createElement("div");
        card.classList.add("card", "hidden");
        card.dataset.symbol = symbol;
        card.textContent = symbol;
        card.addEventListener("click", handleCardClick);
        grid.appendChild(card);
    });

    moves = 0;
    flippedCards = [];
    matchedCount = 0;
    timeElapsed = 0;
    clearInterval(timerInterval);

    moveCountDisplay.textContent = moves;
    timerDisplay.textContent = "00:00";

    timerInterval = setInterval(() => {
        timeElapsed++;
        timerDisplay.textContent = new Date(timeElapsed * 1000).toISOString().substr(14, 5);
        saveGameState();
    }, 1000);

    if (savedState && savedState.difficulty === difficulty) {
        const gridElements = document.querySelectorAll(".card");
        savedState.grid.forEach((cardData, index) => {
            if (gridElements[index]) {
                const card = gridElements[index];
                card.dataset.symbol = cardData.symbol;
                card.textContent = cardData.symbol;
                if (cardData.matched) card.classList.add("matched");
                if (!cardData.visible) card.classList.add("hidden");
            }
        });

        moves = savedState.moves;
        matchedCount = savedState.matchedCount;
        timeElapsed = savedState.timeElapsed;
        moveCountDisplay.textContent = moves;
        timerDisplay.textContent = new Date(timeElapsed * 1000).toISOString().substr(14, 5);
        globalMoveCountDisplay.textContent = localStorage.getItem(globalMovesKey) || "0";

        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeElapsed++;
            timerDisplay.textContent = new Date(timeElapsed * 1000).toISOString().substr(14, 5);
            saveGameState();
        }, 1000);
    }

    totalCards = numCards;  
    return totalCards;
}



function handleCardClick(event) {
    const card = event.target;
    if (!card.classList.contains("hidden") || flippedCards.length >= 2) return;

    card.classList.remove("hidden");
    cardFlipSound.play();
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        moves++;
        moveCountDisplay.textContent = moves;
        updateGlobalMoves();

        if (flippedCards[0].dataset.symbol === flippedCards[1].dataset.symbol) {
            matchSound.play();
            flippedCards.forEach(c => c.classList.add("matched"));
            matchedCount++;
            flippedCards = [];

            if (matchedCount === totalCards) {
                winSound.play();
                alert("Congratulations! You won!");
                clearInterval(timerInterval);
            }
        } else {
            mismatchSound.play();
            setTimeout(() => {
                flippedCards.forEach(c => c.classList.add("hidden"));
                flippedCards = [];
            }, 1000);
        }
    }
    saveGameState();
}

function resetGame() {
    localStorage.removeItem(gameStateKey);
    startGame();
}


document.addEventListener("DOMContentLoaded", () => {
    const savedState = loadGameState();
    
    if (savedState && savedState.difficulty) {
        difficultySelect.value = savedState.difficulty; 
    }

    totalCards = startGame();

    resetGameButton.addEventListener("click", resetGame);
    difficultySelect.addEventListener("change", () => {
        saveGameState(); 
        startGame();
    });
});




