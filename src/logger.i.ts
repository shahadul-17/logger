import { LogLevel } from "./log-level.e";

export interface ILogger<Type> {
  log(logLevel: LogLevel, ...parameters: Array<any>): void;
  debug(...parameters: Array<any>): void;
  information(...parameters: Array<any>): void;
  warning(...parameters: Array<any>): void;
  error(...parameters: Array<any>): void;
  fatal(...parameters: Array<any>): void;
}
