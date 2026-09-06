/* =========================================================
   KID WORLD
   COMPLETE MULTI-PAGE JAVASCRIPT
========================================================= */

"use strict";

/* =========================================================
   STORAGE
========================================================= */

const ACCOUNTS_KEY = "kidWorldAccounts";
const CURRENT_ACCOUNT_KEY = "kidWorldCurrentUID";

/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let accounts = [];
let currentAccount = null;

let gameRunning = false;
let gameAnimation = null;

let birdY = 180;
let birdVelocity = 0;

let pipeX = 0;
let pipeGapY = 150;

let gameScore = 0;
let passedPipe = false;

const GRAVITY = 0.45;
const FLAP_POWER = -7;
const PIPE_SPEED = 3;
const PIPE_WIDTH = 60;
const PIPE_GAP = 120;
const BIRD_LEFT = 80;
const BIRD_SIZE = 35;

/* =========================================================
   ACCOUNT STORAGE
========================================================= */

function loadAccounts() {

    try {

        const saved = localStorage.getItem(ACCOUNTS_KEY);

        accounts = saved ? JSON.parse(saved) : [];

        if (!Array.isArray(accounts)) {
            accounts = [];
        }

    } catch (error) {

        console.error("Could not load accounts:", error);

        accounts = [];
    }

    repairAccounts();
}

function saveAccounts() {

    localStorage.setItem(
        ACCOUNTS_KEY,
        JSON.stringify(accounts)
    );
}

function repairAccounts() {

    const uniqueAccounts = [];
    const usedUIDs = new Set();
    const usedNames = new Set();

    for (const account of accounts) {

        if (!account || typeof account !== "object") {
            continue;
        }

        if (!account.uid || !account.name) {
            continue;
        }

        const normalizedName =
            String(account.name).trim().toLowerCase();

        if (usedUIDs.has(account.uid)) {
            continue;
        }

        if (usedNames.has(normalizedName)) {
            continue;
        }

        account.name = String(account.name).trim();

        account.emoji =
            account.emoji ||
            getRandomEmoji();

        account.balance =
            Number.isFinite(Number(account.balance))
                ? Math.max(0, Number(account.balance))
                : 500;

        if (!Array.isArray(account.transactions)) {
            account.transactions = [
                {
                    text: "🎁 Welcome bonus",
                    amount: 500
                }
            ];
        }

        if (!Array.isArray(account.unlockedVideos)) {
            account.unlockedVideos = [];
        }

        uniqueAccounts.push(account);

        usedUIDs.add(account.uid);
        usedNames.add(normalizedName);
    }

    accounts = uniqueAccounts;

    saveAccounts();
}

/* =========================================================
   UID GENERATOR
========================================================= */

function generateUID() {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let uid;

    do {

        let code = "";

        for (let i = 0; i < 6; i++) {

            code +=
                chars[
                    Math.floor(
                        Math.random() * chars.length
                    )
                ];
        }

        uid = "KID-" + code;

    } while (
        accounts.some(account => account.uid === uid)
    );

    return uid;
}

/* =========================================================
   EMOJI
========================================================= */

function getRandomEmoji() {

    const emojis = [
        "😊",
        "😎",
        "🤩",
        "🥳",
        "😄",
        "🦊",
        "🐼",
        "🐸",
        "🐯",
        "🦄"
    ];

    return emojis[
        Math.floor(
            Math.random() * emojis.length
        )
    ];
}

/* =========================================================
   CURRENT ACCOUNT
========================================================= */

function getCurrentAccount() {

    const uid =
        localStorage.getItem(
            CURRENT_ACCOUNT_KEY
        );

    if (!uid) {
        return null;
    }

    return (
        accounts.find(
            account => account.uid === uid
        ) || null
    );
}

/* =========================================================
   SAVE CURRENT ACCOUNT
========================================================= */

function saveCurrentAccount() {

    if (!currentAccount) {
        return;
    }

    const index =
        accounts.findIndex(
            account =>
                account.uid === currentAccount.uid
        );

    if (index === -1) {
        return;
    }

    accounts[index] = currentAccount;

    saveAccounts();
}

