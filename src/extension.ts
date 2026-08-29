import * as vscode from "vscode";
import { Parser, Language } from "web-tree-sitter";

export async function activate(context: vscode.ExtensionContext) {
  console.log('Extension "WALTER" is now active!');

  await Parser.init();

  const wasmPath = vscode.Uri.joinPath(
    context.extensionUri,
    "parser",
    "walter-parser.wasm",
  ).fsPath;
  const parserBinary = await Language.load(wasmPath);

  const parser = new Parser();
  parser.setLanguage(parserBinary);

  const editor = vscode.window.activeTextEditor;

  if (editor) {
      const document = editor.document;
      const fullText = document.getText();
      const tree = parser.parse(fullText);
      console.log(tree?.rootNode.toString());
  } else {
      vscode.window.showInformationMessage('No active editor found.');
  }

  // const disposable = vscode.commands.registerCommand(
  //   "walter.helloWorld",
  //   () => {
  //     vscode.window.showInformationMessage("Hello World from WALTER!");
  //   },
  // );

  // context.subscriptions.push(disposable);
}

export function deactivate() {}
