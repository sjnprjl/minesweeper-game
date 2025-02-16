import { Cell } from "./Cell";
import { indexToCoords, randomInt } from "./utils";

export class Minesweeper {
  public board!: Cell[][];

  public omitIdx: number = -1;

  private colors = [
    "#0000FF", // 1 - Blue
    "#008000", // 2 - Green
    "#FF0000", // 3 - Red
    "#000080", // 4 - Dark Blue
    "#800000", // 5 - Maroon
    "#008080", // 6 - Turquoise
    "#000000", // 7 - Black
    "#808080", // 8 - Gray
  ] as const;

  constructor(
    private rows: number,
    private cols: number,
    public mines: number
  ) {
    this.initBoard();
  }

  public initBoard() {
    const _board = [...new Array(this.rows).fill(0)].map((_, y) =>
      [...new Array(this.cols).fill(0)].map(
        (_, x) => new Cell(x + y * this.cols, x, y)
      )
    );

    this.board = _board;
  }

  resetBoard(rows: number, cols: number) {
    this.omitIdx = -1;
    this.rows = rows;
    this.cols = cols;
    this.board.forEach((row) => row.forEach((cell) => cell.reset(false)));
    this.initBoard();
  }

  generateMines() {
    this.fillMines();
    this.genInfo();
  }

  private fillMines() {
    const clickedCell = this.getCellById(this.omitIdx);
    const neighbors = this.getNeighbors(clickedCell.x, clickedCell.y);
    const omitIdx: number[] = [this.omitIdx];
    for (let neighbor of Object.values(neighbors)) {
      if (neighbor) omitIdx.push(neighbor.id);
    }

    let idx = [...new Array(this.cols * this.rows)]
      .map((_, i) => i)
      .filter((i) => !omitIdx.some((id) => id === i));
    let count = this.mines;
    while (count--) {
      const randId = randomInt(0, idx.length - 1);
      const id = idx[randId];
      idx[randId] = idx.pop() as number;
      const { x, y } = indexToCoords(id, this.cols);
      this.board[y][x].mine = true;
    }
  }

  public getNeighbors(x: number, y: number) {
    const l = x - 1;
    const r = x + 1;
    const t = y - 1;
    const d = y + 1;

    return {
      left: l >= 0 && this.board[y][l],
      right: r < this.cols && this.board[y][r],
      top: t >= 0 && this.board[t][x],
      bottom: d < this.rows && this.board[d][x],
      topLeft: t >= 0 && l >= 0 && this.board[t][l],
      topRight: t >= 0 && r < this.cols && this.board[t][r],
      bottomLeft: d < this.rows && l >= 0 && this.board[d][l],
      bottomRight: d < this.rows && r < this.cols && this.board[d][r],
    };
  }

  private genInfo() {
    this.board.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (!cell.isEmpty) {
          return;
        }

        let countMine = 0;
        const neighbors = this.getNeighbors(j, i);

        if (neighbors.left && neighbors.left.mine) countMine++;

        if (neighbors.right && neighbors.right.mine) countMine++;
        if (neighbors.top && neighbors.top.mine) countMine++;

        if (neighbors.bottom && neighbors.bottom.mine) countMine++;

        if (neighbors.topLeft && neighbors.topLeft.mine) countMine++;

        if (neighbors.bottomLeft && neighbors.bottomLeft.mine) countMine++;

        if (neighbors.topRight && neighbors.topRight.mine) countMine++;

        if (neighbors.bottomRight && neighbors.bottomRight.mine) countMine++;

        this.board[i][j].neighborsMineCount = countMine;
        this.board[i][j].isEmpty = countMine === 0;
        this.board[i][j].color =
          countMine === 0 ? "" : this.colors[countMine - 1];
      });
    });
  }

  /**
   *
   * @param x
   * @param y
   * @returns true if clicked on mine
   */
  public clickAt(x: number, y: number): boolean {
    const cell = this.board[y][x];

    if (cell.isFlagged) return false;

    if (cell.mine) {
      // todo: game over
      cell.open();
      return true;
    }
    this.openCells(cell);

    return false;
  }

  private openCells(cell: Cell) {
    if (cell.mine || cell.isOpened) return;
    if (!cell.isEmpty) return cell.open();

    // if empty cell, open the same and neighbors
    cell.open();
    const neighbors = this.getNeighbors(cell.x, cell.y);
    if (neighbors.left && neighbors.left.isOpenable)
      this.openCells(neighbors.left);
    if (neighbors.right && neighbors.right.isOpenable)
      this.openCells(neighbors.right);
    if (neighbors.top && neighbors.top.isOpenable)
      this.openCells(neighbors.top);
    if (neighbors.bottom && neighbors.bottom.isOpenable)
      this.openCells(neighbors.bottom);
    if (neighbors.topLeft && neighbors.topLeft.isOpenable)
      this.openCells(neighbors.topLeft);
    if (neighbors.topRight && neighbors.topRight.isOpenable)
      this.openCells(neighbors.topRight);
    if (neighbors.bottomLeft && neighbors.bottomLeft.isOpenable)
      this.openCells(neighbors.bottomLeft);
    if (neighbors.bottomRight && neighbors.bottomRight.isOpenable)
      this.openCells(neighbors.bottomRight);
    return;
  }

  getGameState(): "win" | "playable" {
    let openedCellCount = 0;
    const totalCells = this.rows * this.cols;

    this.board.forEach((row) => {
      row.forEach((cell) => {
        if (cell.isOpened) openedCellCount++;
      });
    });
    return totalCells - openedCellCount === this.mines ? "win" : "playable";
  }

  getFlaggedMineCount() {
    let count = 0;
    this.board.forEach((row) => {
      row.forEach((cell) => {
        if (cell.isFlagged) count++;
      });
    });
    return count;
  }

  getCellById(id: number) {
    const y = Math.floor(id / this.cols);
    const x = id % this.cols;
    return this.board[y][x];
  }

  printBoard() {
    const board = this.board
      .map((row) =>
        row
          .map((cell) => (cell.mine ? "*" : cell.neighborsMineCount))
          .join("  ")
      )
      .reduce((ac, c) => ac + c + "\n", "");
    console.log(board);
  }

  openAllMines() {
    this.board.forEach((row) => {
      row.forEach((cell) => {
        if (cell.mine && !cell.isOpened) cell.open();
        if (cell.isIncorrectlyFlagged()) cell.cellDOM.style.background = "#f00";
      });
    });
  }
}
