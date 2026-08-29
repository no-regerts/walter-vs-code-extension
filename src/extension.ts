import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "WALTER" is now active!');

  const disposable = vscode.commands.registerCommand("walter.helloWorld", () => {
    vscode.window.showInformationMessage("Hello World from WALTER!");
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}

