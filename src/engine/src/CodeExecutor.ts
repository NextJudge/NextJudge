import { CodeParams } from "@/types/index";
import { extension } from "@/util/functions";
import logger from "@/util/logger";
import Bull from "bull";
import { v4 as uuid } from "uuid";

const languages = Object.keys(extension);

export default class CodeExecutor {
  private queue: Bull.Queue;

  constructor(name: string, redis: string) {
    this.queue = new Bull(name, redis);
  }

  async runCode(codeOptions: CodeParams): Promise<void> {
    if (!languages.includes(codeOptions.language)) {
      return Promise.reject(new Error("Language not supported!"));
    }
    const id = uuid();
    const codeObject = { ...codeOptions, id };
    logger.info(`Running code with id: ${id}`);

    const job = await this.queue.add(codeObject);

    return job.finished();
  }

  stop() {
    this.queue.close();
  }
}

export { languages };
