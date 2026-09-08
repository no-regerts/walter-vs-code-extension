import * as vscode from "vscode";
import { WalterParser } from "./walter-parser";

export class WalterHoverProvider implements vscode.HoverProvider {
  constructor(private walterParser: WalterParser) {}
  provideHover(
    _document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.Hover> {
    const nodeInfo = this.walterParser.infoAtPosition(
      position.line,
      position.character,
    );
    return new vscode.Hover(nodeInfo ?? "");
  }
}
