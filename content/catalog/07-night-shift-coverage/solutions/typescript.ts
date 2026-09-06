import * as fs from "fs";

const lines = fs.readFileSync(0, "utf-8").trim().split("\n");
const n = Number(lines[0]);
const events: Array<[number, number]> = [];

for (let i = 1; i <= n; i += 1) {
  const [start, end] = lines[i].split(/\s+/).map(Number);
  events.push([start, 1]);
  events.push([end, -1]);
}

events.sort((a, b) => {
  if (a[0] !== b[0]) {
    return a[0] - b[0];
  }
  return a[1] - b[1];
});

let active = 0;
let best = 0;
for (const [, delta] of events) {
  active += delta;
  best = Math.max(best, active);
}

console.log(best);
