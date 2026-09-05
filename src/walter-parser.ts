import * as wts from "web-tree-sitter";
import { Observer } from "./utils/observer.js";

export interface TreeEdit {
  startIndex: number; // The start index of the change.
  oldEndIndex: number; // The end index of the change before the edit.
  newEndIndex: number; // The end index of the change after the edit.
  startPosition: wts.Point; // The start position of the change.
  oldEndPosition: wts.Point; // The end position of the change before the edit.
  newEndPosition: wts.Point; // The end position of the change after the edit.
}

export class WalterParser extends Observer {
  private parser: wts.Parser;
  private language: wts.Language;
  private currentAst: wts.Tree | null = null;
  private currentErrors: wts.QueryCapture[] = [];
  private currentWarnings: wts.QueryCapture[] = [];

  constructor(language: wts.Language) {
    super();
    this.language = language;
    this.parser = new wts.Parser();
    this.parser.setLanguage(this.language);
  }

  public parseNewDocument(documentText: string) {
    this.parser.reset();

    this.currentAst = this.parser.parse(documentText);
    this.buildDiagnostics();
    this.notifyAll("parsed", {
      errors: this.currentErrors,
      warnings: this.currentWarnings,
    });
  }

  public incrementalParse(documentText: string, contentChanges: TreeEdit[]) {
    contentChanges.forEach((change: TreeEdit) => {
      this.currentAst!.edit(new wts.Edit(change));
    });

    this.currentAst = this.parser.parse(
      (index: number, _position?: { row: number; column: number }) => {
        return documentText.substring(index);
      },
      this.currentAst, // Передаем отредактированное старое дерево
    );

    // // Инкрементальный парсинг чанками через строки
    // this.currentAst = this.parser.parse(
    //   (_index: number, position?: { row: number; column: number }) => {
    //     if (!position) return undefined;

    //     const line = sourceLines[position.row];
    //     if (line === undefined) return undefined; // Конец документа

    //     // Возвращаем остаток текущей строки, начиная с запрашиваемой колонки.
    //     // Tree-sitter получит только этот фрагмент, а при переходе на новую
    //     // строку вызовет колбэк снова, уже с новым position.row.
    //     // Важно добавить символ переноса строки, так как мы удалили его при split().
    //     return line.slice(position.column) + "\n";
    //   },
    //   this.currentAst,
    // );

    this.buildDiagnostics();
    this.notifyAll("parsed", {
      errors: this.currentErrors,
      warnings: this.currentWarnings,
    });
  }

  // TODO: move to StaticAnalizer.
  private buildDiagnostics(): void {
    this.currentErrors = [];
    this.currentWarnings = [];

    const errorQueryString = `
      (ERROR) @error
      (MISSING) @missing
    `;
    let query = new wts.Query(this.language, errorQueryString);
    this.currentErrors = query.captures(this.currentAst!.rootNode);

    const trailingSpacesQueryString = `
    (trailingSpaces) @trailingSpaces
    `;
    query = new wts.Query(this.language, trailingSpacesQueryString);
    this.currentWarnings = query.captures(this.currentAst!.rootNode);
  }

  public infoAtPosition(row: number, column: number) {
    let node = this.currentAst?.rootNode.descendantForPosition({
      row: row,
      column: column,
    });
    if (!node) return;

    const lastNode = node;

    const result: string[] = [];

    while (node) {
      result.push(node.type);
      node = node.parent;
    }

    return `${result.reverse().join(">")}>${lastNode.text}`;
  }

  public printAst() {
    if (!this.currentAst) return;

    function printl(node: wts.Node, indent = "") {
      console.log(
        `${indent}${node.type} ` +
          `[${node.startPosition.row}:${node.startPosition.column} - ` +
          `${node.endPosition.row}:${node.endPosition.column}] ` +
          JSON.stringify(node.text),
      );

      for (const child of node.children) {
        printl(child, indent + "  ");
      }
    }
    printl(this.currentAst.rootNode);
  }

  public printErrors() {
    console.log(this.currentErrors);
  }
}
