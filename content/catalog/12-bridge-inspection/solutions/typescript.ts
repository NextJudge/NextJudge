import * as fs from "fs";

const tokens = fs.readFileSync(0, "utf-8").trim().split(/\s+/);
let idx = 0;
const n = Number(tokens[idx++]);
const m = Number(tokens[idx++]);

const graph: number[][] = Array.from({ length: n + 1 }, () => []);
for (let i = 0; i < m; i += 1) {
  const u = Number(tokens[idx++]);
  const v = Number(tokens[idx++]);
  graph[u].push(v);
  graph[v].push(u);
}

const disc = new Array<number>(n + 1).fill(0);
const low = new Array<number>(n + 1).fill(0);
let timer = 1;
let bridges = 0;

const dfs = (node: number, parent: number): void => {
  disc[node] = low[node] = timer;
  timer += 1;
  for (const nei of graph[node]) {
    if (disc[nei] === 0) {
      dfs(nei, node);
      low[node] = Math.min(low[node], low[nei]);
      if (low[nei] > disc[node]) {
        bridges += 1;
      }
    } else if (nei !== parent) {
      low[node] = Math.min(low[node], disc[nei]);
    }
  }
};

dfs(1, 0);
console.log(bridges);
