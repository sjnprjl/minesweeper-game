import { GameManager } from "./GameManager";
import "./style.css";

let gameDifficulty: "easy" | "medium" | "hard" = "easy";

const gameContainer = document.getElementById("gameContainer");

if (!gameContainer) throw new Error("gameContainer not found");

const gameManager = new GameManager({ container: gameContainer });
gameManager.init();

// Close dialog
const closeDialog = () => {
  dialog.style.display = "none";
};

const openDialog = () => {
  dialog.style.display = "flex";
};

const startButton = document.getElementById("startButton")!;
const dialog = document.getElementById("menuDialog")!;
const closeButton = document.querySelector(".close-btn")!;

openDialog();

// Open dialog
startButton.addEventListener("click", () => {
  openDialog();
});

closeButton.addEventListener("click", closeDialog);

// Close dialog when clicking outside
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    closeDialog();
  }
});

// Handle difficulty selection
document.querySelectorAll(".difficulty-buttons .btn").forEach((button) => {
  button.addEventListener("click", (e: any) => {
    const difficulty = e.target.dataset.difficulty;

    // Store in variable
    gameDifficulty = difficulty;

    gameManager.setLevel(gameDifficulty);
    gameManager.resetGameState();

    // Close the dialog
    closeDialog();
  });
});

gameManager.onGameOver = (e: any) => {
  console.log(e.detail);
  openDialog();
};
