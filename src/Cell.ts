export class Cell {
  private _isOpened = false;
  public mine: boolean = false;
  public isEmpty = true;
  public neighborsMineCount = 0;
  public isFlagged = false;
  public cellDOM!: HTMLElement;
  public _isDirty = false;
  public color = "";

  constructor(public readonly id: number, public x: number, public y: number) {}

  /**
   * Resets the cell to its initial state.
   * @param softReset Whether to remove the cell's DOM element. If false, the
   * cell's DOM element will be removed. Defaults to true.
   */
  reset(softReset = true) {
    this._isOpened = false;
    this.mine = false;
    this.isEmpty = true;
    this.neighborsMineCount = 0;
    this.isFlagged = false;
    this._isDirty = false;
    this.color = "";
    if(!softReset) this.cellDOM.remove();
  }


  open() {
    if (this.isFlagged) return;
    this._isOpened = true;
  }

  get isOpened() {
    return this._isOpened;
  }

  get isOpenable() {
    return !this.isOpened && !this.isFlagged;
  }

  toString() {
    if (!this.isOpened && !this.isFlagged) return "";
    return this.isFlagged
      ? "🚩"
      : this.mine
      ? "💣"
      : this.isEmpty
      ? ""
      : this.neighborsMineCount.toString();
  }

  flag() {
    this.isFlagged = !this.isFlagged;
  }
}
