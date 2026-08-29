This extension provides full feature support for WALTER language in VS Code.

## Features
+ Syntax highlighting.
+ Bracket/quote matching.
+ Bracket/quote autoclosing.
+ Comment toggling.
+ Custom folding regions (by `;region` and `;endregion` markers).

- Folding (for macros and layouts).
- Auto indentation.
- Hover information:
  - Documentation for commands and built-in values.
- Auto completion:
  - For built-in values (tcp.size).
  - For built-in commands (custom, forward).
  - For user-defined variables.
- Error checking:
  - Parsing errors (unrecognized tokens).
  - Identifier doesn't exist (either built-in or user-defined).
- Linting:
  - No dead code.
  - No trailing spaces.
  - No inconsistent whitespaces (mixing up tabs and spaces for indentation or comments).
  - No inconsistent quote marks (using different quote marks across the document).
  - No dashes in variable names.
  - no-consecutive-blank-lines
  - consistent variable names (camelCase or _)
  - max-line-length
- Jump to definition:
  - For variables.
  - For macros.
- Formatting:
  - Adding indentations for layouts and macros.
  - Removing all trailing spaces.
- Refactoring:
  - Changing name of a user variable across the document.
- Documentation comments.
- Actions:
  - Unravel code.

- Snippet completion.
- Bracket autosurrounding.
- Code folding.

## Extension Settings

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues
- '-' is a valid character in identifiers, but it conflicts with the minus sign. Handling this ambiguity would require numerous hard to maintain and inefficient parsing rules. Rather than supporting all these edge cases (see the example below), we should recommend users (via code suggestions) to replace all dashes with underscores:
  ``` WALTER
  something##param##-1 ; Not good.
  something##param##_1 ; Good enough.
  ```
- Macro param separators add some troubles too:
  ``` WALTER
  something ## somethingElse ; Good.
  something## somethingElse ; Maybe good.
  something{3}## somethingElse ; Not good.
  ```

## Release Notes

## Contributions
To generate a parser from a grammar, you must have node on your PATH.