/* =========================================================
   CREATE ACCOUNT
========================================================= */

function createAccount(name) {

    const cleanName =
        name.trim();

    const normalizedName =
        cleanName.toLowerCase();

    const existing =
        accounts.find(
            account =>
                account.name.toLowerCase() ===
                normalizedName
        );

    if (existing) {

        return {
            success: false,
            error:
                "This nickname already has an account. Please log in instead."
        };
    }

    const account = {

        uid: generateUID(),

        name: cleanName,

        emoji: getRandomEmoji(),

        balance: 500,

        transactions: [
            {
                text: "🎁 Welcome bonus",
                amount: 500
            }
        ],

        unlockedVideos: []

    };

    accounts.push(account);

    saveAccounts();

    return {
        success: true,
        account
    };
}

/* =========================================================
   LOGIN EXISTING ACCOUNT
========================================================= */

function loginAccount(account) {

    if (!account) {
        return false;
    }

    currentAccount = account;

    localStorage.setItem(
        CURRENT_ACCOUNT_KEY,
        account.uid
    );

    saveCurrentAccount();

    return true;
}

/* =========================================================
   LOGIN / CREATE FROM INDEX
========================================================= */

function enterWorld() {

    const input =
        document.getElementById("nameInput");

    const error =
        document.getElementById("errorMessage");

    if (!input) {
        return;
    }

    const name =
        input.value.trim();

    if (error) {
        error.textContent = "";
    }

    if (name.length < 2) {

        if (error) {
            error.textContent =
                "Nickname must be at least 2 characters.";
        }

        return;
    }

    if (name.length > 16) {

        if (error) {
            error.textContent =
                "Nickname must be 16 characters or less.";
        }

        return;
    }

    const params =
        new URLSearchParams(
            window.location.search
        );

    const createMode =
        params.get("new") === "1";

    const existing =
        accounts.find(
            account =>
                account.name.toLowerCase() ===
                name.toLowerCase()
        );

    /* -----------------------------------------------------
       CREATE NEW ACCOUNT MODE
    ----------------------------------------------------- */

    if (createMode) {

        if (existing) {

            if (error) {
                error.textContent =
                    "That nickname is already saved. Choose another nickname.";
            }

            return;
        }

        const result =
            createAccount(name);

        if (!result.success) {

            if (error) {
                error.textContent =
                    result.error;
            }

            return;
        }

        loginAccount(result.account);

        window.location.href =
            "home.html";

        return;
    }

    /* -----------------------------------------------------
       NORMAL LOGIN MODE
    ----------------------------------------------------- */

    if (existing) {

        /*
           IMPORTANT:
           Existing account keeps the SAME UID.
           No new UID is generated.
        */

        loginAccount(existing);

        window.location.href =
            "home.html";

        return;
    }

    /* -----------------------------------------------------
       NEW ACCOUNT
    ----------------------------------------------------- */

    const result =
        createAccount(name);

    if (!result.success) {

        if (error) {
            error.textContent =
                result.error;
        }

        return;
    }

    loginAccount(result.account);

    window.location.href =
        "home.html";
}

/* =========================================================
   LOGOUT
========================================================= */

function logoutCurrentAccount() {

    stopGame();

    currentAccount = null;

    localStorage.removeItem(
        CURRENT_ACCOUNT_KEY
    );

    window.location.href =
        "index.html";
}

/* =========================================================
   DELETE CURRENT ACCOUNT
========================================================= */

