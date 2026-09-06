import * as fs from "fs";

const tokens = fs.readFileSync(0, "utf-8").trim().split(/\s+/);
let idx = 0;
const n = Number(tokens[idx++]);
const m = Number(tokens[idx++]);

const graph: Array<Array<[number, number, number]>> = Array.from(
  { length: n + 1 },
  () => [],
);

for (let i = 0; i < m; i += 1) {
  const u = Number(tokens[idx++]);
  const v = Number(tokens[idx++]);
  const w = Number(tokens[idx++]);
  const t = Number(tokens[idx++]);
  graph[u].push([v, w, t]);
  graph[v].push([u, w, t]);
}

const INF = 10 ** 30;
const dist: number[][] = Array.from({ length: n + 1 }, () => [INF, INF]);
dist[1][0] = 0;

type HeapEntry = [number, number, number];
const heap: HeapEntry[] = [[0, 1, 0]];

const push = (entry: HeapEntry): void => {
  heap.push(entry);
  let i = heap.length - 1;
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    if (heap[parent][0] <= heap[i][0]) {
      break;
    }
    [heap[parent], heap[i]] = [heap[i], heap[parent]];
    i = parent;
  }
};

const pop = (): HeapEntry => {
  const top = heap[0];
  const last = heap.pop() as HeapEntry;
  if (heap.length === 0) {
    return top;
  }
  heap[0] = last;
  let i = 0;
  while (true) {
    const left = 2 * i + 1;
    const right = left + 1;
    let smallest = i;
    if (left < heap.length && heap[left][0] < heap[smallest][0]) {
      smallest = left;
    }
    if (right < heap.length && heap[right][0] < heap[smallest][0]) {
      smallest = right;
    }
    if (smallest === i) {
      break;
    }
    [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
    i = smallest;
  }
  return top;
};

while (heap.length > 0) {
  const [cost, node, used] = pop();
  if (cost !== dist[node][used]) {
    continue;
  }
  for (const [nei, weight, edgeType] of graph[node]) {
    if (used === 1 && edgeType === 1) {
      continue;
    }
    const nextUsed = used | edgeType;
    const nextCost = cost + weight;
    if (nextCost < dist[nei][nextUsed]) {
      dist[nei][nextUsed] = nextCost;
      push([nextCost, nei, nextUsed]);
    }
  }
}

const answer = Math.min(dist[n][0], dist[n][1]);
console.log(answer >= INF ? -1 : answer);
