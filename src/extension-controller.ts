import * as vscode from "vscode";
import * as wts from "web-tree-sitter";
import { TreeEdit as TreeEditData, WalterParser } from "./walter-parser.js";

export class ExtensionController {
  private context?: vscode.ExtensionContext;
  private currentDocument?: vscode.TextDocument;
  private walterParser!: WalterParser;
  private disposables: vscode.Disposable[] = [];
  private currentText: string = "";

  extractTextFromEditorAndParse() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    this.currentDocument = editor.document;
    this.currentText = this.currentDocument.getText();
    this.walterParser.parseNewDocument(this.currentText);
  }

  private setupDiagnostics = () => {
    const diagnosticCollection =
      vscode.languages.createDiagnosticCollection("myDiagCollection");

    this.walterParser.on("parsed", (payload) => {
      if (!this.currentDocument) return;

      const errorCaptures = payload.errors;
      const warningCaptures = payload.warnings;

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

      const warnings = warningCaptures.map(
        (capture: wts.QueryCapture) =>
          new vscode.Diagnostic(
            new vscode.Range(
              capture.node.startPosition.row,
              capture.node.startPosition.column,
              capture.node.endPosition.row,
              capture.node.endPosition.column,
            ),
            `Remove trailing spaces.`,
            vscode.DiagnosticSeverity.Warning,
          ),
      );

      diagnosticCollection.clear();
      diagnosticCollection.set(this.currentDocument.uri, [
        ...errors,
        ...warnings,
      ]);
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
          );
          return new vscode.Hover(nodeInfo ?? '');
        }
      })(this.walterParser),
    );
  };

  private setupCommnads = () => {
    this.disposables.push(
      vscode.commands.registerCommand("walter.printAst", () =>
        this.walterParser.printAst(),
      ),
    );

    this.disposables.push(
      vscode.commands.registerCommand("walter.printErrors", () =>
        this.walterParser.printErrors(),
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
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.contentChanges.length === 0) return;
        if (!this.currentDocument) return;

        const changes = (
          e.contentChanges as vscode.TextDocumentContentChangeEvent[]
        ).map((change) => {
          const startIndex = e.document.offsetAt(change.range.start);
          const oldEndIndex = e.document.offsetAt(change.range.end);
          const newEndIndex = startIndex + Buffer.from(change.text).length;
          const startPosition = {
            row: change.range.start.line,
            column: change.range.start.character,
          };
          const oldEndPosition = {
            row: change.range.end.line,
            column: change.range.end.character,
          };

          const lines = change.text.split("\n");
          const lineCount = lines.length - 1;
          const newEndPosition = {
            row: change.range.start.line + lineCount,
            column: lines[lineCount].length,
          };
          if (lineCount === 0) {
            newEndPosition.column += change.range.start.character;
          }

          return {
            startIndex,
            oldEndIndex,
            newEndIndex,
            startPosition,
            oldEndPosition,
            newEndPosition,
          } as TreeEditData;
        });

        this.walterParser.incrementalParse(
          this.currentDocument.getText(),
          changes,
        );
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
