import { Cell } from "./Cell";
import { Minesweeper } from "./Minesweeper";
import { onClick } from "./utils";

export class GameManager {
  private _time: number = 0;
  private timer: number = 0;
  private _gameState: "win" | "lose" | "start" | "stop" = "stop";
  private static levels = {
    easy: { rows: 8, cols: 8, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 },
  } as const;

  private level: keyof typeof GameManager.levels = "easy";

  private rows!: number;
  private cols!: number;
  private mines!: number;

  private readonly settings: {
    container: HTMLElement;
    debug?: boolean;
  };
  private containerWidth!: number;
  private containerHeight!: number;

  private gameGrid?: HTMLElement;

  private MineCountDOM!: HTMLElement;
  private TimerDOM!: HTMLElement;
  private StartButtonDOM!: HTMLElement;

  private minesweeper!: Minesweeper;

  private IOEvents = {
    ctrlPressed: false,
    keydownPressed: false,
  };

  public readonly GAME_EVENTS = {
    ON_GAME_OVER: "onGameOver",
  };

  public onGameOver?: (e: Event) => void;

  constructor(settings: typeof this.settings) {
    this.settings = settings;
    this.setLevel(this.level);

    this.settings.container.addEventListener(
      this.GAME_EVENTS.ON_GAME_OVER,
      (e) => this.onGameOver?.(e)
    );
  }

  private updateContainerSize() {
    const width = Math.min(window.innerWidth * 0.95, 600);
    const height = Math.min(window.innerHeight * 0.95, 700);
    this.containerHeight = height;
    this.containerWidth = width;
  }

  setLevel(level: keyof typeof GameManager.levels) {
    this.level = level;
    this.rows = GameManager.levels[level].rows;
    this.cols = GameManager.levels[level].cols;
    this.mines = GameManager.levels[level].mines;
  }

  init() {
    this.minesweeper = new Minesweeper(this.rows, this.cols, this.mines);
    this.updateContainerSize();
    this.initTopBarDOM();
    this.initContainer();
    this.initEvents();
  }

  private initTimer() {
    this._time = 0;
    const SECOND = 1000;
    this.timer = setInterval(() => {
      if (this._time >= 999) clearInterval(this.timer);
      else {
        this._time++;
        this.renderTimer();
      }
    }, SECOND);
  }

  private startGame() {
    if (this._gameState === "start") return;
    this._gameState = "start";
    if (this.settings.debug) this.minesweeper.printBoard();
    this.initTimer();
  }

  private emojiFaceState(state: "happy" | "sad" | "dead" | "winner") {
    switch (state) {
      case "happy":
        return "😀";
      case "sad":
        return "😐";
      case "dead":
        return "💀";
      case "winner":
        return "😎";
    }
  }

  private initTopBarDOM() {
    const container = document.createElement("div");
    container.className = "top-bar";

    const mineCountDOM = document.createElement("p");
    mineCountDOM.className = "clock-font";
    this.MineCountDOM = mineCountDOM;
    this.renderMineCount();

    const timerDOM = document.createElement("p");
    timerDOM.className = "clock-font";
    this.TimerDOM = timerDOM;
    this.renderTimer();

    const startButtonDOM = document.createElement("button");
    startButtonDOM.className = "start-button";
    startButtonDOM.id = "startButton";
    this.StartButtonDOM = startButtonDOM;
    this.renderStartButton("happy");

    container.append(mineCountDOM);
    container.append(startButtonDOM);
    container.append(timerDOM);

    this.settings.container.append(container);
  }

  private renderStartButton(state: "happy" | "sad" | "dead" | "winner") {
    this.StartButtonDOM.textContent = this.emojiFaceState(state) + "";
  }

  private renderMineCount() {
    const left = this.mines - this.minesweeper.getFlaggedMineCount();

    this.MineCountDOM.innerText =
      left < 0 ? left.toString() : left.toString().padStart(3, "0");
  }

  private renderTimer() {
    this.TimerDOM.innerText = this._time.toString().padStart(3, "0");
  }

