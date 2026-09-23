import * as wts from "web-tree-sitter";
import { Observer } from "./utils/observer.js";

export interface TreeEditData {
  startIndex: number;
  oldEndIndex: number; // The end index of the change before the edit.
  newEndIndex: number; // The end index of the change after the edit.
  startPosition: wts.Point;
  oldEndPosition: wts.Point; // The end position of the change before the edit.
  newEndPosition: wts.Point; // The end position of the change after the edit.
}

export class Parser extends Observer {
  private parser!: wts.Parser;
  private currentAst: wts.Tree | null = null;

  public init(language: wts.Language) {
    this.parser = new wts.Parser();
    this.parser.setLanguage(language);
  }

  public kill = () => {
    this.parser.delete();
    this.currentAst = null;
  };

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

    this.notifyAll("parsed", this.currentAst);
  };

  public infoAtPosition = (row: number, column: number) => {
    let node = this.currentAst?.rootNode.descendantForPosition({
      row: row,
      column: column,
    });
    if (!node) return;

    return node;
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
