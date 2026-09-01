// new RustRegex('(?i)[a-z_][a-z0-9_]*')

// Sequences : seq(rule1, rule2, ...) — This function creates a rule that matches any number of other rules, one after another. It is analogous to simply writing multiple symbols next to each other in EBNF notation.

// Alternatives : choice(rule1, rule2, ...) — This function creates a rule that matches one of a set of possible rules. The order of the arguments does not matter. This is analogous to the | (pipe) operator in EBNF notation.

// Repetitions : repeat(rule) — This function creates a rule that matches zero-or-more occurrences of a given rule. It is analogous to the {x} (curly brace) syntax in EBNF notation.

// Repetitions : repeat1(rule) — This function creates a rule that matches one-or-more occurrences of a given rule. The previous repeat rule is implemented in repeat1 but is included because it is very commonly used.

// Options : optional(rule) — This function creates a rule that matches zero or one occurrence of a given rule. It is analogous to the [x] (square bracket) syntax in EBNF notation.

// Precedence : prec(number, rule)
  // marks the given rule with a numerical precedence, which will be used to resolve LR(1) Conflicts at parser-generation time. When two rules overlap in a way that represents either a true ambiguity or a local ambiguity given one token of lookahead, Tree-sitter will try to resolve the conflict by matching the rule with the higher precedence. The default precedence of all rules is zero. This works similarly to the precedence directives in Yacc grammars.
  // Пример:
  // unary_expression: $ =>
  //   prec(
  //     2,
  //     choice(
  //       seq("-", $.expression),
  //       seq("!", $.expression),
  //       // ...
  //     ),
  //   );
  // This function can also be used to assign lexical precedence to a given token, but it must be wrapped in a token call, such as token(prec(1, 'foo')). This reads as "the token foo has a lexical precedence of 1". The purpose of lexical precedence is to solve the issue where multiple tokens can match the same set of characters, but one token should be preferred over the other. See Lexical Precedence vs Parse Precedence for a more detailed explanation.
  // Left Associativity : prec.left([number], rule) — This function marks the given rule as left-associative (and optionally applies a numerical precedence). When an LR(1) conflict arises in which all the rules have the same numerical precedence, Tree-sitter will consult the rules' associativity. If there is a left-associative rule, Tree-sitter will prefer matching a rule that ends earlier. This works similarly to associativity directives in Yacc grammars.
    // binary_expression: $ => choice(
    //     prec.left(2, seq($.expression, '*', $.expression)),
    //     prec.left(1, seq($.expression, '+', $.expression)),
    //     // ...
    //   ),
  // Right Associativity : prec.right([number], rule) — This function is like prec.left, but it instructs Tree-sitter to prefer matching a rule that ends later.

  // Dynamic Precedence : prec.dynamic(number, rule) — This function is similar to prec, but the given numerical precedence is applied at runtime instead of at parser generation time. This is only necessary when handling a conflict dynamically using the conflicts field in the grammar, and when there is a genuine ambiguity: multiple rules correctly match a given piece of code. In that event, Tree-sitter compares the total dynamic precedence associated with each rule, and selects the one with the highest total. This is similar to dynamic precedence directives in Bison grammars.

// token(rule) — This function marks the given rule as producing only a single token. Tree-sitter's default is to treat each String or RegExp literal in the grammar as a separate token. Each token is matched separately by the lexer and returned as its own leaf node in the tree. The token function allows you to express a complex rule using the functions described above (rather than as a single regular expression) but still have Tree-sitter treat it as a single token. The token function will only accept terminal rules, so token($.foo) will not work. You can think of it as a shortcut for squashing complex rules of strings or regexes down to a single token.

// Immediate Tokens : token.immediate(rule) — Usually, whitespace (and any other extras, such as comments) is optional before each token. This function means that the token will only match if there is no whitespace.

// Aliases : alias(rule, name) — This function causes the given rule to appear with an alternative name in the syntax tree. If name is a symbol, as in alias($.foo, $.bar), then the aliased rule will appear as a named node called bar. And if name is a string literal, as in alias($.foo, 'bar'), then the aliased rule will appear as an anonymous node, as if the rule had been written as the simple string.

// Field Names : field(name, rule) — This function assigns a field name to the child node(s) matched by the given rule. In the resulting syntax tree, you can then use that field name to access specific children.
  // function_definition: $ =>
  //   seq(
  //     "func",
  //     field("name", $.identifier),
  //     field("parameters", $.parameter_list),
  //     field("return_type", $._type),
  //     field("body", $.block),
  //   );

// Reserved Keywords : reserved(wordset, rule) — This function will override the global reserved word set with the one passed into the wordset parameter. This is useful for contextual keywords, such as if in JavaScript, which cannot be used as a variable name in most contexts, but can be used as a property name.

