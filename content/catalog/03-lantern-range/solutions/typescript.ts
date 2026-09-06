import * as fs from "fs";

const lines = fs.readFileSync(0, "utf-8").trim().split("\n");
const n = Number(lines[0]);
const values = lines[1].split(/\s+/).map(Number);
const q = Number(lines[2]);

const pref: number[] = [0];
for (const value of values) {
  pref.push(pref[pref.length - 1] + value);
}

const out: string[] = [];
for (let i = 0; i < q; i += 1) {
  const [left, right] = lines[3 + i].split(/\s+/).map(Number);
  out.push(String(pref[right] - pref[left - 1]));
}
console.log(out.join("\n"));
