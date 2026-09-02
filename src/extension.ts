import * as vscode from "vscode";
import * as wts from "web-tree-sitter";
import { WalterParser } from "./walter-parser.js";

export async function activate(context: vscode.ExtensionContext) {
  let currentDocument: vscode.TextDocument;
  // vscode.window.showInformationMessage("No active editor found.");
  // document.fileName

  await wts.Parser.init();
  const language = await wts.Language.load(
    vscode.Uri.joinPath(context.extensionUri, "parser", "walter-parser.wasm")
      .fsPath,
  );

  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("myDiagCollection");

  const walterParser = new WalterParser(language);
  walterParser.subscribe((errorCaptures) => {
    const errors = errorCaptures.map((capture: wts.QueryCapture) => {
      const node = capture.node;
      return new vscode.Diagnostic(
        new vscode.Range(
          node.startPosition.row,
          node.startPosition.column,
          node.endPosition.row,
          node.endPosition.column,
        ),
        `${capture.name}: ${node.type}`,
        vscode.DiagnosticSeverity.Error,
      );
    });

    diagnosticCollection.clear();
    diagnosticCollection.set(currentDocument.uri, errors);
  });

  vscode.languages.registerHoverProvider(
    "walter",
    new (class implements vscode.HoverProvider {
      provideHover(
        _document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
      ): vscode.ProviderResult<vscode.Hover> {
        const nodeInfo = walterParser.infoAtPosition(
          position.line,
          position.character,
        )!;
        return new vscode.Hover(nodeInfo);
      }
    })(),
  );

  const disposable5 = vscode.commands.registerCommand("walter.printAst", () =>
    walterParser.printAst(),
  );
  const disposable4 = vscode.commands.registerCommand(
    "walter.printErrors",
    () => walterParser.printErrors(),
  );

  // Когда изменяется содержимое любого текстового документа (например, пользователь набрал символ, удалил строку или сработало автоформатирование).
  const disposable2 = vscode.workspace.onDidChangeTextDocument((editor) => {
    currentDocument = editor.document;
    const currentText = currentDocument.getText();
    walterParser.reset();
    walterParser.parseNewDocument(currentText);
  });

  const disposable3 = vscode.workspace.onDidOpenTextDocument((document) => {
    currentDocument = document;
    walterParser.reset();
    walterParser.parseNewDocument(document.getText());
  });

  // const disposable4 = vscode.workspace.onDidCloseTextDocument((_e) => deactivate());

  let disposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
    // console.log("changed editor");
    if (editor) {
      currentDocument = editor.document;
      const documentText = currentDocument.getText();
      walterParser.reset();
      walterParser.parseNewDocument(documentText);
    }
  });

  context.subscriptions.push(
    disposable,
    disposable2,
    disposable3,
    disposable4,
    disposable5,
  );
}

/*
tree1.edit({
  startIndex: 0,
  oldEndIndex: 3,
  newEndIndex: 5,
  startPosition: { row: 0, column: 0 },
  oldEndPosition: { row: 0, column: 3 },
  newEndPosition: { row: 0, column: 5 },
});

// Re-parse with the old tree
const tree2 = parser.parse('const x = 1;', tree1);
*/

export function deactivate() {}
