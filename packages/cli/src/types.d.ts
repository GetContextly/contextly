declare module 'cli-progress' {
  interface Options {
    format?: string;
    barCompleteChar?: string;
    barIncompleteChar?: string;
    hideCursor?: boolean;
  }

  class SingleBar {
    constructor(options: Options);
    start(total: number, startValue: number): void;
    update(value: number): void;
    stop(): void;
  }

  export default { SingleBar };
}
