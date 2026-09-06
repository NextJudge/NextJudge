import * as fs from "fs";

class Fenwick {
  private readonly size: number;
  private readonly tree: number[];

  constructor(size: number) {
    this.size = size;
    this.tree = new Array<number>(size + 1).fill(0);
  }

  add(index: number, delta: number): void {
    let i = index;
    while (i <= this.size) {
      this.tree[i] += delta;
      i += i & -i;
    }
  }

  prefix(index: number): number {
    let total = 0;
    let i = index;
    while (i > 0) {
      total += this.tree[i];
      i -= i & -i;
    }
    return total;
  }
}

const lines = fs.readFileSync(0, "utf-8").trim().split("\n");
const [n, m] = lines[0].split(/\s+/).map(Number);
const sales = lines[1].split(/\s+/).map(Number);
const q = Number(lines[2]);

const bit = new Fenwick(m);
for (const band of sales) {
  bit.add(band, 1);
}

const out: string[] = [];
for (let i = 0; i < q; i += 1) {
  const x = Number(lines[3 + i]);
  out.push(String(bit.prefix(x)));
}
console.log(out.join("\n"));
