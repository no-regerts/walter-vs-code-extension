import * as vscode from "vscode";
import * as wts from "web-tree-sitter";
import { WalterParser } from "./core/walter-parser";
import * as keywordData from "./core/keyword-reference.json";

interface KeywordInfo {
  title: string;
  meta?: string;
  info?: string;
  example?: string;
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

    const nodeText = node.text.split(" ")[0].toLowerCase();
    const nodeDescription = keywordInfo[nodeText] as KeywordInfo;
    const mdString = new vscode.MarkdownString();
    mdString.supportHtml = true;

    if (nodeDescription)
      mdString.appendMarkdown(nodeDescription.title);
      if (nodeDescription.info) {
        mdString.appendMarkdown(`\n\n --- \n\n`);
        mdString.appendMarkdown(`${nodeDescription.info}`);
      }
      if (nodeDescription.meta) {
        mdString.appendMarkdown(`\n\n --- \n\n`);
        mdString.appendMarkdown(`${nodeDescription.meta}`);
      }
      if (nodeDescription.example) {
        mdString.appendMarkdown(`\n\n --- \n\n`);
        mdString.appendMarkdown(`Usage:\n\n`);
        mdString.appendCodeblock(nodeDescription.example, 'walter');
      }

    if (this.showDebugInfo) {
      mdString.appendCodeblock(`Debug info: ${this.buildDebugInfo(node)}`);
    }

    return new vscode.Hover(mdString);
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
