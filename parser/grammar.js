// Приоритетность всех отдельных команд (setCommand, ...) должна быть выше, чем у macroCallStatement.

const spaceRegex = /[^a-z0-9_+\-*/\\@&!?<>='"`;:.,(){}\[\]\r\n]+/i;

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
    token(seq('\\', /\r?\n/, optional(spaceRegex))),
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.singleLineCommentStatement, $.emptyLineStatement],
    [$.frontCommand],
    [$.customCommand],
    [$.relationalConditional],
    [$.positiveConditional],
    [$.negativeConditional],
    [$.bitwiseConditional],
    [$.additionExpression],
    [$.subtractionExpression],
    [$.multiplicationExpression],
    [$.divisionExpression],
    [$.macroCallStatement, $.property],
    [$.wtf1Expression],
    [$.wtf2Expression],
    [$.coordinateListItem, $.scalarValue],
    [$.property, $.scalarValue],
    [$.expression, $.negativeConditional],
    [$.expression, $.relationalConditional],
    [$.expression, $.bitwiseConditional],
    [$.space, $.trailingSpaces],
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($.statement),

    lineEnd: $ => choice(
      $.newLine,
      // eof(), // TODO: детектировать конец файла.
    ),

    // anyChar: $ => /[^\s\S]/,

    space: $ => spaceRegex,
    trailingSpaces: $ => spaceRegex,
    newLine: $ => /\r?\n/,

    comment: $ => /;[^\r\n]*/,

    number: $ => /-?\d+(?:\.\d+)?/,

    hexColor: $ => choice(
      /[0-9a-f]{8}/i,
      /[0-9a-f]{6}/i, // TODO: проверить, что 6-значные хексы работают для цветов.
    ),

    string: $ => choice(
      $.singleQuoteString,
      $.doubleQuoteString,
      $.backtickQuoteString,
    ),
    singleQuoteString: $ => /'[^\r\n']*'/,
    doubleQuoteString: $ => /"[^\r\n"]*"/,
    backtickQuoteString: $ => /`[^\r\n`]*`/,

    identifier: $ => /[a-z_\-#][a-z0-9_\-#]*/i,

    statement: $ => choice(
      $.emptyLineStatement,
      $.singleLineCommentStatement,
      $.commandStatement,
      $.themeConfigStatement,
      $.macroCallStatement,
    ),

    emptyLineStatement: $ => seq(
      optional($.trailingSpaces), // Any spaces on an empty line are trailing spaces.
      $.lineEnd,
    ),

    singleLineCommentStatement: $ => seq(
      optional($.space),
      optional($.comment), // TODO: detect trailing spaces after comments.
      $.lineEnd,
    ),

    commandStatement: $ => prec(1, seq(
      optional($.space),
      choice(
        $.clearCommand,
        $.resetCommand,
        $.setCommand,
        // $.defCommand,
        $.frontCommand,
        $.defineParameterCommand,
        $.customCommand,
        $.macroCommand,
        $.layoutCommand,
      ),
      optional($.space),
      optional($.comment), // TODO: detect trailing spaces after comments.
      $.newLine,
    )),

    themeConfigStatement: $ => seq(
      optional($.space),
      choice(
        $.singleNumberConfigStatement,
        $.doubleNumberConfigStatement,
        $.quadripleNumberConfigStatement,
        $.sinleColorConfigStatement,
        $.tripleColorConfigStatement,
        $.stringConfigStatement,
      ),
      optional($.space),
      optional($.comment),
      $.newLine,
    ),
    singleNumberConfigStatement: $ => seq(
      $.singleNumberConfigKeyword,
      $.space,
      $.number,
    ),
    singleNumberConfigKeyword: $ => choice(
      'version',
      'use_pngs',
      'use_overlays',
      'tcp_showborders',
      'mcp_showborders',
      'trans_showborders',
      'tcp_vupeakwidth',
      'mcp_vupeakheight',
      'mcp_mastervupeakheight',
      'mcp_altmeterpos',
      'tcp_master_minheight',
      'no_meter_reclbl',
      'mcp_min_height',
      'tcp_folderindent',
      'envcp_min_height',
      'tinttcp',
      'peaksedges',
      'want_os_type',
    ),
    doubleNumberConfigStatement: $ => seq(
      $.doubleNumberConfigKeyword,
      $.space,
      $.number,
      $.space,
      $.number,
    ),
    doubleNumberConfigKeyword: $ => choice(
      'tcp_voltext_flags',
      'mcp_voltext_flags',
      'misc_dpi_translate',
    ),
    quadripleNumberConfigStatement: $ => seq(
      $.quadripleNumberConfigKeyword,
      $.space,
      $.number,
      $.space,
      $.number,
      $.space,
      $.number,
      $.space,
      $.number,
    ),
    quadripleNumberConfigKeyword: $ => choice(
      'tcp_heights',
    ),
    sinleColorConfigStatement: $ => seq(
      $.sinleColorConfigKeyword,
      $.space,
      $.hexColor,
    ),
    sinleColorConfigKeyword: $ => choice(
      'tcp_vol_zeroline',
      'tcp_pan_zeroline',
      'mcp_vol_zeroline',
      'mcp_pan_zeroline',
      'trans_speed_zeroline',
      'gen_vol_zeroline',
      'gen_pan_zeroline',
    ),
    tripleColorConfigStatement: $ => seq(
      $.tripleColorConfigKeyword,
      $.space,
      $.hexColor,
      $.space,
      $.hexColor,
      $.space,
      $.hexColor,
    ),
    tripleColorConfigKeyword: $ => choice(
      'item_volknobfg',
    ),
    stringConfigStatement: $ => seq(
      $.stringConfigKeyword,
      $.space,
      $.string,
    ),
    stringConfigKeyword: $ => choice(
      'adjuster_script',
    ),

    macroCallStatement: $ => prec(0, seq(
      optional($.space),
      $.identifier,
      optional(repeat1(seq(
        $.space,
        choice(
          $.identifier,
          $.number,
          $.string,
          $.property
        ),
        optional($.accessExpression)
      ))),
      optional($.space),
      optional($.comment), // TODO: detect trailing spaces after comments.
      $.newLine,
    )),
    
        ///////////////////////////////// COMMANDS /////////////////////////////////

    // Checked: принимает только один параметр, т.е. reset trans.* tcp.* - нельзя.
    clearCommand: $ => seq(
      token(prec(2, /clear/i)),
      $.space,
      $.property,
    ),
    
    // Checked: принимает только один параметр, т.е. reset trans.* tcp.* - нельзя.
    resetCommand: $ => seq(
      token(prec(2, /reset/i)),
      $.space,
      $.property,
    ),
    
    setCommand: $ => seq(
      token(prec(2, /set/i)),
      $.space,
      $.property,
      $.space,
      $.expression,
    ),

    // defCommand: $ => seq(
    //   token(prec(2, /def/i)),
    //   $.identifier,
    //   repeat1($._anyToken), // TODO
    // ),

    frontCommand: $ => seq(
      token(prec(2, /front/i)),
      repeat1(seq($.space, $.property)),
    ),

    macroCommand: $ => seq(
      token(prec(0, /macro/i)), // TODO: wtf?
      $.space,
      $.identifier,
      optional(seq(
        $.space, seq(
          $.identifier,
          repeat(seq($.space, $.identifier)),
        ),
      )), 
      seq(optional($.space), $.newLine),
      optional(repeat($.statement)),
      seq(optional($.space), token(/endmacro/i)),
    ),

    // TODO: сделать опциональные токены.
    defineParameterCommand: $ => seq(
      token(prec(2, /define_parameter/i)),
      $.space,
      $.identifier, // Checked: the documentation says that strings could be used for name too, but for the consistency we allow only identifiers.
      $.space,
      $.string, // Description.
      $.space,
      choice($.number, $.identifier), // Default value.
      $.space,
      choice($.number, $.identifier), // Minimum value.
      $.space,
      choice($.number, $.identifier), // Maximum value.
    ),
    
    customCommand: $ => seq(
      token(prec(2, /custom/i)),
      $.space,
      $.property,
      optional(seq($.space, $.string)),
      optional(seq($.space, $.number)),
      optional(seq($.space, $.string)),
      optional(seq($.space, $.string)),
    ),
    
    layoutCommand: $ => seq(
      token(prec(2, /layout/i)),
      $.space,
      $.string,
      optional(seq($.space, $.string)),
      seq(optional($.space), $.newLine), // Пробелы после имени папки и перевод строки.
      optional(repeat($.statement)),
      seq(optional($.space), token(prec(2, /endlayout/i))),
    ),

    ////////////////////////////////////////////////////////////////////////////

    coordinateList: $ => seq(
      "[",
      optional($.space),
      $.coordinateListItem,
      ...repeatUpTo(7, seq(optional(
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
      $.property, // layoutProperty тоже можно, т.к. возьмётся только соответствующий элемент.
      seq($.property, $.accessExpression),
    ),
    accessExpression: $ => seq(
      '{',
      optional($.space),
      $.accessIndex,
      optional($.space),
      '}',
    ),
    atExpression: $ => seq('@', $.accessIndex),
    accessIndex: $ => choice('x', 'y', 'w', 'h', 'ls', 'ts', 'rs', 'bs', /[0-7]/),

    // TODO: throw away all entries that are not expressions.
    expression: $ => choice(
      $.placeholder, // Checked: set var 2>1 5 .
      $.property,
      $.scalarValue,
      $.combinatorExpression,
      $.conditionalExpression,
      $.coordinateList,
      seq($.number, $.atExpression),
      seq($.property, $.accessExpression, $.atExpression),
    ),
    combinatorExpression: $ => choice(
      $.wtf1Expression, // +:
      $.wtf2Expression, // *:
      $.additionExpression,
      $.subtractionExpression,
      $.multiplicationExpression,
      $.divisionExpression,
    ),

    wtf1Expression: $ => seq(
      '+:',
      $.scalarValue,
      ':',
      $.scalarValue,
      $.space,
      $.expression,
      optional(seq($.space, $.expression)),
    ),
    wtf2Expression: $ => seq(
      '*:',
      $.scalarValue,
      ':',
      $.scalarValue,
      $.space,
      $.expression,
      optional(seq($.space, $.expression)),
    ),
    additionExpression: $ => seq(
      '+',
      $.space,
      $.expression,
      optional(seq($.space, $.expression)),
    ),
    subtractionExpression: $ => seq(
      '-',
      $.space,
      $.expression,
      optional(seq($.space, $.expression)),
    ),
    multiplicationExpression: $ => seq(
      '*',
      $.space,
      $.expression,
      optional(seq($.space, $.expression)),
    ),
    divisionExpression: $ => seq(
      '/',
      $.space,
      $.expression,
      optional(seq($.space, $.expression)),
    ),

    conditionalExpression: $ => choice(
      $.positiveConditional,
      $.negativeConditional,
      $.relationalConditional,
      $.bitwiseConditional,
      $.negatedConditionalExpression,
      // $.negatedBitwiseConditional,
    ),
    negatedConditionalExpression: $ => seq(
      '!',
      $.conditionalExpression,
    ),
    positiveConditional: $ => prec(1, seq(
      '?',
      $.scalarValue,
      $.space,
      $.expression,
      optional(choice(
        seq($.space, $.expression),
        seq($.space, $.placeholder),
      )),
    )),
    negativeConditional: $ => seq(
      '!',
      $.scalarValue,
      $.space,
      $.expression,
      optional(choice(
        seq($.space, $.expression),
        seq($.space, $.placeholder),
      )),
    ),
    relationalConditional: $ => seq(
      $.scalarValue,
      choice('<', '>', '<=', '>=', '==', '!='),
      $.scalarValue,
      $.space,
      $.expression,
      optional(choice(
        seq($.space, $.expression),
        seq($.space, $.placeholder),
      )),
    ),
    bitwiseConditional: $ => seq(
      $.scalarValue,
      '&',
      $.scalarValue,
      $.space,
      $.expression,
      optional(choice(
        seq($.space, $.expression),
        seq($.space, $.placeholder),
      )),
    ),
    // negatedBitwiseConditional: $ => seq(
    //   '!',
    //   $.bitwiseConditional,
    // ),

    property: $ => seq(
      $.identifier, // Predefined and user scalar properties...
      repeat(seq('.', $.identifier)), // ...and these are the layout properties.
      optional(seq('.', '*')),
    ),

    scalarValue: $ => choice(
      $.number,
      $.identifier, // TODO: temp replacement for scalar-only properties. 
      seq($.property, $.accessExpression),
      seq($.property, $.atExpression),
    ),
  }
});
