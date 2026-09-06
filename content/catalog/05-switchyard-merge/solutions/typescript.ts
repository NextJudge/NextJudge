import * as fs from "fs";

const lines = fs.readFileSync(0, "utf-8").trim().split("\n");
const [m, n] = lines[0].split(/\s+/).map(Number);
let lineIdx = 1;
const left = m > 0 ? lines[lineIdx].split(/\s+/).map(Number) : [];
if (m > 0) {
  lineIdx += 1;
}
const right = n > 0 ? lines[lineIdx].split(/\s+/).map(Number) : [];

let i = 0;
let j = 0;
const out: number[] = [];

while (i < m && j < n) {
  if (left[i] <= right[j]) {
    out.push(left[i]);
    i += 1;
  } else {
    out.push(right[j]);
    j += 1;
  }
}

while (i < m) {
  out.push(left[i]);
  i += 1;
}
while (j < n) {
  out.push(right[j]);
  j += 1;
}

console.log(out.join(" "));