  private initEvents() {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Control") this.IOEvents.ctrlPressed = true;
    });
    window.addEventListener("keyup", (e) => {
      if (e.key === "Control") this.IOEvents.ctrlPressed = false;
    });

    window.addEventListener("resize", this.resizeDOMs.bind(this));
  }

  private resizeDOMs() {
    this.updateContainerSize();
    document.documentElement.style.setProperty("--grid-cols", this.cols + "");
    document.documentElement.style.setProperty("--grid-rows", this.rows + "");

    const rowSize = this.containerHeight / this.rows;
    const colSize = this.containerWidth / this.cols;

    const size = Math.min(rowSize, colSize);

    document.documentElement.style.setProperty(
      "--font-size",
      size * 0.9 + "px"
    );
    document.documentElement.style.setProperty("--row-size", size + "px");
    document.documentElement.style.setProperty("--col-size", size + "px");

    this.settings.container.style.width = this.containerWidth + "px";
    this.settings.container.style.height = this.containerHeight + "px";

    if (this.gameGrid) {
      // this.gameGrid.style.width = this.containerWidth + "px";
      // this.gameGrid.style.height = this.containerHeight + "px";
    }
  }

  private initContainer() {
    // initial resize doms
    this.resizeDOMs();
    // setup game grid
    const gameGrid = document.createElement("div");
    gameGrid.className = "game-grid";
    gameGrid.style.width = this.containerWidth + "px";
    gameGrid.style.height = this.containerHeight + "px";

    this.gameGrid = gameGrid;
    this.settings.container.append(gameGrid);
    this.createCells();
  }

  private createCells() {
    this.minesweeper.board.forEach((row, _) => {
      row.forEach((cell, _) => {
        const el = document.createElement("button");
        el.className = "cell";

        onClick(
          el,
          (eventType, e) => {
            if (this._gameState === "lose" || this._gameState === "win") return;

            if (eventType === "keyup") this.onCellClicked(cell);
            else if (eventType === "longPress") {
              e?.preventDefault();
              e?.stopPropagation();
              this.IOEvents.ctrlPressed = true;
              this.onCellClicked(cell);
              this.IOEvents.ctrlPressed = false;
            } else if (eventType === "keydown") {
              this.renderStartButton("sad");
            }
          },
          500
        );

        cell.cellDOM = el;
        this.gameGrid?.append(el);
      });
    });
  }

  private onCellClicked(cell: Cell) {
    if (cell.isOpened) return; // do nothing if the cell is already opened

    if (this._gameState !== "start") {
      this.startGame();
    }

    let isGameOver = false;

    if (this.IOEvents.ctrlPressed) {
      cell.flag();
    } else {
      if (this.minesweeper.omitIdx === -1) {
        this.minesweeper.omitIdx = cell.id;
        this.minesweeper.generateMines(); // fill board with mines on start
        if (this.settings.debug) this.minesweeper.printBoard();
      }
      isGameOver = this.minesweeper.clickAt(cell.x, cell.y);
    }

    if (isGameOver) {
      clearInterval(this.timer);
      this._gameState = "lose";
      this.dispatchEvent("ON_GAME_OVER", { gameState: this._gameState });
      console.log("you lose");
    } else {
      const gameState = this.minesweeper.getGameState();
      if (gameState === "win") {
        clearInterval(this.timer);
        this._gameState = "win";
        this.dispatchEvent("ON_GAME_OVER", { gameState: this._gameState });
      }
    }
    this.renderDOM();
  }

  private renderCells() {
    this.minesweeper.board.forEach((row, _) => {
      row.forEach((cell, _) => {
        this.renderCell(cell);
      });
    });
  }

  private renderCell(cell: Cell) {
    if (cell.isOpened && cell._isDirty) {
      return;
    }
    cell.cellDOM.innerText = cell.toString();
    cell.cellDOM.style.color = cell.color;
    cell.isOpened ? cell.cellDOM.classList.add("opened") : null;
    if (cell.isOpened) cell._isDirty = true;
  }

  private renderDOM() {
    if (this._gameState === "lose") this.renderStartButton("dead");
    else if (this._gameState === "win") this.renderStartButton("winner");
    else this.renderStartButton("happy");
    this.renderCells();
    this.renderMineCount();
  }

  resetGameState() {
    this.minesweeper.mines = this.mines;
    this.minesweeper.resetBoard(this.rows, this.cols);
    this.createCells();
    this.resizeDOMs();
    this._time = 0;
    clearTimeout(this.timer);
    this._gameState = "stop";
    this.renderDOM();
  }

  dispatchEvent(event: keyof typeof this.GAME_EVENTS, data: any) {
    this.settings.container.dispatchEvent(
      new CustomEvent(this.GAME_EVENTS[event], { detail: data })
    );
  }
}