function deleteCurrentAccount() {

    const account =
        getCurrentAccount();

    if (!account) {

        localStorage.removeItem(
            CURRENT_ACCOUNT_KEY
        );

        window.location.href =
            "index.html";

        return;
    }

    const confirmed =
        window.confirm(
            `Delete the account "${account.name}" permanently?\n\nThis will remove the account, PlayCoins, transactions, and unlocked videos.`
        );

    if (!confirmed) {
        return;
    }

    /*
       IMPORTANT:
       Actually remove the account from the array.
    */

    accounts =
        accounts.filter(
            savedAccount =>
                savedAccount.uid !== account.uid
        );

    /*
       IMPORTANT:
       Save the changed account list.
    */

    saveAccounts();

    /*
       IMPORTANT:
       Remove current login UID.
    */

    localStorage.removeItem(
        CURRENT_ACCOUNT_KEY
    );

    currentAccount = null;

    stopGame();

    window.location.href =
        "index.html";
}

/* =========================================================
   PROTECTED PAGE CHECK
========================================================= */

function requireLogin() {

    const page =
        document.body.dataset.page;

    if (page === "login") {
        return;
    }

    const account =
        getCurrentAccount();

    if (!account) {

        localStorage.removeItem(
            CURRENT_ACCOUNT_KEY
        );

        window.location.replace(
            "index.html"
        );

        return;
    }

    currentAccount = account;
}

/* =========================================================
   LOGIN PAGE
========================================================= */

function initializeLoginPage() {

    const button =
        document.getElementById(
            "enterWorldBtn"
        );

    const input =
        document.getElementById(
            "nameInput"
        );

    const title =
        document.getElementById(
            "loginTitle"
        );

    if (!button || !input) {
        return;
    }

    const params =
        new URLSearchParams(
            window.location.search
        );

    const createMode =
        params.get("new") === "1";

    if (createMode && title) {

        title.textContent =
            "Create New Account";

        button.textContent =
            "CREATE ACCOUNT 🚀";
    }

    /*
       If a valid account is already logged in,
       automatically continue to Home.
    */

    const savedAccount =
        getCurrentAccount();

    if (savedAccount && !createMode) {

        window.location.replace(
            "home.html"
        );

        return;
    }

    button.addEventListener(
        "click",
        enterWorld
    );

    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                enterWorld();
            }

        }
    );
}

/* =========================================================
   HEADER
========================================================= */

function updateHeader() {

    if (!currentAccount) {
        return;
    }

    const nameElements =
        document.querySelectorAll(
            "#playerName"
        );

    const uidElements =
        document.querySelectorAll(
            "#playerUid"
        );

    const avatarElements =
        document.querySelectorAll(
            "#avatar"
        );

    nameElements.forEach(
        element => {
            element.textContent =
                currentAccount.name;
        }
    );

    uidElements.forEach(
        element => {
            element.textContent =
                "UID: " +
                currentAccount.uid;
        }
    );

    avatarElements.forEach(
        element => {
            element.textContent =
                currentAccount.emoji;
        }
    );
}

/* =========================================================
   HOME
========================================================= */

function initializeHomePage() {

    if (!currentAccount) {
        return;
    }

    const welcomeName =
        document.getElementById(
            "welcomeName"
        );

    const balance =
        document.getElementById(
            "balance"
        );

    if (welcomeName) {

        welcomeName.textContent =
            currentAccount.name;
    }

    if (balance) {

        balance.textContent =
            currentAccount.balance;
    }
}

/* =========================================================
   COINS
========================================================= */

function addCoins(amount, reason) {

    if (!currentAccount) {
        return;
    }

    amount =
        Number(amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return;
    }

    currentAccount.balance += amount;

    currentAccount.transactions.unshift({
        text: reason,
        amount: amount
    });

    saveCurrentAccount();

    updateBalanceDisplays();
}

function spendCoins(amount, reason) {

    if (!currentAccount) {
        return false;
    }

    amount =
        Number(amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return false;
    }

    if (
        currentAccount.balance <
        amount
    ) {
        return false;
    }

    currentAccount.balance -= amount;

    currentAccount.transactions.unshift({
        text: reason,
        amount: -amount
    });

    saveCurrentAccount();

    updateBalanceDisplays();

    return true;
}

function updateBalanceDisplays() {

    if (!currentAccount) {
        return;
    }

    const elements =
        document.querySelectorAll(
            "#balance, #walletBalance"
        );

    elements.forEach(
        element => {

            element.textContent =
                currentAccount.balance;
        }
    );
}

