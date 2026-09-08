import * as wts from "web-tree-sitter";
import { Observer } from "./utils/observer.js";

export interface TreeEditData {
  startIndex: number; // The start index of the change.
  oldEndIndex: number; // The end index of the change before the edit.
  newEndIndex: number; // The end index of the change after the edit.
  startPosition: wts.Point; // The start position of the change.
  oldEndPosition: wts.Point; // The end position of the change before the edit.
  newEndPosition: wts.Point; // The end position of the change after the edit.
}

export class WalterParser extends Observer {
  private parser: wts.Parser;
  private currentAst: wts.Tree | null = null;

  constructor(private language: wts.Language) {
    super();
    this.parser = new wts.Parser();
    this.parser.setLanguage(this.language);
  }

  public parseNewDocument = (documentText: string) => {
    this.parser.reset();
    this.currentAst = this.parser.parse(documentText);
    this.notifyAll("parsed", this.currentAst);
  };

  public incrementalParse = (newSourceCode: string, changes: TreeEditData[]) => {
    changes.forEach((change: TreeEditData) => {
      this.currentAst!.edit(new wts.Edit(change));
    });

    this.currentAst = this.parser.parse(
      (index: number, _position?: { row: number; column: number }) => {
        return newSourceCode.substring(index);
      },
      this.currentAst,
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

    this.notifyAll("parsed", this.currentAst);
  };

  public infoAtPosition = (row: number, column: number) => {
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
  };

  public printAst = () => {
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
  };
}
