import * as fs from "fs";

class SegTree {
  private readonly size: number;
  private readonly tree: number[];

  constructor(values: number[]) {
    const n = values.length;
    let size = 1;
    while (size < n) {
      size <<= 1;
    }
    this.size = size;
    this.tree = new Array<number>(2 * size).fill(0);
    for (let i = 0; i < n; i += 1) {
      this.tree[size + i] = values[i];
    }
    for (let i = size - 1; i > 0; i -= 1) {
      this.tree[i] = Math.max(this.tree[2 * i], this.tree[2 * i + 1]);
    }
  }

  query(left: number, right: number): number {
    let l = left + this.size;
    let r = right + this.size;
    let best = 0;
    while (l <= r) {
      if (l % 2 === 1) {
        best = Math.max(best, this.tree[l]);
        l += 1;
      }
      if (r % 2 === 0) {
        best = Math.max(best, this.tree[r]);
        r -= 1;
      }
      l = Math.floor(l / 2);
      r = Math.floor(r / 2);
    }
    return best;
  }
}

const lines = fs.readFileSync(0, "utf-8").trim().split("\n");
const [n, q] = lines[0].split(/\s+/).map(Number);
const values = lines[1].split(/\s+/).map(Number);
const tree = new SegTree(values);

const out: string[] = [];
for (let i = 0; i < q; i += 1) {
  const [left, right] = lines[2 + i].split(/\s+/).map(Number);
  out.push(String(tree.query(left - 1, right - 1)));
}
console.log(out.join("\n"));
