import Builder from "@/Builder";
import Runner from "@/Runner";
import { Code, Result, WorkerOptions } from "@/types/index";
import logger from "@/util/logger";
import Bull from "bull";
import Docker from "dockerode";

export default class Worker {
  private docker: Docker;
  private runner: Runner;
  private builder: Builder;
  private queue: Bull.Queue;
  private folderPath?: string;
  private memory?: number;
  private CPUs?: number;

  constructor(name: string, redis: string, options?: WorkerOptions) {
    this.docker = new Docker();
    this.runner = new Runner(this.docker);
    this.builder = new Builder(this.docker);
    this.queue = new Bull(name, redis);

    const opts = options || {};
    const { folderPath, memory, CPUs } = opts;

    this.folderPath = folderPath || "/tmp/code-exec";
    this.memory = memory || 0;
    this.CPUs = CPUs || 0.5;
  }

  async build(langs?: Array<string>): Promise<void> {
    try {
      await this.builder.buildImages(langs);
      return null;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private async work(codeOptions: Code): Promise<Result> {
    const tag = `${codeOptions.language.toLowerCase()}-runner`;
    const result = await this.runner.run({
      tag,
      id: codeOptions.id,
      code: codeOptions.code,
      testCases: codeOptions.testCases,
      folderPath: this.folderPath,
      base64: codeOptions.base64 || false,
      language: codeOptions.language,
      timeout: codeOptions.timeout,
      memory: this.memory,
      CPUs: this.CPUs,
    });

    return result;
  }

  start() {
    this.queue.process(async (job, done) => {
      try {
        const result = await this.work(job.data);
        done(null, result);
        logger.debug(JSON.stringify(result));
      } catch (e) {
        done(e);
        logger.error(e);
      }
    });
  }

  pause() {
    this.queue.pause();
  }

  resume() {
    this.queue.resume();
  }

  stop() {
    this.queue.close();
  }
}
