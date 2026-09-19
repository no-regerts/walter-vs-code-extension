import * as commands from "./commands.json";
import * as scalarValues from "./scalar-values.json";
import * as themeProperties from "./theme-properties.json";
import * as layoutElements from "./layout-elements.json";

export interface KeywordInfo {
  title: string;
  meta?: string;
  info?: string;
  example?: string;
  type?: string;
}

export const keywordReference: Record<string, KeywordInfo> = {
  ...commands,
  ...scalarValues,
  ...themeProperties,
  ...layoutElements,
};

type Hierarchy = {
  [key: string]: Hierarchy;
};

const layoutElementsHierarchy = ((paths: string[]): Hierarchy => {
  const root: Hierarchy = {};
  for (const path of paths) {
    const parts = path.split(".");
    let node = root;
    for (const part of parts) {
      if (!node[part]) node[part] = {};
      node = node[part];
    }
  }
  return root;
})(Object.keys(layoutElements).filter((i) => i !== "default"));

export const getAvailableLayoutElments = (wordBeforeCursor: string) => {
  const splitted = wordBeforeCursor.split(".");
  let currentNode: Hierarchy = layoutElementsHierarchy[splitted[0]];
  
  for (let i = 1; i < splitted.length; i++) {
    if (currentNode[splitted[i]]) {
      currentNode = currentNode[splitted[i]];
    }
  }

  return Object.keys(currentNode) ?? [];
};
