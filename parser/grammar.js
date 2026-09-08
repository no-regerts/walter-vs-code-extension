// Приоритетность всех отдельных команд (setCommand, ...) должна быть выше, чем у macroCallStatement.

// Унарные минусы перед идентификаторами не поддерживаются:
// set scalar -20
// set trans.play [ scalar . . .] // сдвинет кнопку влево на 20.
// set scalar 20
// set trans.play [ -scalar . . .] // сдвинет кнопку на значение идентификатора '-scalar', а не 'scalar'.

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
    [$.normalConditional],
    [$.negativeConditional],
    [$.bitwiseConditional],
    [$.additionExpression],
    [$.subtractionExpression],
    [$.multiplicationExpression],
    [$.divisionExpression],
    [$.macroCallStatement, $.property],
    [$.weightedSumExpression],
    [$.offsetProductExpression],
    [$.coordinateListItem, $.scalarValue],
    [$.expression, $.negativeConditional],
    [$.expression, $.relationalConditional],
    [$.expression, $.bitwiseConditional],
    [$.space, $.trailingSpaces],
    [$.defineParameterCommand],
    [$.expression, $.scalarValue],
    [$.property],
    [$.scalarValue],
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

    number: $ => seq(optional($.minus), /\d+(?:\.\d+)?/),
    minus: $ => '-', // Используется, чтобы устранить неоднозначность между отрицательными числами и идентификаторами, начинающимися на '-'.

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

    identifier: $ => /[a-z_#][a-z0-9_#]*/i,

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
      optional(seq('.', '*')),
    ),
    
    // Checked: принимает только один параметр, т.е. reset trans.* tcp.* - нельзя.
    resetCommand: $ => seq(
      token(prec(2, /reset/i)),
      $.space,
      $.property,
      optional(seq('.', '*')),
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
      seq(optional($.space), optional($.comment), $.newLine),
      optional(repeat($.statement)),
      seq(optional($.space), token(/endmacro/i)),
    ),

    // TODO: сделать опциональные токены.
    defineParameterCommand: $ => seq(
      token(prec(2, /define_parameter/i)),
      $.space,
      $.property, // Checked: the documentation says that strings could be used for name too, but for the consistency we allow only identifiers.
      $.space,
      choice($.string, $.identifier), // Description. Checked: if used inside macros, then all formal parameters might be identifiers. TODO: apply this rule for all commands?
      $.space,
      choice($.number, $.identifier), // Default value.
      optional(seq(
        $.space, choice($.number, $.identifier), // Minimum value.
        $.space, choice($.number, $.identifier), // Maximum value.
      )),
    ),
    
    customCommand: $ => seq(
      token(prec(2, /custom/i)),
      $.space,
      $.property,
      optional(seq($.space, $.string)),
      optional(seq($.space, choice($.number, $.identifier))), // ID. Checked: REAPER supports both numbers and [_a-zA-Z0-9].
      optional(seq($.space, $.string)),
      optional(seq($.space, $.string)),
    ),
    
    layoutCommand: $ => seq(
      token(prec(2, /layout/i)),
      $.space,
      $.string,
      optional(seq($.space, $.string)),
      seq(optional($.space), optional($.comment), $.newLine), // Пробелы после имени папки и перевод строки.
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
      $.placeholder, // Checked: 'set var 2>1 5 .' is a valid statement.
      $.property,
      $.scalarValue,
      $.combinatorExpression,
      $.conditionalExpression,
      $.coordinateList,
      seq($.scalarValue, $.atExpression),
      seq($.property, $.accessExpression, $.atExpression),
      seq($.property, $.atExpression), // coordlist@x is a shorthand for coordlist{x}@x, as described in the documentation.
    ),

    combinatorExpression: $ => choice(
      $.weightedSumExpression, // +:
      $.offsetProductExpression, // *:
      $.additionExpression,
      $.subtractionExpression,
      $.multiplicationExpression,
      $.divisionExpression,
    ),
    weightedSumExpression: $ => seq(
      '+:',
      $.scalarValue,
      ':',
      $.scalarValue,
      $.space,
      $.expression,
      optional(seq($.space, $.expression)),
    ),
    offsetProductExpression: $ => seq(
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
      $.minus,
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
      $.normalConditional,
      $.negativeConditional,
      $.relationalConditional,
      $.bitwiseConditional,
    ),
    normalConditional: $ => prec(1, seq(
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

    scalarValue: $ => choice(
      $.number,
      $.property,
      $.predefinedScalarProperty,
      seq($.scalarValue, $.accessExpression), // Для ситуаций вроде w{0}. Технически это не ошибка, поэтому разрешаем.
      seq($.property, $.accessExpression),
    ),

    // For both user-defined (myVar, my_var) and built-in (tcp.mute) properties
    property: $ => seq(
      $.identifier,
      repeat(seq('.', $.identifier)),
    ),
    predefinedScalarProperty: $ => choice(
      token('w'),
      token('h'),
      token('reaper_version'),
      token('os_type'),
      token('folderstate'),
      token('folderdepth'),
      token('maxfolderdepth'),
      token('mcp_maxfolderdepth'),
      token('recarm'),
      token('tcp_iconsize'),
      token('mcp_iconsize'),
      token('mcp_wantextmix'),
      token('tracknch'),
      token('trackpanmode'),
      token('tcp_fxparms'),
      token('tcp_fxembed'),
      token('mcp_fxembed'),
      token('tcp_sends_enabled'),
      token('tcp_fxlist_enabled'),
      token('trackpinned'),
      token('tcp_hidden_overridden'),
      token('send_cnt'),
      token('fx_parm_cnt'),
      token('fx_cnt'),
      token('recfx_cnt'),
      token('trackcolor_valid'),
      token('trackcolor_r'),
      token('trackcolor_g'),
      token('trackcolor_b'),
      token('mixer_visible'),
      token('track_selected'),
      token('trackidx'),
      token('ntracks'),
      token('trackfixedlanes'),
      token('trans_flags'),
      token('trans_docked'),
      token('trans_center'),
      token('envcp_type'),
      token('env_selected'),
    ),
  }
});
