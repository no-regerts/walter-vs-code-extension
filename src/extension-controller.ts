import * as vscode from "vscode";
import * as wts from "web-tree-sitter";
import { WalterParser } from "./core/walter-parser.js";
import {
  DiagnosticMessage,
  DiagnosticMessageType,
  StaticAnalizer,
} from "./core/static-analizer.js";
import { WalterHoverProvider } from "./walter-hover-provider.js";
import { ConfigManager } from "./config-manager.js";
import { WalterCompletionProvider } from "./walter-completion-provider.js";

export class ExtensionController {
  private context?: vscode.ExtensionContext;
  private disposables: vscode.Disposable[] = [];

  private showDebugInfo: boolean = false;

  private configManager: ConfigManager;
  private walterParser!: WalterParser;
  private staticAnalizer: StaticAnalizer;

  private currentDocument?: vscode.TextDocument;

  private throttlerTimerId?: ReturnType<typeof setTimeout>;
  private isThrottled: boolean = false;
  private accumulatedChanges: vscode.TextDocumentContentChangeEvent[] = [];

  constructor(configManager: ConfigManager, staticAnalizer: StaticAnalizer) {
    this.configManager = configManager;
    this.staticAnalizer = staticAnalizer;
  }

  private extractTextFromEditorAndParse = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    this.currentDocument = editor.document;
    this.walterParser.parseNewDocument(this.currentDocument.getText());
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

    this.staticAnalizer.on("finished", (payload: DiagnosticMessage[]) => {
      if (!this.currentDocument) return;

      const diagnostics = payload.map((message: DiagnosticMessage) => {
        return new vscode.Diagnostic(
          new vscode.Range(
            message.startPosition.row,
            message.startPosition.column,
            message.endPosition.row,
            message.endPosition.column,
          ),
          message.text,
          message.type === DiagnosticMessageType.error
            ? vscode.DiagnosticSeverity.Error
            : vscode.DiagnosticSeverity.Warning,
        );
      });

      diagnosticCollection.clear();
      diagnosticCollection.set(this.currentDocument.uri, diagnostics);
    });
  };

  private setupHoverProvider = () => {
    this.disposables.push(
      vscode.languages.registerHoverProvider(
        "walter",
        new WalterHoverProvider(this.walterParser, this.showDebugInfo),
      ),
    );
  };

  private setupCompletionProvider = () => {
    this.disposables.push(
      vscode.languages.registerCompletionItemProvider(
        "walter",
        new WalterCompletionProvider(),
        '.'
      ),
    );
  };

  private setupFoldingRangeProvider = () => {
    // TODO
    // registerFoldingRangeProvider(selector: DocumentSelector, provider: FoldingRangeProvider): Disposable
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
        }, this.configManager.config?.parserInterval || 200);
      }),
    );

    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((_) => {
        // this.restart(); // TODO
      }),
    );
  };

  public activate = async (context: vscode.ExtensionContext) => {
    this.context = context;

    if (!this.configManager.config?.isParserEnabled) return;
    this.showDebugInfo = this.configManager.config?.showDebugInfo;

    await wts.Parser.init();
    const wasmPath = vscode.Uri.joinPath(
      context.extensionUri,
      "generated",
      "walter-parser.wasm",
    );
    const language = await wts.Language.load(wasmPath.fsPath);
    this.walterParser = new WalterParser(language);
    this.walterParser.on("parsed", (ast: wts.Tree) =>
      this.staticAnalizer.init(
        language,
        ast,
        this.configManager.config?.linterRules!,
      ),
    );

    this.setupDiagnostics();
    this.setupHoverProvider();
    this.setupCompletionProvider();
    this.setupCommnads();
    this.setupEditorBindings();

    this.context!.subscriptions.push(...this.disposables);
  };

  public deactivate = () => {};

  private restart = () => {
    this.walterParser.kill();
    // this.staticAnalizer.kill(); TODO
    // this.walterParser.off("parsed"); TODO
    // TODO: remove all bindings.
    this.activate(this.context!);
  };
}
