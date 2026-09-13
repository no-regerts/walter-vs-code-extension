import * as wts from "web-tree-sitter";
import { Observer } from "./utils/observer.js";
import { LinterRules } from "../config-manager.js";

export enum DiagnosticMessageType {
  error,
  warning,
  info,
  hint,
}

export interface DiagnosticMessage {
  type: DiagnosticMessageType;
  text: string;
  startPosition: wts.Point;
  endPosition: wts.Point;
}

export class StaticAnalizer extends Observer {
  private diagnosticMessages: DiagnosticMessage[] = [];
  private ast!: wts.Tree;
  private language!: wts.Language;
  private linterRules!: LinterRules;

  public init = (
    language: wts.Language,
    ast: wts.Tree,
    linterRules: LinterRules,
  ): void => {
    this.language = language;
    this.ast = ast;
    this.linterRules = linterRules;

    this.buildDiagnostics();
  };

  private buildDiagnostics = () => {
    this.diagnosticMessages = [];

    const queryString = `
      (ERROR) @error
      (MISSING) @missing
      (trailingSpace) @trailingSpaces
    `;
    let query = new wts.Query(this.language, queryString);
    const matches = query.matches(this.ast!.rootNode);
    matches.forEach((match) => {
      switch (match.patternIndex) {
        case 0: // ERROR.
          this.diagnosticMessages.push(
            ...match.captures.map((capture) => ({
              type: DiagnosticMessageType.error,
              text: "Unknown error",
              startPosition: capture.node.startPosition,
              endPosition: capture.node.endPosition,
            })),
          );
          break;
        case 1: // MISSING.
          this.diagnosticMessages.push(
            ...match.captures.map((capture) => ({
              type: DiagnosticMessageType.error,
              text: `Missing: ${capture.node.type}`,
              startPosition: capture.node.startPosition,
              endPosition: capture.node.endPosition,
            })),
          );
          break;
        case 2: // Trailing spaces.
          if (this.linterRules.noTrailingSpaces)
            this.diagnosticMessages.push(
              ...match.captures.map((capture) => ({
                type: DiagnosticMessageType.warning,
                text: "Trailing spaces",
                startPosition: capture.node.startPosition,
                endPosition: capture.node.endPosition,
              })),
            );
          break;
      }
    });

    this.notifyAll("finished", this.diagnosticMessages);
  };

  public printErrors = () => {
    console.log(
      this.diagnosticMessages.filter(
        (message) => message.type === DiagnosticMessageType.error,
      ),
    );
  };

  private buildSymbolTable = () => {};

  private buildCFG = () => {};
}
