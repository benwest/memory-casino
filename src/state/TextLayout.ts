import { Rect } from "@/utils/Rect";
import { Char, LinkProps, CharType } from "./Char";
import { content } from "@/content";

export interface TextLayoutParams {
  charWidthPx: number;
  lineHeightPx: number;
  maxWidthPx: number;
  gutterWidthPx: number;
}

const bigSpaces = {
  "[:]": " ".repeat(2),
  "[;]": " ".repeat(7),
  "[.]": " ".repeat(12),
};

const smallSpaces = {
  "[:]": " ".repeat(2),
  "[;]": " ".repeat(4),
  "[.]": " ".repeat(5),
};

export const DURATIONS = {
  slow: 1 / 20,
  medium: 1 / 200,
  fast: 1 / 800,
};

export const PAUSES = {
  long: 1,
  short: 1 / 4,
};

const minColumnSizeLarge = 40;
const minColumnSizeMedium = 27;

interface LayoutContext {
  duration: number;
  link: LinkProps | undefined;
  type: CharType;
}

export class TextLayout {
  readonly lines: Char[][] = [[]];
  readonly chars: Char[] = [];
  readonly charWidthPx: number;
  readonly lineHeightPx: number;
  readonly widthChars: number;
  readonly heightChars: number;
  readonly columnWidthChars: number;
  readonly gutterWidthChars: number;
  readonly breakpoint: "small" | "medium" | "large";
  readonly duration: number;
  get widthPx() {
    return this.charWidthPx * this.widthChars;
  }
  get heightPx() {
    return this.lineHeightPx * this.heightChars;
  }
  readonly linkRects: Map<LinkProps, Rect>;

  private delay = 0;
  private stack: LayoutContext[] = [
    {
      duration: DURATIONS.fast,
      link: undefined as LinkProps | undefined,
      type: "body" as CharType,
    },
  ];
  private get ctx() {
    return this.stack.at(-1)!;
  }

  constructor(public params: TextLayoutParams) {
    this.charWidthPx = params.charWidthPx;
    this.lineHeightPx = params.lineHeightPx;

    const columnWidthPx = (params.maxWidthPx - params.gutterWidthPx) / 2;
    this.columnWidthChars = Math.floor(columnWidthPx / params.charWidthPx);

    /*if (this.columnWidthChars >= minColumnSizeLarge) {
      this.breakpoint = "large";
    } else*/ if (this.columnWidthChars >= minColumnSizeMedium) {
      this.breakpoint = "medium";
    } else {
      this.breakpoint = "small";
    }

    this.widthChars = Math.floor(params.maxWidthPx / params.charWidthPx);
    if (this.breakpoint === "small") {
      this.widthChars = Math.floor(this.widthChars / 2) * 2;
    }

    this.gutterWidthChars = this.widthChars - this.columnWidthChars * 2;

    if (this.breakpoint === "large") {
      this.pushLargeHeader();
    } else if (this.breakpoint === "medium") {
      this.pushMediumHeader();
    } else {
      this.pushSmallHeader();
    }

    const emptyLines = this.breakpoint === "large" ? 7 : 6;
    this.ctx.duration = DURATIONS.fast;
    this.ctx.type = "gap";
    for (let i = 0; i < emptyLines; i++) {
      this.newline();
      this.wait(PAUSES.short);
    }
    this.wait(PAUSES.long);

    const spaceReplacements =
      this.breakpoint === "large" ? bigSpaces : smallSpaces;

    for (let i = 0; i < content.body.length; i++) {
      const spaced = this.replace(content.body[i], spaceReplacements);
      this.ctx.duration = DURATIONS.medium;
      this.ctx.type = "body";
      for (const line of this.lineWrap(spaced)) {
        this.push(line);
        this.newline();
        this.wait(PAUSES.short);
      }
      this.wait(PAUSES.long);
      if (i < content.body.length - 1) {
        this.ctx.duration = DURATIONS.fast;
        this.ctx.type = "gap";
        this.newline();
        this.wait(PAUSES.long);
      }
    }

    this.ctx.duration = DURATIONS.fast;
    this.ctx.type = "gap";
    for (let i = 0; i < 3; i++) {
      this.newline();
      this.wait(i === 2 ? PAUSES.long : PAUSES.short);
    }

    for (let i = 0; i < content.credits.length; i++) {
      const spaced = this.replace(content.credits[i], spaceReplacements);
      this.ctx.duration = DURATIONS.medium;
      this.ctx.type = "body";
      for (const line of this.lineWrap(spaced)) {
        this.push(line);
        this.newline();
        this.wait(PAUSES.short);
      }
      if (i < content.credits.length - 1) {
        this.ctx.duration = DURATIONS.fast;
        this.ctx.type = "gap";
        this.newline();
        this.wait(PAUSES.short);
      }
    }

    while (this.currentLine.length === 0) this.lines.pop();
    this.heightChars = this.lines.length;
    this.duration = this.delay;

    this.linkRects = this.getLinkRects();
  }

