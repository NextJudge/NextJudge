import * as fs from "fs";

const lines = fs.readFileSync(0, "utf-8").trim().split("\n");
const n = Number(lines[0]);
const unique = new Set(lines.slice(1, 1 + n));
console.log(unique.size);
