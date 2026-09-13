import * as vscode from "vscode";
import * as wts from "web-tree-sitter";
import { WalterParser } from "./core/walter-parser";

const scalarInfo: Record<string, string> = {
  "reaper_version": 'REAPER version (i.e. 4.25)',
  "folderstate": 'Folder state of track, if applicable (0 for normal, 1 for folder, -n for last track in folder(s))',
};

export class WalterHoverProvider implements vscode.HoverProvider {
  constructor(private walterParser: WalterParser) {}

  public provideHover = (
    _document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.Hover> => {
    const node = this.walterParser.infoAtPosition(
      position.line,
      position.character,
    );
    if (!node) return;
    
    let info = '';
    if (scalarInfo[node.text])
      info = `${scalarInfo[node.text]}`;
    
    const resultString = [
      info,
      `Debug info: ${this.buildDebugInfo(node)}`,
    ].join('<br><br>');

    const markdown = new vscode.MarkdownString(resultString);
    markdown.supportHtml = true;
    // markdown.appendMarkdown(`**${word}**\n\n`);

    return new vscode.Hover(markdown);
  };

  private buildDebugInfo = (node: wts.Node) => {
    const lastNode = node;

    const result: string[] = [];

    while (node.parent) {
      result.push(node.type);
      node = node.parent;
    }

    return `${result.reverse().join(" > ")}>${lastNode.text}`;
  };
}
