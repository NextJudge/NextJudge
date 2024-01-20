import CodeExecutor from "@/CodeExecutor";
import Worker from "@/Worker";
import logger from "@/util/logger";

const cppCode = `#include <iostream>
using namespace std;
int main() {
  cout << "hello" << endl;
  return 0;
}`;

const inputs = [
  {
    language: "Cplusplus",
    code: cppCode,
    testCases: [
      {
        input: "",
        output: "hello\n",
      },
    ],
    timeout: 2,
  },
];

async function main() {
  const worker = new Worker("myExecutor", "redis://localhost:6379");
  const codeExecutor = new CodeExecutor("myExecutor", "redis://localhost:6379");

  logger.info("Hello From The NextJudge Engine!");
  await worker.build();
  worker.start();

  let results;
  try {
    results = await codeExecutor.runCode(inputs[0]);
  } catch (error) {
    logger.error(error);
  }

  logger.info("results", JSON.stringify(results));
}

main();
