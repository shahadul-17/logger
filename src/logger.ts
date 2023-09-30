import path from "path";
import { DateUtilities, JsonSerializer, NumberUtilities, StringUtilities, } from "@shahadul-17/utilities";
import { LogLevel } from "./log-level.e";
import { ILogger } from "./logger.i";
import { ILogWriter, LogWriter } from "./log-writer";
import { LoggerConfigurationProvider } from "./logger-configuration-provider";
import { ClassType } from "./logger-types.t";

const LOG_LEVEL_NAME_MAP = {
  [LogLevel.Debug]: "Debug",
  [LogLevel.Information]: "Information",
  [LogLevel.Warning]: "Warning",
  [LogLevel.Error]: "Error",
  [LogLevel.Fatal]: "Fatal",
};

export class Logger<Type> implements ILogger<Type> {

  private context: string;
  private static readonly logWriter: ILogWriter = new LogWriter();

  constructor(context: string | ClassType<Type>) {
    if (StringUtilities.isString(context)) {
      this.context = path.basename(context as string);
    } else {
      this.context = (context as ClassType<Type>).name;
    }

    // binding methods...
    this.formatLog = this.formatLog.bind(this);
    this.log = this.log.bind(this);
    this.debug = this.debug.bind(this);
    this.information = this.information.bind(this);
    this.warning = this.warning.bind(this);
    this.error = this.error.bind(this);
    this.fatal = this.fatal.bind(this);
  }

  private formatLog(currentTime: Date, logLevel: string, context: string, ...parameters: Array<any>): string {
    const formattedCurrentTime = DateUtilities.formatDate(currentTime, ({ day, shortMonthName, year, hoursIn12hFormat: hours, minutes, seconds, amPm, timezone, }) => {
      return `${day}-${shortMonthName}-${year} ${hours}:${minutes}:${seconds} ${amPm} (${timezone})`;
    });

    let message: string = `${formattedCurrentTime} [${logLevel}] [${context}] `;

    for (let i = 0; i < parameters.length; ++i) {
      const parameter = parameters[i];

      if (typeof parameter === "undefined") {
        message += "undefined ";

        continue;
      }
      if (parameter === null) {
        message += "null ";

        continue;
      }
      if (["string", "boolean", "number", "bigint"].includes(typeof parameter)) {
        message += `${parameter} `;

        continue;
      }
      if (typeof parameter === "object") {
        message += `\n${JsonSerializer.serialize(parameter, {
          shallDeepSanitize: true,
          spaces: 2,
        })}\n`;

        continue;
      }

      try {
        message += typeof parameter.toString === "function"
          ? `${parameter.toString()} `
          : `${parameter} `;
      } catch (error) {
        console.warn("An error occurred during parameter serialization.", error);

        continue;
      }
    }

    message = message.trim();

    return message;
  }

  public log(logLevel: LogLevel, ...parameters: Array<any>): void {
    if (!parameters.length) { return; }

    const configuration = LoggerConfigurationProvider.getConfiguration();
    const minimumLogLevel = NumberUtilities.isNumber(configuration.minimumLogLevel)
      ? configuration.minimumLogLevel!
      : LoggerConfigurationProvider.getDefaultConfiguration().minimumLogLevel!;

    // if current log level is less than minimum log level, we shall not proceed any further...
    if (logLevel < minimumLogLevel) { return; }

    const currentTime = new Date();
    let formattedLog: undefined | string;

    if (typeof configuration.logFormatCallback === "function") {
      formattedLog = configuration.logFormatCallback(currentTime,
        Logger.getLogLevelName(logLevel), this.context, ...parameters);
    }

    // if formatted log is anything other than a string...
    if (!StringUtilities.isString(formattedLog)) {
      // we shall use the default formatting...
      formattedLog = this.formatLog(currentTime,
        Logger.getLogLevelName(logLevel), this.context, ...parameters);
    }

    Logger.logWriter.writeToFile(logLevel, formattedLog!);

    // we shall write the log to console if enabled...
    configuration.enableConsoleLogs !== false
      && Logger.logWriter.writeToConsole(logLevel, formattedLog!);
  }

  public debug(...parameters: Array<any>): void {
    return this.log(LogLevel.Debug, ...parameters);
  }

  public information(...parameters: Array<any>): void {
    return this.log(LogLevel.Information, ...parameters);
  }

  public warning(...parameters: Array<any>): void {
    return this.log(LogLevel.Warning, ...parameters);
  }

  public error(...parameters: Array<any>): void {
    return this.log(LogLevel.Error, ...parameters);
  }

  public fatal(...parameters: Array<any>): void {
    return this.log(LogLevel.Fatal, ...parameters);
  }

  public static getLogLevelName(logLevel: LogLevel): string {
    const logLevelName = StringUtilities.getDefaultIfUndefinedOrNullOrEmpty(
      LOG_LEVEL_NAME_MAP[logLevel], StringUtilities.getEmptyString(), true);

    return logLevelName;
  }
}
