import * as fs from "fs";

const divisors = (total: number): number[] => {
  const small: number[] = [];
  const large: number[] = [];
  for (let d = 1; d * d <= total; d += 1) {
    if (total % d === 0) {
      small.push(d);
      if (d * d !== total) {
        large.push(total / d);
      }
    }
  }
  return small.concat(large.reverse());
};

const tokens = fs.readFileSync(0, "utf-8").trim().split(/\s+/);
const n = Number(tokens[0]);
const values = tokens.slice(1, 1 + n).map(Number);
const total = values.reduce((sum, value) => sum + value, 0);

let answer = 0;
for (const target of divisors(total)) {
  let running = 0;
  let ok = true;
  for (const value of values) {
    running += value;
    if (running === target) {
      running = 0;
    } else if (running > target) {
      ok = false;
      break;
    }
  }
  if (ok && running === 0) {
    answer += 1;
  }
}

console.log(answer);
