import * as fs from "fs";

const tokens = fs.readFileSync(0, "utf-8").trim().split(/\s+/);
const n = Number(tokens[0]);
const capacity = Number(tokens[1]);
const weights = tokens.slice(2, 2 + n).map(Number).sort((a, b) => b - a);

const boxes: number[] = [];
for (const weight of weights) {
  let placed = false;
  for (let i = 0; i < boxes.length; i += 1) {
    if (boxes[i] >= weight) {
      boxes[i] -= weight;
      placed = true;
      break;
    }
  }
  if (!placed) {
    boxes.push(capacity - weight);
  }
}

console.log(boxes.length);
