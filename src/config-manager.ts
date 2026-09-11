import * as vscode from "vscode";

export interface LinterRules {
  noTrailingSpaces: boolean;
}

export interface ConfigData {
  isParserEnabled: boolean;
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
    const linterRules = {
      noTrailingSpaces: this.workspaceConfig.get<boolean>(
        "linter.noTrailingSpaces",
        true,
      ),
    };

    this.config = {
      isParserEnabled,
      parserInterval,
      linterRules,
    };

    return this.config;
  };
}
