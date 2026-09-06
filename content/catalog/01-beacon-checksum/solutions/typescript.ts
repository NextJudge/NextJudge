import * as fs from "fs";

const word = fs.readFileSync(0, "utf-8").trim();
let sum = 0;
for (const ch of word) {
  sum += ch.charCodeAt(0);
}
console.log(sum % 256);
