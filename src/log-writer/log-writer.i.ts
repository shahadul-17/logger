import { LogLevel } from "../log-level.e";

export interface ILogWriter {
  writeToFile(logLevel: LogLevel, log: string): void;
  writeToConsole(logLevel: LogLevel, log: string): void;
}
