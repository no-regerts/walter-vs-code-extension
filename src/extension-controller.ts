import * as vscode from "vscode";
import * as wts from "web-tree-sitter";
import { WalterParser } from "./walter-parser.js";
import { StaticAnalizer } from "./static-analizer.js";
import { WalterHoverProvider } from "./walter-hover-provider.js";

export class ExtensionController {
  private context?: vscode.ExtensionContext;
  private disposables: vscode.Disposable[] = [];

  private isParserEnabled?: boolean;
  private walterParser!: WalterParser;
  private staticAnalizer: StaticAnalizer = new StaticAnalizer();

  private currentDocument?: vscode.TextDocument;
  private currentText: string = ""; // TODO: remove this?

  private parserInterval?: number;
  private throttlerTimerId?: ReturnType<typeof setTimeout>;
  private isThrottled: boolean = false;
  private accumulatedChanges: vscode.TextDocumentContentChangeEvent[] = [];

  private extractTextFromEditorAndParse = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    this.currentDocument = editor.document;
    this.currentText = this.currentDocument.getText();
    this.walterParser.parseNewDocument(this.currentText);
  };

  private convertTextDocumentChangesToTreeEditData = (
    changes: readonly vscode.TextDocumentContentChangeEvent[],
  ) => {
    return changes.map((change) => {
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
  };

  private setupDiagnostics = () => {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection();

    this.staticAnalizer.on("finished", (payload) => {
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
            `${capture.name}`,
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
    const hp = new WalterHoverProvider(this.walterParser);
    vscode.languages.registerHoverProvider("walter", hp);
  };

  private setupCommnads = () => {
    this.disposables.push(
      vscode.commands.registerCommand("walter.printAst", () =>
        this.walterParser.printAst(),
      ),
    );

    this.disposables.push(
      vscode.commands.registerCommand("walter.printErrors", () =>
        this.staticAnalizer.printErrors(),
      ),
    );
  };

  private setupEditorBindings = () => {
    // Process the already opened document:
    this.extractTextFromEditorAndParse();

    // On swithcing editors:
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        // Reset the accumulated changes and prepare to parse a new document:
        this.accumulatedChanges = [];
        this.throttlerTimerId?.close();
        this.isThrottled = false;

        if (editor?.document.languageId !== "walter") return;

        this.extractTextFromEditorAndParse();
      }),
    );

    // On each editor text change:
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.contentChanges.length === 0) return;
        if (e.document.languageId !== "walter") return;
        if (!this.currentDocument) return;

        this.accumulatedChanges.push(...e.contentChanges);
        if (this.isThrottled) return;
        this.isThrottled = true;

        this.throttlerTimerId = setTimeout(() => {
          const changes = this.convertTextDocumentChangesToTreeEditData(
            this.accumulatedChanges,
          );
          this.walterParser.incrementalParse(e.document.getText(), changes);

          this.isThrottled = false;
          this.accumulatedChanges = [];
        }, this.parserInterval || 200);
      }),
    );
  };

  public activate = async (context: vscode.ExtensionContext) => {
    this.context = context;

    const config = vscode.workspace.getConfiguration('WALTER');
    this.isParserEnabled = config.get<boolean>('enableParser');
    this.parserInterval = config.get<number>('parserInterval');
    console.log(this.isParserEnabled, this.parserInterval);
    if (!this.isParserEnabled) return;

    await wts.Parser.init();
    const language = await wts.Language.load(
      vscode.Uri.joinPath(context.extensionUri, "parser", "walter-parser.wasm")
        .fsPath,
    );
    this.walterParser = new WalterParser(language);
    this.walterParser.on("parsed", (ast: wts.Tree) =>
      this.staticAnalizer.init(language, ast),
    );

    this.setupDiagnostics();
    this.setupHoverProvider();
    this.setupCommnads();
    this.setupEditorBindings();

    this.context!.subscriptions.push(...this.disposables);
  };

  public deactivate = () => {};
}