  lineIndexAtTime(time: number) {
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const line = this.lines[i];
      if (line.length === 0) continue;
      if (time >= line[0].transitionInDelay) return i;
    }
    return 0;
  }

  lineDelay(index: number) {
    if (index < 0 || index > this.lines.length) {
      throw new Error("Line index out of bounds");
    }
    return this.lines[index][0].transitionInDelay;
  }

  lineDuration(index: number) {
    if (index < 0 || index > this.lines.length) {
      throw new Error("Line index out of bounds");
    }
    const line = this.lines[index];
    if (line.length === 0) return 0;
    const startTime = line[0].transitionInDelay;
    if (index === this.lines.length - 1) {
      return this.duration - startTime;
    } else {
      const nextLine = this.lines[index + 1];
      return nextLine[0].transitionInDelay - startTime;
    }
  }

  private getLinkRects() {
    const links = new Map<LinkProps, Rect>();
    for (const char of this.chars) {
      if (!char.link) continue;
      if (!links.has(char.link)) {
        links.set(char.link, char.rect.clone());
      } else {
        links.get(char.link)!.expand(char.rect);
      }
    }
    return links;
  }

  private save() {
    this.stack.push({ ...this.ctx });
  }

  private restore() {
    if (this.stack.length === 1)
      throw new Error("Cannot restore layout context");
    this.stack.pop();
  }

  private get currentLine() {
    return this.lines.at(-1)!;
  }

  private push(value: string) {
    if (value.length > 1) {
      for (const v of value) this.push(v);
      return;
    }

    if (this.currentLine.length === this.widthChars) {
      this.newline();
    }

    const x = this.currentLine.length * this.charWidthPx;
    const y = (this.lines.length - 1) * this.lineHeightPx;

    const char = new Char({
      index: this.chars.length,
      value,
      rect: new Rect(x, y, this.charWidthPx, this.lineHeightPx),
      transitionInDelay: this.delay,
      type: this.ctx.type,
      link: this.ctx.link,
    });
    this.currentLine.push(char);
    this.chars.push(char);

    this.wait(this.ctx.duration);
  }

  private newline(value = " ") {
    const remaining = this.widthChars - this.currentLine.length;
    if (remaining > 0) this.push(value.repeat(remaining));
    this.lines.push([]);
  }

  private wait(time: number) {
    this.delay += time;
  }

  private pushLargeHeader() {
    this.save();

    this.ctx.duration = DURATIONS.slow;

    const pushLink = (film: (typeof content.films)[0]) => {
      this.save();
      this.ctx.link = film.link;
      this.ctx.type = film.link ? "link" : "inactive-link";
      this.push(
        this.spaceBetween(film.longTitle, film.subtitle, this.columnWidthChars)
      );
      this.restore();
    };

    pushLink(content.films[0]);
    const spaces = " ".repeat(this.gutterWidthChars);
    this.ctx.type = "gap";
    this.push(spaces);
    pushLink(content.films[1]);
    this.wait(PAUSES.long);

    this.restore();
  }

  private pushMediumHeader() {
    this.save();

    for (let i = 0; i < content.films.length; i++) {
      this.save();
      if (i === 0) {
        this.ctx.duration = DURATIONS.slow;
        this.ctx.type = "title";
        this.push(content.title);
        this.ctx.duration = DURATIONS.slow;
        this.push(
          " ".repeat(
            this.columnWidthChars + this.gutterWidthChars - content.title.length
          )
        );
      } else {
        this.ctx.duration = DURATIONS.slow;
        this.push(" ".repeat(this.columnWidthChars + this.gutterWidthChars));
      }
      this.restore();

      this.save();
      const film = content.films[i];
      this.ctx.duration = DURATIONS.slow;
      this.ctx.link = film.link;
      this.ctx.type = film.link ? "link" : "inactive-link";
      this.push(
        this.spaceBetween(film.shortTitle, film.subtitle, this.columnWidthChars)
      );
      this.restore();

      this.wait(PAUSES.long);
    }

    // const pushLink = (film: (typeof content.films)[0]) => {
    //   this.save();
    //   this.ctx.link = film.link;
    //   this.ctx.type = film.link ? "link" : "inactive-link";
    //   this.push(
    //     this.spaceBetween(film.shortTitle, film.subtitle, this.columnWidthChars)
    //   );
    //   this.restore();
    // };

    // this.save();
    // this.ctx.type = "title";
    // this.push(content.title);
    // const spaces =
    //   this.columnWidthChars - content.title.length + this.gutterWidthChars;
    // this.push(" ".repeat(spaces));
    // this.restore();

    // pushLink(content.films[0]);
    // this.wait(PAUSES.long);
    // this.ctx.duration = DURATIONS.fast;
    // this.newline();
    // this.newline();
    // this.wait(PAUSES.long);
    // this.push(" ".repeat(this.columnWidthChars + this.gutterWidthChars));
    // this.ctx.duration = DURATIONS.slow;
    // pushLink(content.films[1]);
    // this.wait(PAUSES.long);

    this.restore();
  }

  private pushSmallHeader() {
    const halfWidth = Math.floor(this.widthChars / 2);
    this.save();
    this.ctx.duration = DURATIONS.slow;
    this.ctx.type = "title";
    this.push(content.title);
    this.newline();
    this.wait(PAUSES.long);

    this.ctx.duration = DURATIONS.fast;
    this.ctx.type = "gap";
    this.newline();
    this.wait(PAUSES.long);

    this.ctx.duration = DURATIONS.slow;
    for (const film of content.films) {
      this.ctx.link = film.link;
      this.ctx.type = film.link ? "link" : "inactive-link";
      this.push(film.shortTitle.padEnd(halfWidth, " "));
      this.push(film.subtitle.padEnd(halfWidth, " "));
    }
    this.wait(PAUSES.long);

    this.restore();
  }

  private spaceBetween(left: string, right: string, width: number) {
    const spaceWidth = width - left.length - right.length;
    return (
      left.slice(0, width) +
      " ".repeat(spaceWidth) +
      right.slice(0, width - left.length)
    );
  }

  private lineWrap(text: string) {
    const lines: string[] = [];
    let currentLine = "";
    let currentWord = "";

    const pushLine = () => {
      lines.push(currentLine);
      currentLine = "";
    };

    const pushWord = () => {
      if (currentLine.length + currentWord.length > this.widthChars) {
        pushLine();
      }
      currentLine += currentWord;
      currentWord = "";
    };

    const pushSpace = () => {
      if (currentLine.length === 0) return;
      if (currentLine.length === this.widthChars) {
        pushLine();
        return;
      }
      currentLine += " ";
    };

    for (const char of text) {
      if (char === " ") {
        pushWord();
        pushSpace();
      } else {
        currentWord += char;
      }
    }
    pushWord();
    if (currentLine.length > 0) pushLine();

    return lines;
  }

  private replace(text: string, replacements: Record<string, string>) {
    for (const [key, value] of Object.entries(replacements)) {
      text = text.replaceAll(key, value);
    }
    return text;
  }
}

function shuffle<T>(array: T[]): T[] {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
