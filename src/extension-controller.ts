import * as vscode from "vscode";
import * as wts from "web-tree-sitter";
import { WalterParser } from "./walter-parser.js";

export class ExtensionController {
  private context?: vscode.ExtensionContext;
  private currentDocument?: vscode.TextDocument;
  private walterParser?: WalterParser;
  private disposables: vscode.Disposable[] = [];

  extractTextFromEditorAndParse() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    this.currentDocument = editor.document;
    const currentText = this.currentDocument.getText();
    this.walterParser!.parseNewDocument(currentText);
  }

  private setupDiagnostics = () => {
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
  };

  private setupHoverProvider = () => {
    vscode.languages.registerHoverProvider(
      "walter",
      new (class implements vscode.HoverProvider {
        constructor(private walterParser: WalterParser) {}
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
  };

  private setupCommnads = () => {
    this.disposables.push(
      vscode.commands.registerCommand("walter.printAst", () =>
        this.walterParser!.printAst(),
      ),
    );

    this.disposables.push(
      vscode.commands.registerCommand("walter.printErrors", () =>
        this.walterParser!.printErrors(),
      ),
    );
  };

  private setupEditorBindings = () => {
    // Executes at startup to process the already opened document:
    (() => {
      this.extractTextFromEditorAndParse();
    })();

    // On swithcing editors:
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(() => {
        this.extractTextFromEditorAndParse();
      }),
    );

    // On each editor text change:
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(() => {
        this.extractTextFromEditorAndParse();
        // TODO: do incremental text updates here instead:
        // this.walterParser!.parseIncrementally();
      }),
    );
  };

  public activate = async (context: vscode.ExtensionContext) => {
    this.context = context;

    await wts.Parser.init();
    const language = await wts.Language.load(
      vscode.Uri.joinPath(context.extensionUri, "parser", "walter-parser.wasm")
        .fsPath,
    );
    this.walterParser = new WalterParser(language);

    this.setupDiagnostics();
    this.setupHoverProvider();
    this.setupCommnads();
    this.setupEditorBindings();

    this.context!.subscriptions.push(...this.disposables);
  };

  public deactivate = () => {};
}
