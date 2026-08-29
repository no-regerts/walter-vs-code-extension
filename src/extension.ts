import * as vscode from "vscode";
import { Parser, Language } from "web-tree-sitter";

export async function activate(context: vscode.ExtensionContext) {
  console.log('Extension "WALTER" is now active!');

  // 1. Initialize the Web Tree-sitter runtime
  await Parser.init();

  // 2. Locate and load your specific language WASM file
  const wasmPath = vscode.Uri.joinPath(
    context.extensionUri,
    "parser",
    "walter-parser.wasm",
  ).fsPath;
  const parserBinary = await Language.load(wasmPath);

  // 3. Create the parser instance and assign the language
  const parser = new Parser();
  parser.setLanguage(parserBinary);

  // 4. Parse example code
  const sourceCode = "hello = 42";
  const tree = parser.parse(sourceCode);

  const disposable = vscode.commands.registerCommand(
    "walter.helloWorld",
    () => {
      console.log(tree?.rootNode.toString());
      vscode.window.showInformationMessage("Hello World from WALTER!");
    },
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