/* =========================================================
   WALLET
========================================================= */

function initializeWalletPage() {

    if (!currentAccount) {
        return;
    }

    const balance =
        document.getElementById(
            "walletBalance"
        );

    const list =
        document.getElementById(
            "transactionList"
        );

    if (balance) {

        balance.textContent =
            currentAccount.balance;
    }

    if (!list) {
        return;
    }

    list.innerHTML = "";

    if (
        !currentAccount.transactions ||
        currentAccount.transactions.length === 0
    ) {

        list.innerHTML =
            '<div class="empty-state">No transactions yet.</div>';

        return;
    }

    currentAccount.transactions
        .slice(0, 20)
        .forEach(transaction => {

            const row =
                document.createElement("div");

            row.className =
                "transaction";

            const text =
                document.createElement("span");

            text.className =
                "transaction-text";

            text.textContent =
                transaction.text;

            const amount =
                document.createElement("span");

            amount.className =
                "transaction-amount " +
                (
                    transaction.amount >= 0
                        ? "transaction-positive"
                        : "transaction-negative"
                );

            amount.textContent =
                (
                    transaction.amount >= 0
                        ? "+"
                        : ""
                ) +
                transaction.amount +
                " 🪙";

            row.appendChild(text);
            row.appendChild(amount);

            list.appendChild(row);
        });
}

/* =========================================================
   ACCOUNT SETTINGS
========================================================= */

function initializeAccountsPage() {

    if (!currentAccount) {
        return;
    }

    const avatar =
        document.getElementById(
            "accountAvatar"
        );

    const name =
        document.getElementById(
            "accountName"
        );

    const uid =
        document.getElementById(
            "accountUID"
        );

    if (avatar) {
        avatar.textContent =
            currentAccount.emoji;
    }

    if (name) {
        name.textContent =
            currentAccount.name;
    }

    if (uid) {
        uid.textContent =
            "UID: " +
            currentAccount.uid;
    }

    renderAccountList();

    const createButton =
        document.getElementById(
            "newAccountBtn"
        );

    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );

    const deleteButton =
        document.getElementById(
            "deleteAccountBtn"
        );

    if (createButton) {

        createButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "index.html?new=1";

            }
        );
    }

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            () => {

                const confirmed =
                    window.confirm(
                        "Log out of the current account?"
                    );

                if (confirmed) {
                    logoutCurrentAccount();
                }

            }
        );
    }

    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            deleteCurrentAccount
        );
    }
}

/* =========================================================
   ACCOUNT LIST
========================================================= */

function renderAccountList() {

    const list =
        document.getElementById(
            "accountList"
        );

    if (!list) {
        return;
    }

    list.innerHTML = "";

    if (accounts.length === 0) {

        list.innerHTML =
            '<div class="empty-state">No saved accounts.</div>';

        return;
    }

    accounts.forEach(account => {

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "saved-account";

        if (
            currentAccount &&
            account.uid === currentAccount.uid
        ) {

            wrapper.classList.add(
                "current"
            );
        }

        const info =
            document.createElement("div");

        info.className =
            "saved-account-info";

        const avatar =
            document.createElement("div");

        avatar.className =
            "saved-avatar";

        avatar.textContent =
            account.emoji;

        const textBox =
            document.createElement("div");

        const name =
            document.createElement("strong");

        name.textContent =
            account.name;

        const uid =
            document.createElement("small");

        uid.textContent =
            account.uid;

        textBox.appendChild(name);
        textBox.appendChild(uid);

        info.appendChild(avatar);
        info.appendChild(textBox);

        wrapper.appendChild(info);

        if (
            !currentAccount ||
            account.uid !== currentAccount.uid
        ) {

            const switchButton =
                document.createElement("button");

            switchButton.className =
                "switch-account-btn";

            switchButton.type =
                "button";

            switchButton.textContent =
                "SWITCH";

            switchButton.addEventListener(
                "click",
                () => {

                    loginAccount(account);

                    window.location.href =
                        "home.html";

                }
            );

            wrapper.appendChild(
                switchButton
            );

        } else {

            const currentLabel =
                document.createElement("span");

            currentLabel.className =
                "switch-account-btn";

            currentLabel.textContent =
                "CURRENT";

            wrapper.appendChild(
                currentLabel
            );
        }

        list.appendChild(wrapper);

    });
}

