import { TestCase } from "@/types/index";
import fs from "fs";
import path from "path";
import randomstring from "randomstring";
import util from "util";

const readFileAsync = util.promisify(fs.readFile);

export const extension = {
  Cplusplus: "cpp",
};

export function findExtension(language: string) {
  let fileExtension = "";
  Object.entries(extension).forEach((entry) => {
    const [key, value] = entry;
    if (key === language) {
      fileExtension = value;
    }
  });
  return fileExtension;
}

export async function getOutput(Paths: string[], len: number) {
  const output = [];
  const runTime = [];
  const error = [];
  const exitCodes = [];
  for (let i = 0; i < len; i += 1) {
    output.push(readFileAsync(path.join(Paths[i], `output${i}.txt`)));
    runTime.push(readFileAsync(path.join(Paths[i], `time${i}.txt`)));
    error.push(readFileAsync(path.join(Paths[i], `error${i}.txt`)));
    exitCodes.push(readFileAsync(path.join(Paths[i], `exitCode${i}.txt`)));
  }
  return Promise.all([
    Promise.all(output),
    Promise.all(runTime),
    Promise.all(error),
    Promise.all(exitCodes),
  ]);
}

export function decodeBase64(code: string): string {
  return Buffer.from(code, "base64").toString("ascii");
}

export async function generateFolder(folderPath: string): Promise<string> {
  const ultimatePath = path.join(folderPath, randomstring.generate(10));
  return new Promise((resolve, reject) => {
    fs.mkdir(ultimatePath, { recursive: true }, (err) => {
      fs.chmod(folderPath, "0777", () => {
        fs.chmod(ultimatePath, "0777", () => {
          if (err) {
            reject(err);
          } else {
            resolve(ultimatePath);
          }
        });
      });
    });
  });
}

export async function writeToFile(path: string, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, (err) => {
      fs.chmod(path, "0777", () => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

export async function saveCode(
  folderPath: string,
  code: string,
  testCases: TestCase[],
  base64: boolean,
  language: string,
): Promise<string[]> {
  const folderPromises: Array<Promise<string>> = [];
  testCases.forEach(() => {
    folderPromises.push(generateFolder(folderPath));
  });
  const folders = await Promise.all(folderPromises);
  const extension = findExtension(language);
  const promisesToKeep = [];
  for (let i = 0; i < testCases.length; i += 1) {
    promisesToKeep.push(
      base64
        ? writeToFile(
            path.join(folders[i], `Main.${extension}`),
            decodeBase64(code),
          )
        : writeToFile(path.join(folders[i], `Main.${extension}`), code),
    );
    const input = base64
      ? decodeBase64(testCases[i].input)
      : testCases[i].input;
    promisesToKeep.push(
      writeToFile(path.join(folders[i], `in${i}.txt`), input),
    );
  }
  await Promise.all(promisesToKeep);
  return folders;
}

export function matchLines(
  expected: string,
  obtained: string,
): "Pass" | "Fail" {
  function splitAndTrim(code: string) {
    return code.split("\n").map((sentence) => sentence.trimEnd());
  }

  const expectedArray = splitAndTrim(expected.trim());
  const obtainedArray = splitAndTrim(obtained.trim());

  if (expectedArray.length !== obtainedArray.length) {
    return "Fail";
  }

  const { length } = expectedArray;

  for (let i = 0; i < length; i += 1) {
    if (expectedArray[i] !== obtainedArray[i]) {
      return "Fail";
    }
  }

  return "Pass";
}
