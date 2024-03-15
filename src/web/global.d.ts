declare namespace NodeJS {
  interface Process {
    stdin: NodeJS.ReadStream;
    stdout: NodeJS.WriteStream;
  }
}
