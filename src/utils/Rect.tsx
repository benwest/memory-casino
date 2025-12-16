export class Rect {
  x: number;
  y: number;
  width: number;
  height: number;

  get right() {
    return this.x + this.width;
  }
  set right(value: number) {
    this.width = value - this.x;
  }

  get bottom() {
    return this.y + this.height;
  }
  set bottom(value: number) {
    this.height = value - this.y;
  }

  get cx() {
    return this.x + this.width / 2;
  }

  get cy() {
    return this.y + this.height / 2;
  }

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  intersects(other: Rect) {
    return !(
      other.x > this.x + this.width ||
      other.x + other.width < this.x ||
      other.y > this.y + this.height ||
      other.y + other.height < this.y
    );
  }

  translate(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
    return this;
  }

  clone() {
    return new Rect(this.x, this.y, this.width, this.height);
  }

  copy(other: Rect) {
    this.x = other.x;
    this.y = other.y;
    this.width = other.width;
    this.height = other.height;
  }

  expand(other: Rect) {
    this.x = Math.min(this.x, other.x);
    this.y = Math.min(this.y, other.y);
    this.right = Math.max(this.right, other.right);
    this.bottom = Math.max(this.bottom, other.bottom);
    return this;
  }

  static fromDOMRect(rect: DOMRect) {
    return new Rect(rect.x, rect.y, rect.width, rect.height);
  }
}
