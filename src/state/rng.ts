export class RNG {
  static random(input: number) {
    let h = input + 0x6d2b79f5;
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    const x = ((h ^ (h >>> 14)) >>> 0) / 4294967296;
    return x;
  }

  static randInt(input: number, min: number, max: number) {
    const rand = this.random(input);
    return Math.floor(rand * (max - min)) + min;
  }

  static sample<T>(input: number, items: T[]): T {
    return items[this.randInt(input, 0, items.length)];
  }

  static hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }
}
