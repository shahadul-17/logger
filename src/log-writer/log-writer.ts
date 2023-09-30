import asyncFileSystem from "fs/promises";
import { IQueue, Queue } from "@shahadul-17/collections";
import { DateUtilities, FileUtilities, StringUtilities } from "@shahadul-17/utilities";
import { LoggerConfigurationProvider } from "../logger-configuration-provider";
import { ILogWriter } from "./log-writer.i";
import { LogLevel } from "../log-level.e";
import { LoggerConfiguration, LogFileNameWithoutExtensionFormatCallback, } from "../logger-types.t";

const LOGS_QUEUE_INITIAL_CAPACITY = 4096;
const ERROR_LOG_LEVELS = [LogLevel.Fatal, LogLevel.Error];
const CONSOLE_FUNCTION_LOG_LEVEL_MAP = {
  [LogLevel.Debug]: console.debug,
  [LogLevel.Information]: console.info,
  [LogLevel.Warning]: console.warn,
  [LogLevel.Error]: console.error,
  [LogLevel.Fatal]: console.error,
  'Default': console.log,
};

type LogInformation = {
  logLevel: LogLevel;
  log: string;
};

export class LogWriter implements ILogWriter {

  private isFlushing: boolean = false;
  private fileHandlesCreatedAt: string = StringUtilities.getEmptyString();
  private logFileHandle: undefined | asyncFileSystem.FileHandle;
  private errorLogFileHandle: undefined | asyncFileSystem.FileHandle;
  private readonly logInformationQueue: IQueue<LogInformation> = new Queue<LogInformation>(LOGS_QUEUE_INITIAL_CAPACITY);

  constructor() {
    this.formatLogFileNameWithoutExtension = this.formatLogFileNameWithoutExtension.bind(this);
    this.createFileHandlesAsync = this.createFileHandlesAsync.bind(this);
    this.getFileHandlesAsync = this.getFileHandlesAsync.bind(this);
    this.flushLogInformationToFileAsync = this.flushLogInformationToFileAsync.bind(this);
    this.writeToFile = this.writeToFile.bind(this);
    this.writeToConsole = this.writeToConsole.bind(this);
  }

  private formatLogFileNameWithoutExtension(currentDate: Date, configuration: LoggerConfiguration): string {
    const currentDay = DateUtilities.formatDate(currentDate, ({ day, shortMonthName, year, }) => {
      return `${day}-${shortMonthName}-${year}`;
    });

    return `${currentDay}${StringUtilities.isEmpty(configuration.instanceId) ? configuration.instanceId : `.${configuration.instanceId}`}`;
  }

  private async createFileHandlesAsync(currentDate: Date): Promise<void> {
    if (typeof this.logFileHandle !== "undefined") {
      // closes previously opened log file handle (if any)...
      await this.logFileHandle.close();
    }

    if (typeof this.errorLogFileHandle !== "undefined") {
      // closes previously opened error log file handle (if any)...
      await this.errorLogFileHandle.close();
    }

    const configuration = LoggerConfigurationProvider.getConfiguration();
    let logFileNameWithoutExtension: undefined | string;

    if (typeof configuration.logFileNameWithoutExtensionFormatCallback === "function") {
      logFileNameWithoutExtension = configuration.logFileNameWithoutExtensionFormatCallback(currentDate, configuration);
    }

    // if the log file name without extension is not a string...
    if (!StringUtilities.isString(logFileNameWithoutExtension)) {
      // we shall use the default formatting...
      logFileNameWithoutExtension = this.formatLogFileNameWithoutExtension(currentDate, configuration);
    }

    const logFileName = `${logFileNameWithoutExtension}.${configuration.logFileExtension}`;
    const logFilePath = FileUtilities.join(configuration.logsDirectory!, logFileName);
    const errorFileName = `${logFileNameWithoutExtension}.error.${configuration.logFileExtension}`;
    const errorFilePath = FileUtilities.join(configuration.logsDirectory!, errorFileName);

    // creates logs directory if doesn't exist...
    await FileUtilities.createDirectoryIfDoesNotExistAsync(configuration.logsDirectory!);

    this.logFileHandle = await asyncFileSystem.open(logFilePath, "a");
    this.errorLogFileHandle = await asyncFileSystem.open(errorFilePath, "a");
  }

  private async getFileHandlesAsync(): Promise<Array<asyncFileSystem.FileHandle>> {
    const currentDate = new Date();
    const currentDay = DateUtilities.formatDate(currentDate, ({ day, month, year, }) => {
      return `${day}-${month}-${year}`;
    });

    // if file handle is not initialized or file handle wasn't created today,
    // we'll create new file handle...
    if (currentDay !== this.fileHandlesCreatedAt) {
      await this.createFileHandlesAsync(currentDate);

      this.fileHandlesCreatedAt = currentDay;
    }

    return [this.logFileHandle!, this.errorLogFileHandle!];
  }

  private async flushLogInformationToFileAsync(): Promise<void> {
    // if the log writer is already flushing log information to file
    // or the queue is empty, we shall not proceed any further...
    if (this.isFlushing || this.logInformationQueue.isEmpty()) { return; }

    // otherwise we shall set the is flushing flag to true...
    this.isFlushing = true;

    try {
      const [fileHandle, errorFileHandle] = await this.getFileHandlesAsync();
      let logInformation: undefined | LogInformation;
      let log: string;

      // we shall dequeue elements until the queue is empty...
      while (typeof (logInformation = this.logInformationQueue.dequeue()) !== "undefined") {
        // adding a newline character in the end...
        log = `${logInformation.log}\n`;

        // checks if the log level is either 'Fatal' or 'Error'...
        if (ERROR_LOG_LEVELS.includes(logInformation.logLevel)) {
          await errorFileHandle.write(log);
        }

        await fileHandle.write(log);
      }
    } catch (error) {
      console.warn("An error occurred while flushing log information to file.", error);
    }

    // finally we shall set the is flushing flag to false...
    this.isFlushing = false;
  }

  writeToFile(logLevel: LogLevel, log: string): void {
    this.logInformationQueue.enqueue({
      logLevel: logLevel,
      log: log,
    });

    this.flushLogInformationToFileAsync();
  }

  writeToConsole(logLevel: LogLevel, log: string): void {
    const consoleLogger = CONSOLE_FUNCTION_LOG_LEVEL_MAP[logLevel] ?? CONSOLE_FUNCTION_LOG_LEVEL_MAP["Default"];
    consoleLogger(log);
  }
}