/* =========================================================
   VIDEO SHOP
========================================================= */

function initializeVideosPage() {

    if (!currentAccount) {
        return;
    }

    const buttons =
        document.querySelectorAll(
            ".unlock-video-btn"
        );

    buttons.forEach(button => {

        const videoID =
            button.dataset.videoId;

        const cost =
            Number(
                button.dataset.cost
            );

        if (
            currentAccount.unlockedVideos
                .includes(videoID)
        ) {

            unlockVideoUI(
                videoID,
                button
            );

            return;
        }

        button.addEventListener(
            "click",
            () => {

                if (
                    currentAccount.unlockedVideos
                        .includes(videoID)
                ) {

                    unlockVideoUI(
                        videoID,
                        button
                    );

                    return;
                }

                if (
                    currentAccount.balance <
                    cost
                ) {

                    alert(
                        `You need ${cost} PlayCoins to unlock this video.\n\nYour balance: ${currentAccount.balance} PlayCoins.`
                    );

                    return;
                }

                const success =
                    spendCoins(
                        cost,
                        `📺 Unlocked video`
                    );

                if (!success) {
                    return;
                }

                currentAccount.unlockedVideos
                    .push(videoID);

                saveCurrentAccount();

                unlockVideoUI(
                    videoID,
                    button
                );

            }
        );

    });

}

/* =========================================================
   UNLOCK VIDEO UI
========================================================= */

function unlockVideoUI(
    videoID,
    button
) {

    const card =
        button.closest(
            ".video-card"
        );

    if (!card) {
        return;
    }

    const player =
        card.querySelector(
            ".video-player"
        );

    if (!player) {
        return;
    }

    player.classList.remove(
        "locked-video"
    );

    player.innerHTML = "";

    const iframe =
        document.createElement(
            "iframe"
        );

    /*
       Correct YouTube embed URL.
    */

    iframe.src =
        "https://www.youtube.com/embed/" +
        encodeURIComponent(videoID);

    iframe.title =
        "KID WORLD Video";

    iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

    iframe.allowFullscreen =
        true;

    player.appendChild(
        iframe
    );

    button.textContent =
        "✅ UNLOCKED";

    button.disabled =
        true;

    button.style.opacity =
        "0.65";

    button.style.cursor =
        "default";
}

/* =========================================================
   FLAPPY BIRD
========================================================= */

function initializeGamePage() {

    const startButton =
        document.getElementById(
            "startGameBtn"
        );

    const gameArea =
        document.getElementById(
            "gameArea"
        );

    if (!startButton || !gameArea) {
        return;
    }

    startButton.addEventListener(
        "click",
        startGame
    );

    gameArea.addEventListener(
        "pointerdown",
        event => {

            if (
                gameRunning &&
                event.target === gameArea
            ) {

                flapBird();
            }

        }
    );

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.code === "Space" &&
                gameRunning
            ) {

                event.preventDefault();

                flapBird();
            }

        }
    );

    resetGameDisplay();
}

/* =========================================================
   START GAME
========================================================= */

function startGame() {

    if (gameRunning) {
        return;
    }

    gameRunning = true;

    birdY = 180;

    birdVelocity = 0;

    pipeX = 600;

    pipeGapY =
        randomPipeGap();

    gameScore = 0;

    passedPipe = false;

    updateGameScore();

    const text =
        document.getElementById(
            "gameText"
        );

    const button =
        document.getElementById(
            "startGameBtn"
        );

    if (text) {
        text.textContent = "";
    }

    if (button) {
        button.textContent =
            "FLY! 🐦";
    }

    gameLoop();
}

