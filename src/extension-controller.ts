import * as vscode from "vscode";
import * as wts from "web-tree-sitter";
import { WalterParser } from "./walter-parser.js";

export class ExtensionController {
  private currentDocument?: vscode.TextDocument;
  private walterParser?: WalterParser;

  private setupDiagnostics() {
    const diagnosticCollection =
      vscode.languages.createDiagnosticCollection("myDiagCollection");

    this.walterParser!.on("parsed", (errorCaptures) => {
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
      diagnosticCollection.set(this.currentDocument!.uri, errors);
    });
  }

  private setupHoverProvider() {
    vscode.languages.registerHoverProvider(
      "walter",
      new (class implements vscode.HoverProvider {
        constructor (private walterParser: WalterParser) {}
        provideHover(
          _document: vscode.TextDocument,
          position: vscode.Position,
          _token: vscode.CancellationToken,
        ): vscode.ProviderResult<vscode.Hover> {
          const nodeInfo = this.walterParser.infoAtPosition(
            position.line,
            position.character,
          )!;
          return new vscode.Hover(nodeInfo);
        }
      })(this.walterParser!),
    );
  }

  public async activate(context: vscode.ExtensionContext) {
    await wts.Parser.init();
    const language = await wts.Language.load(
      vscode.Uri.joinPath(context.extensionUri, "parser", "walter-parser.wasm")
        .fsPath,
    );

    this.walterParser = new WalterParser(language);

    this.setupDiagnostics();
    this.setupHoverProvider();

    // ВЫЗЫВАЕМ СРАЗУ ПРИ СТАРТЕ для уже открытого документа
    ((editor: vscode.TextEditor | undefined) => {
      if (!editor) return;

      this.currentDocument = editor.document;
      const currentText = this.currentDocument.getText();
      this.walterParser.reset();
      this.walterParser.parseNewDocument(currentText);
    })(vscode.window.activeTextEditor);

    const disposable5 = vscode.commands.registerCommand("walter.printAst", () =>
      this.walterParser!.printAst(),
    );
    const disposable4 = vscode.commands.registerCommand(
      "walter.printErrors",
      () => this.walterParser!.printErrors(),
    );

    // Когда изменяется содержимое любого текстового документа (например, пользователь набрал символ, удалил строку или сработало автоформатирование).
    const disposable2 = vscode.workspace.onDidChangeTextDocument((editor) => {
      if (!editor) return;

      this.currentDocument = editor.document;
      const currentText = this.currentDocument.getText();
      this.walterParser!.reset();
      this.walterParser!.parseNewDocument(currentText);
    });

    // const disposable3 = vscode.workspace.onDidOpenTextDocument((document) => {
    //   this.currentDocument = document;
    //   walterParser.reset();
    //   walterParser.parseNewDocument(document.getText());
    // });

    // const disposable4 = vscode.workspace.onDidCloseTextDocument((_e) => deactivate());

    let disposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!editor) return;

      this.currentDocument = editor.document;
      const documentText = this.currentDocument.getText();
      this.walterParser!.reset();
      this.walterParser!.parseNewDocument(documentText);
    });

    context.subscriptions.push(
      disposable,
      disposable2,
      // disposable3,
      disposable4,
      disposable5,
    );
  }

  public deactivate() {}
}