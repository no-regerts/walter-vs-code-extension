import * as vscode from "vscode";
import * as wts from "web-tree-sitter";
import { WalterParser } from "./core/walter-parser";
import * as keywordData from "./core/hover-reference.json";

interface KeywordInfo {
  title: string;
  meta: string;
  info: string;
}

const keywordInfo: Record<string, string | KeywordInfo> = keywordData;

export class WalterHoverProvider implements vscode.HoverProvider {
  constructor(
    private walterParser: WalterParser,
    private showDebugInfo: boolean,
  ) {}

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

    const nodeText = node.text.split(" ")[0];
    const nodeDescription = keywordInfo[nodeText];

    const resultString = [];
    if (nodeDescription)
      if (typeof nodeDescription === "string")
        resultString.push(`### \`${nodeText}\``, `${nodeDescription}`);
      else {
        resultString.push(`### \`${nodeDescription.title}\``);
        resultString.push(`${nodeDescription.info}`);
        resultString.push(`${nodeDescription.meta}`);
      }
    if (this.showDebugInfo) {
      resultString.push(`Debug info: ${this.buildDebugInfo(node)}`);
    }

    const markdown = new vscode.MarkdownString(
      resultString.join(" \n\n --- \n\n "),
    );
    markdown.supportHtml = true;
    return new vscode.Hover(markdown);
  };

  private buildDebugInfo = (node: wts.Node) => {
    const lastNode = node;

    const result: string[] = [];

    while (node.parent) {
      result.push(node.type);
      node = node.parent;
    }

    return `${result.reverse().join(" > ")} > ${lastNode.text}`;
  };
}
