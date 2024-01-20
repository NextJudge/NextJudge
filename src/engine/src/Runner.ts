import { Result, TestCase, Tests } from "@/types/index";
import {
  decodeBase64,
  getOutput,
  matchLines,
  saveCode,
} from "@/util/functions";
import logger from "@/util/logger";
import { deleteSync } from "del";
import Docker from "dockerode";
import { performance } from "perf_hooks";

interface RunnerOpts {
  id: string;
  tag: string;
  code: string;
  testCases: TestCase[];
  base64: boolean;
  folderPath: string;
  language: string;
  timeout: number;
  memory: number;
  CPUs: number;
}
export default class Runner {
  private docker: Docker;

  constructor(docker: Docker) {
    this.docker = docker;
  }

  async run({
    id,
    tag,
    code,
    testCases,
    base64,
    folderPath,
    language,
    timeout,
    memory,
    CPUs,
  }: RunnerOpts): Promise<Result> {
    const Paths = await saveCode(folderPath, code, testCases, base64, language);
    const promisesToKeep: Array<Promise<Array<object>>> = [];
    for (let i = 0; i < Paths.length; i += 1) {
      promisesToKeep.push(
        this.docker.run(
          tag,
          ["bash", "/start.sh", `${i}`, `${timeout}`],
          null,
          {
            User: "runner",
            HostConfig: {
              CpuPeriod: 100000,
              CpuQuota: CPUs * 1000000,
              Memory: memory * 1000000,
              NetworkMode: "none",
              Binds: [`${process.cwd()}/src/${Paths[i]}:/code`],
              //   Mounts: [
              //     {
              //       Type: "bind",
              //       Source: `${process.cwd()}/src/${Paths[i]}`,
              //       Target: "/code",
              //     },
              //   ],
            },
          },
        ),
      );
    }
    logger.info(`Starting process ${id}`);
    const t0 = performance.now();
    try {
      await Promise.all(promisesToKeep);
    } catch (e) {
      return Promise.reject(e);
    }
    const t1 = performance.now();
    logger.info(`Process ${id} completed in ${(t1 - t0) / 1000} seconds`);

    const [output, runTime, error, exitCodes] = await getOutput(
      Paths,
      testCases.length,
    );
    Paths.forEach((Path) => {
      deleteSync(Path);
    });

    const tests: Tests[] = [];
    for (let i = 0; i < testCases.length; i += 1) {
      const expectedOutput = base64
        ? decodeBase64(testCases[i].output)
        : testCases[i].output;
      const obtainedOutput = output[i].toString();
      const time = runTime[i].toString().split("\n");
      const exitCode = parseInt(exitCodes[i].toString(), 10);

      let remarks;
      if (exitCode === 124) {
        remarks = "Time limit exceeded";
      } else if (exitCode === 0) {
        remarks = matchLines(expectedOutput, obtainedOutput);
      } else {
        remarks = "Error";
      }

      tests.push({
        input: testCases[i].input,
        expectedOutput,
        obtainedOutput,
        remarks,
        exitCode,
        error: error[i].toString(),
        runTime: (parseInt(time[1], 10) - parseInt(time[0], 10)) / 1000000000,
      });
    }

    const result = {
      id,
      tests,
    };

    return result;
  }
}

/*
{
            User: "runner",
            HostConfig: {
              CpuPeriod: 100000,
              CpuQuota: CPUs * 1000000,
              Memory: memory * 1000000,
              NetworkMode: "none",
              AutoRemove: true,
              Binds: [`${process.cwd()}/src/${Paths[i]}:/code`],
            },
          },
          */