/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop() {

    if (!gameRunning) {
        return;
    }

    birdVelocity +=
        GRAVITY;

    birdY +=
        birdVelocity;

    pipeX -=
        PIPE_SPEED;

    if (
        pipeX <
        -PIPE_WIDTH
    ) {

        pipeX =
            getGameWidth();

        pipeGapY =
            randomPipeGap();

        passedPipe =
            false;
    }

    checkScore();

    updateGameDisplay();

    if (checkCollision()) {

        endGame();

        return;
    }

    gameAnimation =
        requestAnimationFrame(
            gameLoop
        );
}

/* =========================================================
   FLAP
========================================================= */

function flapBird() {

    if (!gameRunning) {
        return;
    }

    birdVelocity =
        FLAP_POWER;
}

/* =========================================================
   RANDOM PIPE GAP
========================================================= */

function randomPipeGap() {

    const height =
        getGameHeight();

    const minimum =
        80;

    const maximum =
        Math.max(
            minimum,
            height -
            PIPE_GAP -
            80
        );

    return (
        minimum +
        Math.random() *
        (maximum - minimum)
    );
}

/* =========================================================
   GAME DIMENSIONS
========================================================= */

function getGameWidth() {

    const area =
        document.getElementById(
            "gameArea"
        );

    return area
        ? area.clientWidth
        : 600;
}

function getGameHeight() {

    const area =
        document.getElementById(
            "gameArea"
        );

    return area
        ? area.clientHeight
        : 400;
}

/* =========================================================
   UPDATE GAME DISPLAY
========================================================= */

function updateGameDisplay() {

    const bird =
        document.getElementById(
            "gameBird"
        );

    const topPipe =
        document.getElementById(
            "pipeTop"
        );

    const bottomPipe =
        document.getElementById(
            "pipeBottom"
        );

    if (bird) {

        bird.style.top =
            birdY + "px";
    }

    if (topPipe) {

        topPipe.style.right =
            (-pipeX + getGameWidth()) +
            "px";

        topPipe.style.height =
            pipeGapY + "px";
    }

    if (bottomPipe) {

        bottomPipe.style.right =
            (-pipeX + getGameWidth()) +
            "px";

        bottomPipe.style.height =
            (
                getGameHeight() -
                pipeGapY -
                PIPE_GAP
            ) + "px";
    }
}

/* =========================================================
   SCORE
========================================================= */

function checkScore() {

    if (
        !passedPipe &&
        pipeX + PIPE_WIDTH <
        BIRD_LEFT
    ) {

        passedPipe = true;

        gameScore++;

        updateGameScore();
    }
}

function updateGameScore() {

    const score =
        document.getElementById(
            "gameScore"
        );

    if (score) {

        score.textContent =
            gameScore;
    }
}

/* =========================================================
   COLLISION
========================================================= */

function checkCollision() {

    const height =
        getGameHeight();

    /*
       Top/bottom boundaries.
    */

    if (
        birdY < 0 ||
        birdY + BIRD_SIZE >
        height
    ) {

        return true;
    }

    /*
       Pipe collision.
    */

    const birdRight =
        BIRD_LEFT + BIRD_SIZE;

    const pipeLeft =
        pipeX;

    const pipeRight =
        pipeX + PIPE_WIDTH;

    const horizontalCollision =
        birdRight > pipeLeft &&
        BIRD_LEFT < pipeRight;

    if (!horizontalCollision) {
        return false;
    }

    const birdTop =
        birdY;

    const birdBottom =
        birdY + BIRD_SIZE;

    const topPipeBottom =
        pipeGapY;

    const bottomPipeTop =
        pipeGapY + PIPE_GAP;

    const hitsTopPipe =
        birdTop <
        topPipeBottom;

    const hitsBottomPipe =
        birdBottom >
        bottomPipeTop;

    return (
        hitsTopPipe ||
        hitsBottomPipe
    );
}

/* =========================================================
   END GAME
========================================================= */

