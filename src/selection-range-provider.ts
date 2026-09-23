import * as vscode from "vscode";
import * as wts from "web-tree-sitter";

export class SelectionRangeProvider implements vscode.SelectionRangeProvider {
  private ast!: wts.Tree;

  public init = (ast: wts.Tree) => {
    this.ast = ast;
  };

  provideSelectionRanges(
    _document: vscode.TextDocument,
    positions: vscode.Position[],
    _token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.SelectionRange[]> {
    if (!this.ast) return [];

    return positions.map((position) => {
      const point = {
        row: position.line,
        column: position.character,
      } as wts.Point;

      const currentNode = this.ast.rootNode.namedDescendantForPosition(point);

      if (!currentNode) {
        return new vscode.SelectionRange(new vscode.Range(position, position));
      }

      return this.buildSelectionRangeChain(currentNode);
    });
  }

  private buildSelectionRangeChain(node: wts.Node): vscode.SelectionRange {
    const selectionRange = new vscode.SelectionRange(
      new vscode.Range(
        new vscode.Position(node.startPosition.row, node.startPosition.column),
        new vscode.Position(node.endPosition.row, node.endPosition.column),
      ),
    );

    if (node.parent) {
      selectionRange.parent = this.buildSelectionRangeChain(node.parent);
    }

    return selectionRange;
  }
}
