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

      const diagnosticCollection =
        vscode.languages.createDiagnosticCollection();
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
          return new vscode.Hover(nodeInfo ?? "");
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

        // Сортируем правки от КОНЦА файла к НАЧАЛУ. // TODO
        // Это критически важно, чтобы при последовательном вызове .edit() индексы предыдущих правок не плыли!
        // const sortedChanges = [...e.contentChanges].sort(
        //   (a, b) => b.rangeOffset - a.rangeOffset,
        // );
        const sortedChanges = [...e.contentChanges];

        const changes = sortedChanges.map((change) => {
          const startIndex = change.rangeOffset;
          const oldEndIndex = change.rangeOffset + change.rangeLength;
          const newEndIndex = startIndex + change.text.length;

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
            column:
              lineCount === 0
                ? change.range.start.character + change.text.length
                : lines[lineCount].length,
          };

          return {
            startIndex,
            oldEndIndex,
            newEndIndex,
            startPosition,
            oldEndPosition,
            newEndPosition,
          };
        });

        this.walterParser.incrementalParse(e.document.getText(), changes);
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