// End of Input : eof() — This function creates a rule that matches the end of the input, without consuming any characters. It may only appear as the final symbol of a rule, and is useful when a rule should match either an explicit terminator (such as a newline) or the end of the file. Choice branches where other symbols follow eof() can never match, so they are dropped, and eof() is not allowed inside token().



// In addition to the name and rules fields, grammars have a few other optional public fields that influence the behavior of the parser. Each of these fields is a function that accepts the grammar object ($) as its only parameter, like the grammar rules themselves. These fields are:
// extras — an array of tokens that may appear anywhere in the language. This is often used for whitespace and comments. The default value of extras is to accept whitespace. To control whitespace explicitly, specify extras: $ => [] in your grammar. See the section on using extras for more details.
// inline — an array of rule names that should be automatically removed from the grammar by replacing all of their usages with a copy of their definition. This is useful for rules that are used in multiple places but for which you don't want to create syntax tree nodes at runtime.
// conflicts — an array of arrays of rule names. Each inner array represents a set of rules that's involved in an LR(1) conflict that is intended to exist in the grammar. When these conflicts occur at runtime, Tree-sitter will use the GLR algorithm to explore all the possible interpretations. If multiple parses end up succeeding, Tree-sitter will pick the subtree whose corresponding rule has the highest total dynamic precedence.
  // conflicts: $ => [
  //   [$.array, $.array_pattern],
  // ],
// externals — an array of token names which can be returned by an external scanner. External scanners allow you to write custom C code which runs during the lexing process to handle lexical rules (e.g. Python's indentation tokens) that cannot be described by regular expressions.
// precedences — an array of arrays of strings, where each array of strings defines named precedence levels in descending order. These names can be used in the prec functions to define precedence relative only to other names in the array, rather than globally. Can only be used with parse precedence, not lexical precedence.
// word — the name of a token that will match keywords to the keyword extraction optimization.
// supertypes — an array of rule names which should be considered to be 'supertypes' in the generated node types file. Supertype rules are automatically hidden from the parse tree, regardless of whether their names start with an underscore. The main use case for supertypes is to group together multiple different kinds of nodes under a single abstract category, such as "expression" or "declaration". See the section on using supertypes for more details.
// reserved — similar in structure to the main rules property, an object of reserved word sets associated with an array of reserved rules. The reserved rule in the array must be a terminal token meaning it must be a string, regex, token, or terminal rule. The reserved rule must also exist and be used in the grammar, specifying arbitrary tokens will not work. The first reserved word set in the object is the global word set, meaning it applies to every rule in every parse state. However, certain keywords are contextual, depending on the rule. For example, in JavaScript, keywords are typically not allowed as ordinary variables, however, they can be used as a property name. In this situation, the reserved function would be used, and the word set to pass in would be the name of the word set that is declared in the reserved object that corresponds to an empty array, signifying no keywords are reserved.

// Starting a rule's name with an underscore causes the rule to be hidden in the syntax tree. This is useful for rules like _expression in the grammars above, which always just wrap a single child node. If these nodes were not hidden, they would add substantial depth and noise to the syntax tree without making it any easier to understand.

/*
Precedince:
< > <= >= == != & 0
+ - 50
* / 75
*/

function repeatUpTo(max, rule) {
  const rules = [rule];

  for (let i = 1; i < max; i++) {
    rules.push(optional(rule));
  }

  return rules;
}

