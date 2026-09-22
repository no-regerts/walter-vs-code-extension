import * as vscode from "vscode";

export type LinterRules = {
  noTrailingSpaces: boolean;
  noDefCommands: boolean;
  noDashesInIdentifiers: boolean;
  noSingleEquals: boolean;
}

export type ConfigData = {
  isParserEnabled: boolean;
  showDebugInfo: boolean;
  parserInterval: number;
  linterRules: LinterRules;
}

export class ConfigManager {
  private workspaceConfig?: vscode.WorkspaceConfiguration;
  public config?: ConfigData;

  public loadConfig = (): ConfigData => {
    this.workspaceConfig = vscode.workspace.getConfiguration("walter");
    const isParserEnabled = this.workspaceConfig.get<boolean>(
      "enableParser",
      true,
    );
    const parserInterval = this.workspaceConfig.get<number>(
      "parserInterval",
      200,
    );
    const showDebugInfo = this.workspaceConfig.get<boolean>(
      "showDebugInfo",
      false,
    );
    const linterRules = {
      noTrailingSpaces: this.workspaceConfig.get<boolean>(
        "linter.noTrailingSpaces",
        true,
      ),
      noDefCommands: this.workspaceConfig.get<boolean>(
        "linter.noDefCommands",
        true,
      ),
      noDashesInIdentifiers: this.workspaceConfig.get<boolean>(
        "linter.noDashesInIdentifiers",
        true,
      ),
      noSingleEquals: this.workspaceConfig.get<boolean>(
        "linter.noSingleEquals",
        true,
      ),
    };

    this.config = {
      isParserEnabled,
      showDebugInfo,
      parserInterval,
      linterRules,
    };

    return this.config;
  };
}
