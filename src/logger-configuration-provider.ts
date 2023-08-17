import { FileUtilities, StringUtilities } from "@shahadul-17/utilities";
import { LogLevel } from "./log-level.e";
import { LoggerConfiguration } from "./logger-types.t";

const DEFAULT_CONFIGURATION: LoggerConfiguration = {
  enableConsoleLogs: true,
  instanceId: StringUtilities.getEmptyString(),
  logFileExtension: "log",
  minimumLogLevel: LogLevel.Debug,
  logsDirectory: FileUtilities.toAbsolutePath("logs"),
};

export class LoggerConfigurationProvider {

  private static configuration: LoggerConfiguration = DEFAULT_CONFIGURATION;

  public static setConfiguration(configuration: LoggerConfiguration): void {
    this.configuration = {
      instanceId: StringUtilities.getDefaultIfUndefinedOrNullOrEmpty(
        configuration.instanceId, DEFAULT_CONFIGURATION.instanceId, true),
      enableConsoleLogs: typeof configuration.enableConsoleLogs === "undefined"
        ? DEFAULT_CONFIGURATION.enableConsoleLogs : configuration.enableConsoleLogs,
      logFileExtension: StringUtilities.getDefaultIfUndefinedOrNullOrEmpty(
        configuration.logFileExtension, DEFAULT_CONFIGURATION.logFileExtension, true),
      minimumLogLevel: typeof configuration.minimumLogLevel === "undefined"
        ? DEFAULT_CONFIGURATION.minimumLogLevel : configuration.minimumLogLevel,
      logsDirectory: StringUtilities.getDefaultIfUndefinedOrNullOrEmpty(
        configuration.logsDirectory, DEFAULT_CONFIGURATION.logsDirectory, true),
      logFileNameWithoutExtensionFormatCallback: typeof configuration.logFileNameWithoutExtensionFormatCallback === "function"
        ? configuration.logFileNameWithoutExtensionFormatCallback : undefined,
      logFormatCallback: typeof configuration.logFormatCallback === "function"
        ? configuration.logFormatCallback : undefined,
    };
  }

  public static getConfiguration(): LoggerConfiguration {
    return this.configuration;
  }

  public static getDefaultConfiguration(): LoggerConfiguration {
    return DEFAULT_CONFIGURATION;
  }
}
