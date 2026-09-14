Provides full feature support for the WALTER language.

> **This extension is in early development. Many features are not ready yet, and some bugs are to be expected. Moreover, it deliberately introduces a few restrictions on certain language constructs to make WALTER more consistent and less error-prone, so you may see a number of diagnostic messages (i.e., errors) in your code, even if it is fully functional. All of this is explained further in this document.**

# Supported features

### Syntax Validation
![](./assets/readme/sintax-validation.gif)

### Hover tooltips
![](./assets/readme/hover-documentation.png)
- Hover over any keyword to see its documentation.

### Lexical syntax highlighting
![](./assets/readme/sintax-highlighting.gif)

### Comment toggling
![](./assets/readme/comment-toggling.gif)
- Press `Ctrl + /` to toggle comments for the current line or selection.

### Custom folding regions
![](./assets/readme/custom-folding-regions.gif)
- Use `;---` and `;-` to mark the start and end of a custom folding region, respectively.

### Code linting
Code linting is the automated process of analyzing source code to find formatting errors, stylistic inconsistencies, and potential bugs.
- `walter.linter.noTrailingSpaces` (enabled by default):
  - ![](./assets/readme/trailing-spaces.png)
  - Disallows whitespace characters (spaces or tabs) at the end of a line.

### Other
- Bracket/quote autoclosing.

# Planned features
- Actions:
  - Expand/collapse - automatically breaks a long `set` statements down into a nicely formatted hierarchy of separate expressions, and collapses it back.
- Jump to definition (for user variables and macros).
- Find all references to an identifier.
- Semantic folding (for `macro`, `layout`, and long statements).
- Semantic syntax highlighting (for `macro` parameters and user variables).
- Hover tooltips:
  - Human-readable diagnostic messages.
  - User documentation comments (JSDoc style or similar).
- Autocompletion / IntelliSense for built-in and user-defined entities.
- Semantic error checking:
  - Unknown identifiers.
  - Unclosed `macro`/`layout` statements.
- Refactoring:
  - Rename user variables and macros across the document.
- Auto-formatting:
  - Indentation for `layout` and `macro` blocks.
  - Removal trailing whitespace.
- Shrink/expand the selection.
- Linting:
  - `noDeadCode` - unused variables and macros, and dead branches.
  - `noMixedWhitespace` - mixing tabs and spaces in indentation or comments.
  - `noMixedQuotes` - using different types of quotation marks across the document.
  - `noConsecutiveBlankLines` - prevents excessive consecutive blank lines.
  - `consistentIdentifierCase` - enforces `camelCase` or `snake_case`.
  - `noLayoutVariableLookalikes` - e.g., `tcp.label.myVar`.

# Known issues and limitations
- **Only a restricted set of characters is allowed in identifier names:**
  - WALTER allows variables to have almost any name, no matter how unusual - for example, `...`, `-4.0`, `,`, or `"my           var"`. However, to improve code readability and prevent potential errors, only characters commonly used in programming languages are allowed: **the first character must be a letter or underscore, and subsequent characters may be letters, digits, underscores, or dots**.
  - The `#` character is temporarily permitted in identifiers (see the next section).
- **Macros (`macro ... endmacro`) are not supported yet:**
  - Implementing full macro support will take some time. If the highlighting of false errors inside macros is distracting, you can disable the parser. To do so, add `"walter.enableParser": false` to your `settings.json`.
  - For now, all `##` are treated as ordinary identifier characters.
- **Using the `def` command is prohibited**, as it introduces ambiguity when reading source code.
- **All places where strings are semantically expected accept only strings. Likewise, all places where identifiers are semantically expected accept only identifiers:**
  - Use `layout "Black" "folder-name"` instead of `layout "Black" folder-name`.
  - Use `set my_var 1` instead of `set "my var" 1`.
- **The `rtconfig.txt` file must end with a newline:**
  - This is a limitation of the tooling being used. Currently, the parser cannot properly handle the end-of-file (EOF) and relies on a trailing newline character to parse commands correctly. This restriction is expected to be removed in a future version.

# Release Notes
