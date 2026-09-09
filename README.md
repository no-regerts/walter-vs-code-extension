Provides full feature support for WALTER language.

# Attention
- **This extension is in early development. Many features are not ready yet, and there are plenty of bugs. Moreover, it introduces a few restrictions on possible language constructs to make WALTER more consistent and less error-prone, so expect to see numerous diagnostic messages (i.e., errors) in your code, even if it is fully functional. All of this is explained further in this document.**

## Supported features
+ Lexical syntax highlighting.
+ Grammar checking.
+ Comment toggling.
+ Custom folding regions:
  - Use `;---` and `;-` to mark the start and the end of a custom folding region respectevely.
  - You can add annotations for both markers: `;--- My custom folding redion`.
+ Bracket/quote autoclosing.

## Planned features
- Actions:
  - Unravel/collapse code.
- Jump to definition (for user variables and macros).
- Find all references of an identifier.
- Semantic folding (for macros, layouts and long statements).
- Semantic syntax highlighting (for macro params, identifiers and user variables).
- Auto indentation.
- Hover information:
  - Documentation for commands and built-in scalar values.
  - Proper diagnostic messages.
  - User documentation comments (jsdoc style or similar).
  - Mappings between attributes and filenames.
- Auto completion / Intellisense:
  - For built-in entities (e.g `tcp.size`, `trans_flags`).
  - For built-in commands (e.g. `define_parameter`).
  - For user-defined variables.
- Semantic error checking:
  - Identifier doesn't exist (either built in or user defined).
  - Validate position (!, other types, like margins, aren't clamped) coord lists (for example, no unclamped attachment values, no negative sizes).
- Linting:
  - no-dead-code (e.g. unused variables and macros, dead branches).
  - no-trailing-spaces.
  - no-inconsistent-whitespaces (mixing up tabs and spaces for indentation or comments).
  - no-inconsistent-quote-marks (using different quote marks across the document).
  - no-consecutive-blank-lines.
  - consistent-identifer-names (camelCase or snake_case).
  - no-optional-operands (ok: `set trans.play 2>1 5 trans.play` or `set trans.play 2>1 5 .`; not ok: `set trans.play 2>1 5`).
  - no-layout-variable-look-alikes (e.g. tcp.label.myVar).
  - no-unnecessary-accessors (e.g., `tcp_fxparms{0}` or `my_var{0}`).
- Auto formatting:
  - Adding indentations for layouts and macros.
  - Removing all trailing spaces.
- Refactoring:
  - Changing name of a user variables across the document.

## Нереализованные функции, известные баги, пояснения к ошибкам и предупреждениям
- **Only common characters (`a-z`, `A-Z`, `0-9`, `_`) are allowed in identifier names:**
  - WALTER allows variables to be given almost any name, no matter how unusual – for example, `...`, `-4.0`, `,`, or `"my           var"`. However, to improve code readability and prevent potential errors, the set of allowed characters is restricted to commonly accepted programming conventions: the first character must be a letter or underscore, and subsequent characters may be letters, digits, underscores, or dots. The `#` character is temporarily permitted in identifiers (see the next item).
  - Here are a few more examples that illustrate why this restriction exists:
    - Строку `10.0a`, интерпретатор WALTER'а воспримет как идентификатор, а не число, написанное с ошибкой.
    - Запрет `-` также помогает избежать ошибок вроде `-var_name`. WALTER не поддерживает унарные минусы и строку `-var_name` воспринимает как идентификатор, а не обратное значение.
- **Macros (`macro ... endmacro`) are not fully supported yet:**
  - Implementing full macro support will take some time. If the highlighting of false errors inside macros annoys you, you can disable the parser. To do so, add `"WALTER.enableParser": false` to your `settings.json`.
  - For now, all `##` inclusions are treated as ordinary identifiers.
- **Using the `def` command is prohibited** because of the ambiguity it introduces when reading source code.
- **Since expressions like `?var1<var2 ...` and `!val1&val2 ...` are not documented by the developers, such expressions are not allowed.**
  - Instead of `!val1&val2 branch1 branch2` use `val1&val2 branch2 branch1`.
- **All places where strings are semantically expected accept only strings. Similarly, all places where identifiers are semantically expected accept only identifiers**:
  - Use `layout "Black" folder-name` instead of `layout "Black" "folder-name"`.
  - Use `set "my var" 1` instead of `set my_var 1`.
- **The `rtconfig.txt` file must end with a blank line:**
  - This is a limitation of the tooling being used. Currently, the parser cannot properly handle the end-of-file (EOF) marker and relies on a trailing newline character when parsing commands. This restriction is expected to be removed soon.

## Extension Settings
* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Release Notes