module.exports = grammar({
  name: 'WALTER',

  extras: $ => [
    /[\\]/,
  ],

  conflicts: $ => [
    [$.commentStatement, $.emptyStatement],
    [$.frontCommand],
    [$.coordinateListItem, $.scalarValue],
    [$.scalarProperty, $.layoutKeyword],
    [$.customCommand],
    [$.expression, $.userProperty],
    [$.expression, $.negativeConditional],
    [$.expression, $.relationalConditional],
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($.statement),

    // TODO: line continuation character '\'.

    lineEnd: $ => choice(
      $.newLine,
      // /^\s\S/, // TODO: детектировать конец строки.
    ),
    anyChar: $ => /[^\s\S]/,

    space: $ => /[^a-z0-9_+\-*/@&!?<>='"`;:.,(){}\[\]\r\n]+/i,
    newLine: $ => /\r?\n/,

    comment: $ => /;[^\r\n]*/,

    number: $ => /-?\d+(?:\.\d+)?/,

    string: $ => choice(
      $.singleQuoteString,
      $.doubleQuoteString,
      $.backtickQuoteString,
    ),
    singleQuoteString: $ => /'[^']*'/,
    doubleQuoteString: $ => /"[^"]*"/,
    backtickQuoteString: $ => /`[^`]*`/,
    
    identifier: $ => /[a-z_][a-z0-9_]*/i,

    statement: $ => choice(
      $.commentStatement,
      $.commandStatement,
      $.emptyStatement,
      // TODO: theme config statement.
      // $.macroCallStatement,
    ),

    commandStatement: $ => prec(100, seq(
      optional($.space),
      choice(
        $.clearCommand,
        $.resetCommand,
        $.setCommand,
        // $.defCommand,
        $.frontCommand,
        $.defineParameterCommand,
        $.customCommand,
        // $.macroCommand,
        $.layoutCommand,
      ),
      optional($.space),
      optional($.comment),
      $.newLine,
    )),

    commentStatement: $ => seq(
      optional($.space),
      optional($.comment),
      $.lineEnd,
    ),

    emptyStatement: $ => seq(
      optional($.space),
      $.lineEnd,
    ),

    // macroCallStatement: $ => seq(
    //   optional($.space),
    //   $.identifier,
    //   optional(repeat1(seq($.space, $.identifier))),
    //   optional($.space),
    //   optional($.comment),
    //   $.newLine,
    // ),

    // // Принимает только один параметр, т.е. clear trans.* tcp.* - нельзя.
    clearCommand: $ => seq(
      /clear/i,
      $.space,
      $.layoutProperty,
    ),
    
    // // Принимает только один параметр, т.е. reset trans.* tcp.* - нельзя.
    resetCommand: $ => seq(
      /reset/i,
      $.space,
      $.layoutProperty,
    ),
    
    setCommand: $ => seq(
      /set/i,
      $.space,
      choice(
        $.userProperty,
        $.layoutProperty,
      ),
      $.space,
      $.expression,
    ),

    // // defCommand: $ => seq(
    // //   /def/i,
    // //   $.identifier,
    // //   repeat1($._anyToken), // TODO
    // // ),

    frontCommand: $ => seq(
      /front/i,
      repeat1(seq($.space, $.layoutProperty)),
    ),

    // // macroCommand: $ => seq(
    // //   /macro/i,
    // //   $.identifier,
    // //   optional($.macroParameterList),
    // //   optional($.macroBlock),
    // //   /endmacro/i,
    // // ),
    // // macroParameterList: $ => seq(
    // //   $.identifier,
    // //   repeat($.identifier),
    // // ),
    // // macroBlock: $ => repeat1($._anyToken), // TODO

    defineParameterCommand: $ => seq(
      /define_parameter/i,
      $.space,
      $.identifier,
      $.space,
      $.string,
      $.space,
      $.number,
      $.space,
      $.number,
      $.space,
      $.number,
    ),
    
    customCommand: $ => seq(
      /custom/i,
      $.space,
      $.layoutProperty,
      optional(seq($.space, $.string)),
      optional(seq($.space, $.number)),
      optional(seq($.space, $.string)),
      optional(seq($.space, $.string)),
    ),
    
    layoutCommand: $ => seq(
      /layout/i,
      $.space,
      $.string,
      optional(seq($.space, $.string)),
      $.newLine,
      optional(repeat($.statement)),
      seq(optional($.space), /endlayout/i),
    ),

    coordinateList: $ => seq(
      "[",
      optional($.space),
      $.coordinateListItem,
      ...repeatUpTo(7, seq(optional( // TODO: не забыть вернуть на 7
        seq(
          $.space,
          $.coordinateListItem,
        ),
      ))),
      optional($.space),
      "]",
    ),
    placeholder: $ => '.',
    coordinateListItem: $ => choice(
      $.placeholder,
      $.scalarValue,
      $.userProperty,
      seq($.userProperty, $.accessExpression),
      $.layoutProperty, // TODO: should we allow this?
      seq($.layoutProperty, $.accessExpression),
    ),
    accessExpression: $ => seq(
      '{',
      optional($.space),
      choice('x', 'y', 'w', 'h', 'ls', 'ts', 'rs', 'bs', /[0-7]/),
      optional($.space),
      '}',
    ),

    expression: $ => choice(
      $.identifier,
      $.combinatorExpression,
      $.coordinateList,
      $.conditionalExpression,
      $.layoutProperty,
      $.scalarValue,
      $.placeholder,
    ),
    scalarValue: $ => choice(
      $.number,
      $.scalarProperty,
      seq($.layoutProperty, $.accessExpression),
      $.userProperty,
      seq($.userProperty, $.accessExpression),
    ),

    combinatorExpression: $ => choice(
      // $.wtf1, // +:
      // $.wtf2, // *:
      $.additionExpression,
      $.subtractionExpression,
      $.multiplicationExpression,
      $.divisionExpression,
    ),

    // wtf1: $ => seq(
    //   '+:',
    //   $.expression,
    //   ':',
    //   $.expression,
    // ),
    // wtf2: $ => seq(
    //   '*:',
    //   $.expression,
    //   ':',
    //   $.expression,
    // ),

    additionExpression: $ => seq(
      '+',
      $.space,
      $.expression,
      $.space,
      $.expression,
    ),
    subtractionExpression: $ => seq(
      '-',
      $.space,
      $.expression,
      $.space,
      $.expression,
    ),
    multiplicationExpression: $ => seq(
      '*',
      $.space,
      $.expression,
      $.space,
      $.expression,
    ),
    divisionExpression: $ => seq(
      '/',
      $.space,
      $.expression,
      $.space,
      $.expression,
    ),

    // TODO: decide whether optional branches should be supported at all.
    conditionalExpression: $ => choice(
      $.positiveConditional,
      $.negativeConditional,
      $.relationalConditional,
      // $.bitwiseConditional,
    ),
    positiveConditional: $ => prec(1, seq(
      '?',
      $.scalarValue,
      $.space,
      $.expression,
      choice(
        seq($.space, $.expression),
        seq($.space, $.placeholder),
      ),
    )),
    negativeConditional: $ => seq(
      '!',
      $.scalarValue,
      $.space,
      $.expression,
      choice(
        seq($.space, $.expression),
        seq($.space, $.placeholder),
      ),
    ),
    relationalConditional: $ => seq(
      $.scalarValue,
      choice('<', '>', '<=', '>=', '==', '!='),
      $.scalarValue,
      $.space,
      $.expression,
      choice(
        seq($.space, $.expression),
        seq($.space, $.placeholder),
      ),
    ),
    // bitwiseConditional: $ => seq(
    //   $.expression,
    //   '&',
    //   $.expression,
    //   $.expression,
    //   $.expression,
    // ),

    property: $ => choice(
      $.layoutProperty,
      $.scalarProperty,
      $.userProperty,
    ),
    scalarProperty: $ => choice(
      'w',
      'h',
      'reaper_version',
      'os_type',
      'folderstate',
      'folderdepth',
      'maxfolderdepth',
      'mcp_maxfolderdepth',
      'recarm',
      'tcp_iconsize',
      'mcp_iconsize',
      'mcp_wantextmix',
      'tracknch',
      'trackpanmode',
      'tcp_fxparms',
      'tcp_fxembed',
      'mcp_fxembed',
      'tcp_sends_enabled',
      'tcp_fxlist_enabled',
      'trackpinned',
      'tcp_hidden_overridden',
      'send_cnt',
      'fx_parm_cnt',
      'fx_cnt',
      'recfx_cnt',
      'trackcolor_valid',
      'trackcolor_r',
      'trackcolor_g',
      'trackcolor_b',
      'mixer_visible',
      'track_selected',
      'trackidx',
      'ntracks',
      'trackfixedlanes',
      'trans_flags',
      'trans_docked',
      'trans_center',
      'envcp_type',
      'env_selected',
    ),
    layoutKeyword: $ => choice(
      'arm',
      'automode',
      'bottom',
      'bpm',
      'bypass',
      'color',
      'curtimesig',
      'div',
      'dockedheight',
      'dragdropinfo',
      'edit',
      'env',
      'envcp',
      'extmixer',
      'fader',
      'fadermode',
      'folder',
      'foldercomp',
      'font',
      'fwd',
      'fx',
      'fxbyp',
      'fxembed',
      'fxembedheader',
      'fxin',
      'fxlist',
      'fxparm',
      'hide',
      'infoblock',
      'inputlabel',
      'inputlabelbox',
      'io',
      'label',
      'learn',
      'lit',
      'margin',
      'master',
      'mcp',
      'menubutton',
      'meter',
      'minmax',
      'mod',
      'mode',
      'mono',
      'mute',
      'pan',
      'pause',
      'phase',
      'play',
      'position',
      'rate',
      'readout',
      'rec',
      'recarm',
      'recinput',
      'recmode',
      'recmon',
      'repeat',
      'rew',
      'rmsdiv',
      'rmsreadout',
      'scale',
      'sel',
      'sendlist',
      'size',
      'solo',
      'status',
      'stop',
      'tap',
      'tcp',
      'timebase',
      'top',
      'trackidx',
      'trans',
      'unlit',
      'value',
      'visflags',
      'volume',
      'vu',
      'width',
    ),
    layoutProperty: $ => prec.left(100, seq(
      $.layoutKeyword,
      repeat(seq('.', $.layoutKeyword)),
      optional(
        choice(
          seq('.', '*'),
          seq('.', 'custom', '.', $.userProperty),
        ),
      ),
    )),
    userProperty: $ => $.identifier, // TODO: пользовательские поля не должны совпадать с layoutKeyword и scalarProperty.
  }
});
