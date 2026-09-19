import * as vscode from "vscode";
import * as layoutElements from "./core/keyword-reference/layout-elements.json";
import {
  getAvailableLayoutElments,
  keywordReference,
} from "./core/keyword-reference/keyword-reference";

export class WalterCompletionProvider implements vscode.CompletionItemProvider {
  private itemContext = new Map<
    vscode.CompletionItem,
    { wordBeforeCursor: string }
  >();

  private handleDottedString(wordBeforeCursor: string) {
    wordBeforeCursor = wordBeforeCursor.slice(0, -1); // Remove the dangling dot.
    // If it still ends with a dot (e.g., mcp..), return nothing.
    if (wordBeforeCursor.endsWith('.')) return [];
    return getAvailableLayoutElments(wordBeforeCursor).map((item) => {
      const ci = new vscode.CompletionItem(
        item,
        vscode.CompletionItemKind.Field,
      );
      this.itemContext.set(ci, { wordBeforeCursor });
      return ci;
    });
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext,
  ) {
    const lineText = document.lineAt(position.line).text;
    const textBeforeCursor = lineText.substring(0, position.character);
    const wordsBeforeCursor = textBeforeCursor.split(/[ }\]]/);
    let wordBeforeCursor = wordsBeforeCursor[wordsBeforeCursor.length - 1];

    if (context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter) {
      // Invoked by pressing the trigger character ('.').
      return this.handleDottedString(wordBeforeCursor);
    } else if (context.triggerKind === vscode.CompletionTriggerKind.Invoke) {
      if (wordBeforeCursor.endsWith("."))
        // Invoked by pressing 'Ctrl' + 'Space' on a word that ends with a dot.
        return this.handleDottedString(wordBeforeCursor);
      else if (!Object.keys(layoutElements).includes(wordBeforeCursor))
        return Object.keys(keywordReference)
          .filter(
            (keyword) =>
              !keyword.includes(".") && // Remove all dotted elements, since they were already handled.
              keyword !== "default" &&
              keyword.startsWith(wordBeforeCursor),
          )
          .map((key) => {
            const ci = new vscode.CompletionItem(key);

            if (keywordReference[key].type === "layout") {
              ci.kind = vscode.CompletionItemKind.Variable;
              ci.sortText = `1`;
            }
            if (keywordReference[key].type === "scalar") {
              ci.kind = vscode.CompletionItemKind.Enum;
              ci.sortText = `2`;
            }
            if (keywordReference[key].type === "command") {
              ci.kind = vscode.CompletionItemKind.Operator;
              ci.sortText = `3`;
            }
            if (keywordReference[key].type === "config") {
              ci.kind = vscode.CompletionItemKind.Property;
              ci.sortText = `4`;
            }

            return ci;
          });
    }

    return [];
  }

  resolveCompletionItem(
    item: vscode.CompletionItem,
    _token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.CompletionItem> {
    const context = this.itemContext.get(item);
    if (context) {
      const keyword = `${context.wordBeforeCursor}.${item.label.toString()}`;
      const documentation = keywordReference[keyword].info;
      if (documentation) {
        item.documentation = new vscode.MarkdownString(documentation);
        this.itemContext.delete(item);
      }
    } else {
      item.documentation = new vscode.MarkdownString(
        keywordReference[item.label.toString()].info,
      );
    }

    return item;
  }
}