function endGame() {

    gameRunning = false;

    if (gameAnimation) {

        cancelAnimationFrame(
            gameAnimation
        );

        gameAnimation = null;
    }

    if (
        currentAccount &&
        gameScore > 0
    ) {

        /*
           Reward:
           10 PlayCoins per point.
        */

        const reward =
            gameScore * 10;

        addCoins(
            reward,
            `🐦 Flappy Bird score: ${gameScore}`
        );

        alert(
            `Game Over! 🐦\n\nScore: ${gameScore}\nReward: +${reward} PlayCoins`
        );

    } else {

        alert(
            "Game Over! 🐦\n\nTry again!"
        );
    }

    const button =
        document.getElementById(
            "startGameBtn"
        );

    if (button) {

        button.textContent =
            "PLAY AGAIN 🐦";
    }

    const text =
        document.getElementById(
            "gameText"
        );

    if (text) {

        text.textContent =
            "GAME OVER!";
    }
}

/* =========================================================
   RESET GAME
========================================================= */

function resetGameDisplay() {

    gameRunning = false;

    birdY = 180;

    birdVelocity = 0;

    pipeX = getGameWidth();

    pipeGapY =
        randomPipeGap();

    gameScore = 0;

    passedPipe = false;

    updateGameScore();

    updateGameDisplay();
}

function stopGame() {

    gameRunning = false;

    if (gameAnimation) {

        cancelAnimationFrame(
            gameAnimation
        );

        gameAnimation = null;
    }
}

/* =========================================================
   CHAT
========================================================= */

function initializeChatPage() {

    const input =
        document.getElementById(
            "chatInput"
        );

    const sendButton =
        document.getElementById(
            "sendMessageBtn"
        );

    if (!input || !sendButton) {
        return;
    }

    sendButton.addEventListener(
        "click",
        sendChatMessage
    );

    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                sendChatMessage();
            }

        }
    );
}

/* =========================================================
   SEND CHAT
========================================================= */

function sendChatMessage() {

    const input =
        document.getElementById(
            "chatInput"
        );

    const messages =
        document.getElementById(
            "messages"
        );

    if (!input || !messages) {
        return;
    }

    const message =
        input.value.trim();

    if (!message) {
        return;
    }

    const messageElement =
        document.createElement(
            "div"
        );

    messageElement.className =
        "chat-message";

    const username =
        document.createElement(
            "strong"
        );

    username.textContent =
        currentAccount
            ? currentAccount.name
            : "Player";

    const text =
        document.createElement(
            "p"
        );

    /*
       textContent prevents HTML injection.
    */

    text.textContent =
        message;

    messageElement.appendChild(
        username
    );

    messageElement.appendChild(
        text
    );

    messages.appendChild(
        messageElement
    );

    input.value = "";

    messages.scrollTop =
        messages.scrollHeight;
}

/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadAccounts();

        const page =
            document.body.dataset.page;

        /* -------------------------------------------------
           LOGIN
        ------------------------------------------------- */

        if (page === "login") {

            initializeLoginPage();

            return;
        }

        /* -------------------------------------------------
           PROTECTED PAGES
        ------------------------------------------------- */

        requireLogin();

        if (!currentAccount) {
            return;
        }

        updateHeader();

        /* -------------------------------------------------
           HOME
        ------------------------------------------------- */

        if (page === "home") {

            initializeHomePage();
        }

        /* -------------------------------------------------
           GAMES
        ------------------------------------------------- */

        if (page === "games") {

            initializeGamePage();
        }

        /* -------------------------------------------------
           VIDEOS
        ------------------------------------------------- */

        if (page === "videos") {

            initializeVideosPage();
        }

        /* -------------------------------------------------
           WALLET
        ------------------------------------------------- */

        if (page === "wallet") {

            initializeWalletPage();
        }

        /* -------------------------------------------------
           CHAT
        ------------------------------------------------- */

        if (page === "chat") {

            initializeChatPage();
        }

        /* -------------------------------------------------
           ACCOUNTS
        ------------------------------------------------- */

        if (page === "accounts") {

            initializeAccountsPage();
        }

    }
);