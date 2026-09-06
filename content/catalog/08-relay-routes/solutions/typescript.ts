import * as fs from "fs";

const lines = fs.readFileSync(0, "utf-8").trim().split("\n");
const [rows, cols] = lines[0].split(/\s+/).map(Number);
const grid = lines.slice(1, 1 + rows);

let start: [number, number] = [0, 0];
let goal: [number, number] = [0, 0];

for (let i = 0; i < rows; i += 1) {
  for (let j = 0; j < cols; j += 1) {
    if (grid[i][j] === "S") {
      start = [i, j];
    } else if (grid[i][j] === "E") {
      goal = [i, j];
    }
  }
}

const dirs: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const seen = new Set<string>([`${start[0]},${start[1]}`]);
const queue: Array<[number, number, number]> = [[start[0], start[1], 0]];

let answer = -1;
while (queue.length > 0) {
  const [row, col, dist] = queue.shift() as [number, number, number];
  if (row === goal[0] && col === goal[1]) {
    answer = dist;
    break;
  }
  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    const key = `${nr},${nc}`;
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
      continue;
    }
    if (grid[nr][nc] === "#" || seen.has(key)) {
      continue;
    }
    seen.add(key);
    queue.push([nr, nc, dist + 1]);
  }
}

console.log(answer);
