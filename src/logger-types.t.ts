import { LogLevel } from "./log-level.e";

export type ClassType<Type> = new () => Type;
export type LogFileNameWithoutExtensionFormatCallback = (currentDay: Date, configuration: LoggerConfiguration) => string;
export type LogFormatCallback = (currentTime: Date, logLevel: string, context: string, ...parameters: Array<any>) => string;
export type LoggerConfiguration = {
  instanceId?: string,
  logFileExtension?: string,
  logsDirectory?: string,
  minimumLogLevel?: LogLevel,
  enableConsoleLogs?: boolean,
  logFileNameWithoutExtensionFormatCallback?: LogFileNameWithoutExtensionFormatCallback,
  logFormatCallback?: LogFormatCallback,
};
