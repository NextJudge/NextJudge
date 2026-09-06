import * as fs from "fs";

const tokens = fs.readFileSync(0, "utf-8").trim().split(/\s+/);
const n = Number(tokens[0]);
const counts = tokens.slice(1, 1 + n).map(Number);
const threshold = Number(tokens[1 + n]);

let answer = 0;
for (const value of counts) {
  if (value >= threshold) {
    answer += 1;
  }
}
console.log(answer);
