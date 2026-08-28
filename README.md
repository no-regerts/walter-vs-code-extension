This extension provides full feature support for WALTER language in VS Code.

## Features
+ Syntax highlighting.
+ Bracket/quote matching.
+ Bracket/quote autoclosing.
+ Comment toggling.
+ Folding (by `;region` and `;endregion` markers).

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
  max-line-length
- Jump to definition.
- Formatting:
  - Adding indentations for layouts and macros.
  - Removing all trailing spaces.
- Refactoring:
  - Changing name of a user variable across the document.
- Documentation comments.

- Snippet completion.
- Bracket autosurrounding.
- Code folding.
- Actions.

## Extension Settings

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

## Release Notes
