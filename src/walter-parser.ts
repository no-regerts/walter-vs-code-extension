import * as wts from "web-tree-sitter";

export class WalterParser {
  private parser: wts.Parser;
  private language: wts.Language;
  private listeners: Function[] = [];
  private currentAst: wts.Tree | null = null;
  private currentErrors: wts.QueryCapture[] = [];

  constructor(language: wts.Language) {
    this.language = language;
    this.parser = new wts.Parser();
    this.parser.setLanguage(this.language);
  }

  public parseNewDocument(text: string) {
    this.parser.reset();
    this.currentAst = this.parser.parse(text);
    this.buildDiagnostics();
    this.notifyAll(this.currentErrors);
  }

  private buildDiagnostics(): void {
    //   У ERROR есть:
    // startPosition
    // endPosition
    // дочерние узлы
    // соседние узлы
    // родитель
    // типы узлов вокруг него.
    // А ещё есть очень полезная вещь — MISSING.
    //   */
    const errorQueryString = `
      (ERROR) @error
      (MISSING) @missing
    `;
    const query = new wts.Query(this.language, errorQueryString);
    this.currentErrors = query.captures(this.currentAst!.rootNode);
  }

  public reset(): void {
    this.parser.reset();
    this.currentErrors = [];
  }

  public infoAtPosition(row: number, column: number) {
    let node = this.currentAst?.rootNode.descendantForPosition({
      row: row,
      column: column,
    });
    if (!node) return;

    const result: string[] = [];

    while (node) {
      result.push(node.type);
      node = node.parent;
    }

    return result.reverse().join(">>>");
  }

  public printAst() {
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
    printl(this.currentAst!.rootNode);
  }

  public printErrors() {
    console.log(this.currentErrors);
  }

  public subscribe(cb: (errors: any) => void) {
    this.listeners.push(cb);
  }

  private notifyAll(payload: any) {
    this.listeners.forEach((listener) => listener(payload));
  }
}
