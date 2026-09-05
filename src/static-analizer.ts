import * as wts from "web-tree-sitter";
import { Observer } from "./utils/observer.js";

export class StaticAnalizer extends Observer {
  private currentErrors: wts.QueryCapture[] = [];
  private currentWarnings: wts.QueryCapture[] = [];
  private ast: wts.Tree | null = null;
  private language: wts.Language | null = null;

  public buildDiagnostics(language: wts.Language, ast: wts.Tree): void {
    this.language = language;
    this.ast = ast;

    this.currentErrors = [];
    this.currentWarnings = [];

    const errorQueryString = `
        (ERROR) @error
        (MISSING) @missing
      `;
    let query = new wts.Query(this.language!, errorQueryString);
    this.currentErrors = query.captures(this.ast!.rootNode);

    const trailingSpacesQueryString = `
      (trailingSpaces) @trailingSpaces
      `;
    query = new wts.Query(this.language!, trailingSpacesQueryString);
    this.currentWarnings = query.captures(this.ast!.rootNode);

    this.notifyAll("finished", {
      errors: this.currentErrors,
      warnings: this.currentWarnings,
    });
  }

  public printErrors() {
    console.log(this.currentErrors);
  }
}
