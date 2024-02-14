
export const {
  PORT,
  API_PORT,
  JWT_SECRET,
  DATABASE_HOST,
  DATABASE_PORT,
  REDIS_HOST,
  REDIS_PORT,
} = process.env

export const LANG_TO_EXTENSION: Record<string, string> = {
  "C++": "cpp",
  Python: "py",
  Go: "go",
  Java: "java",
  Node: "ts",
};
