import * as fs from "fs";

const tokens = fs.readFileSync(0, "utf-8").trim().split(/\s+/);
const n = Number(tokens[0]);
const k = Number(tokens[1]);
const values = tokens.slice(2, 2 + n).map(Number);

const dq: number[] = [];
const out: number[] = [];

for (let i = 0; i < n; i += 1) {
  while (dq.length > 0 && dq[0] <= i - k) {
    dq.shift();
  }
  while (dq.length > 0 && values[dq[dq.length - 1]] <= values[i]) {
    dq.pop();
  }
  dq.push(i);
  if (i >= k - 1) {
    out.push(values[dq[0]]);
  }
}

console.log(out.join(" "));
