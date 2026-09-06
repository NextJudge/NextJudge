export const MONACO_NODE_STUBS = `
declare const process: {
  stdin: import("stream").Readable;
};

declare module "readline" {
  import type { Readable } from "stream";

  export interface ReadLineOptions {
    input: Readable;
    crlfDelay?: number;
  }

  export interface Interface {
    on(event: "line", listener: (line: string) => void): this;
    close(): void;
  }

  export function createInterface(options: ReadLineOptions): Interface;
}

declare function require(name: "readline"): typeof import("readline");
`;
