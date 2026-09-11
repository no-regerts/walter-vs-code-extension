import * as wts from "web-tree-sitter";
import { Observer } from "./utils/observer.js";

export class StaticAnalizer extends Observer {
  private currentErrors: wts.QueryCapture[] = [];
  private currentWarnings: wts.QueryCapture[] = [];
  private ast!: wts.Tree;
  private language!: wts.Language;
  private linterRules: Record<string, boolean> = {};

  public init = (
    language: wts.Language,
    ast: wts.Tree,
    linterRules: Record<string, boolean>,
  ): void => {
    this.language = language;
    this.ast = ast;
    this.linterRules = linterRules;

    this.buildDiagnostics();
  };

  private buildDiagnostics = () => {
    this.currentErrors = [];
    this.currentWarnings = [];

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
        case 1: // MISSING.
          this.currentErrors.push(...match.captures);
        case 2: // Trailing spaces.
          if (this.linterRules.noTrailingSpaces)
            this.currentWarnings.push(...match.captures);
          break;
        case 3: // Consecutive newlines.
        case 4:
          break;
      }
    });

    this.notifyAll("finished", {
      errors: this.currentErrors,
      warnings: this.currentWarnings,
    });
  };

  public printErrors = () => {
    console.log(this.currentErrors);
  };

  private buildSymbolTable = () => {};
  
  private buildCFG = () => {};
}
