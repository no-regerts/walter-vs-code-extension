// Приоритетность всех отдельных команд (setCommand, ...) должна быть выше, чем у macroCallStatement.

// Унарные минусы перед идентификаторами не поддерживаются:
// set scalar -20
// set trans.play [ scalar . . .] // сдвинет кнопку влево на 20.
// set scalar 20
// set trans.play [ -scalar . . .] // сдвинет кнопку на значение идентификатора '-scalar', а не 'scalar'.

const nonSpaceRegex = /[a-z0-9_+\-*/\\@&!?<>='"`:.,(){}\[\]]+/i;
const commentWordRegex = /[\p{L}0-9_+\-*/\\@&!?<>='"`;:.,(){}\[\]]+/i;
const spaceRegex = /[^\p{L}0-9_+\-*/\\@&!?<>='"`;:.,(){}\[\]\r\n]+/i;

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
    [$.defCommand],
    [$.frontCommand],
    [$.layoutCommand],
    [$.customCommand],
    [$.macroCommand],
    [$.defineParameterCommand],

    [$.relationalConditional],
    [$.normalConditional],
    [$.negativeConditional],
    [$.bitwiseConditional],

    [$.weightedSumExpression],
    [$.offsetProductExpression],
    [$.additionExpression],
    [$.subtractionExpression],
    [$.multiplicationExpression],
    [$.divisionExpression],

    [$.macroCallStatement, $.property],
    [$.coordinateListItem, $.scalarValue],
    [$.expression, $.scalarValue],
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($._statement),

    lineEnd: $ => choice(
      /\r?\n/,
      // '\0',
      // eof(), // TODO: handle the EOF too.
    ),

    commentWord: $ => token(/\S+/),
    anyWord: $ => nonSpaceRegex,
    space: $ => token(prec(1, spaceRegex)),

    comment: $ => prec.left(seq(
      token(';'),
      repeat(seq(optional($.space), $.commentWord)),
      optional(alias($.space, $.trailingSpace)),
    )),
    commentWord: $ => commentWordRegex,

    number: $ => seq(optional($.minus), /\d+(?:\.\d+)?/),
    minus: $ => '-', // Используется, чтобы устранить неоднозначность между отрицательными числами и идентификаторами, начинающимися на '-'.
    hexColor: $ => /[0-9a-f]{8}/i, // Verified: only 8-digit colors are supported.

    macroToken: _ => token(prec(10, /macro/i)),

    string: $ => choice(
      $.singleQuoteString,
      $.doubleQuoteString,
      $.backtickQuoteString,
    ),
    singleQuoteString: $ => /'[^\r\n']*'/,
    doubleQuoteString: $ => /"[^\r\n"]*"/,
    backtickQuoteString: $ => /`[^\r\n`]*`/,

    identifier: $ => /[a-z_#][a-z0-9_#]*/i,

    _statement: $ => choice(
      $.noopStatement,
      $.commandStatement,
      $.themeConfigStatement,
      $.macroCallStatement,
    ),
    noopStatement: $ => choice(
      seq(
        alias($.space, $.trailingSpace),
        $.lineEnd,
      ),
      seq(
        optional($.space),
        $.comment,
        $.lineEnd,
      ),
      $.lineEnd,
    ),
    commandStatement: $ => seq(
      optional($.space),
      choice(
        $.clearCommand,
        $.resetCommand,
        $.setCommand,
        $.defCommand,
        $.frontCommand,
        $.defineParameterCommand,
        $.customCommand,
        $.macroCommand,
        $.layoutCommand,
      ),
      choice(
        seq(
          optional($.space),
          $.comment,
          $.lineEnd,
        ),
        seq(
          alias($.space, $.trailingSpace),
          $.lineEnd,
        ),
        $.lineEnd,
      ),
    ),
    themeConfigStatement: $ => seq(
      optional($.space),
      choice(
        seq(token(prec(1, /version/i)), $.space, $.number),
        seq(token(prec(1, /use_pngs/i)), $.space, choice('0', '1')),
        seq(token(prec(1, /use_overlays/i)), $.space, choice('0', '1')),
        seq(token(prec(1, /tinttcp/i)), $.space, $.number), // TODO: пометить как предупреждение, т.к. не стоит отбирать контроль у пользователя.
        seq(token(prec(1, /peaksedges/i)), $.space, $.number), // TODO: пометить как предупреждение, т.к. не стоит отбирать контроль у пользователя.
        seq(token(prec(1, /tcp_folderindent/i)), $.space, $.number),
        seq(token(prec(1, /tcp_heights/i)), $.space, $.number, $.space, $.number, $.space, $.number, $.space, $.number),
        seq(token(prec(1, /tcp_master_minheight/i)), $.space, $.number),
        seq(token(prec(1, /tcp_voltext_flags/i)), $.space, $.number, optional(seq($.space, $.number))), // Checked: the last value is optional.
        seq(token(prec(1, /tcp_master_voltext_flags/i)), $.space, $.number, optional(seq($.space, $.number))), // Checked: the last value is optional.
        seq(token(prec(1, /mcp_voltext_flags/i)), $.space, $.number, optional(seq($.space, $.number))), // Checked: the last value is optional.
        seq(token(prec(1, /mcp_master_voltext_flags/i)), $.space, $.number, optional(seq($.space, $.number))), // Checked: the last value is optional.
        seq(token(prec(1, /tcp_vupeakwidth/i)), $.space, $.number),
        seq(token(prec(1, /mcp_vupeakheight/i)), $.space, $.number),
        seq(token(prec(1, /mcp_mastervupeakheight/i)), $.space, $.number),
        seq(token(prec(1, /tcp_showborders/i)), $.space, choice('0', '1')),
        seq(token(prec(1, /mcp_showborders/i)), $.space, choice('0', '1')),
        seq(token(prec(1, /trans_showborders/i)), $.space, choice('0', '1')),
        seq(token(prec(1, /mcp_altmeterpos/i)), $.space, choice('0', '1')),
        seq(token(prec(1, /tcp_vol_zeroline/i)), $.space, $.hexColor),
        seq(token(prec(1, /tcp_pan_zeroline/i)), $.space, $.hexColor),
        seq(token(prec(1, /tcp_width_zeroline/i)), $.space, $.hexColor),
        seq(token(prec(1, /mcp_vol_zeroline/i)), $.space, $.hexColor),
        seq(token(prec(1, /mcp_pan_zeroline/i)), $.space, $.hexColor),
        seq(token(prec(1, /mcp_width_zeroline/i)), $.space, $.hexColor),
        seq(token(prec(1, /trans_speed_zeroline/i)), $.space, $.hexColor),
        seq(token(prec(1, /item_volknobfg/i)), $.space, $.hexColor, $.space, $.hexColor, $.space, $.hexColor),
        seq(token(prec(1, /envcp_min_height/i)), $.space, $.number),
        seq(token(prec(1, /mcp_min_height/i)), $.space, $.number),
        seq(token(prec(1, /no_meter_reclbl/i)), $.space, choice('0', '1')),
        seq(token(prec(1, /gen_pan_zeroline/i)), $.space, $.hexColor),
        seq(token(prec(1, /gen_vol_zeroline/i)), $.space, $.hexColor),
        seq(token(prec(1, /warnings/i)), $.space, choice(token(/all/i), token(/pedantic/i))),
        seq(token(prec(1, /adjuster_script/i)), $.space, $.string),
        seq(token(prec(1, /misc_dpi_translate/i)), $.space, $.number, $.space, $.number),
        seq(token(prec(1, /global_scale/i)), $.space, $.number),
        seq(token(prec(2, /layout_dpi_translate/i)), $.space, $.string, $.space, $.number, $.space, $.string), // Лексический приоритет должен быть выше, чем у команды layout.
        seq(token(prec(2, /want_os_type/i)), $.space, choice('0', '1')), // Без понятия почему у этого токена приоритет должен быть выше, чем у macroCallStatement.
      ),
      choice(
        seq(
          optional($.space),
          $.comment,
          $.lineEnd,
        ),
        seq(
          alias($.space, $.trailingSpace),
          $.lineEnd,
        ),
        $.lineEnd,
      ),
    ),
    macroCallStatement: $ => seq(
      optional($.space),
      $.identifier,
      optional(repeat1(seq(
        $.space,
        choice(
          $.identifier,
          $.number,
          $.string,
          $.property,
          $.coordinateList,
        ),
        optional($.accessExpression),
      ))),
      choice(
        seq(
          optional($.space),
          $.comment,
          $.lineEnd,
        ),
        seq(
          alias($.space, $.trailingSpace),
          $.lineEnd,
        ),
        $.lineEnd,
      ),
    ),
    
    ///////////////////////////////// COMMANDS /////////////////////////////////

    // Checked: принимает только один параметр, т.е. reset trans.* tcp.* - нельзя.
    clearCommand: $ => seq(
      token(prec(1, /clear/i)),
      $.space,
      $.property,
      optional(token('.*')),
    ),
    // Checked: принимает только один параметр, т.е. reset trans.* tcp.* - нельзя.
    resetCommand: $ => seq(
      token(prec(1, /reset/i)),
      $.space,
      $.property,
      optional(token('.*')),
    ),
    setCommand: $ => seq(
      token(prec(1, /set/i)),
      $.space,
      $.property,
      $.space,
      $.expression,
    ),
    defCommand: $ => seq(
      token(prec(1, /def/i)),
      $.space,
      $.identifier,
      repeat1(seq($.space, $.anyWord)),
    ),
    frontCommand: $ => seq(
      token(prec(1, /front/i)),
      repeat1(seq($.space, $.property)),
    ),
    macroCommand: $ => seq(
      token(prec(1, /macro/i)),
      $.space,
      $.identifier,
      repeat(seq($.space, $.identifier)),
      choice(
        seq(optional($.space), $.comment, $.lineEnd),
        seq(alias($.space, $.trailingSpace), $.lineEnd),
        $.lineEnd,
      ),
      optional(repeat($._statement)),
      optional(seq(
        optional($.space),
        token(prec(1, /endmacro/i)),
      )),
    ),
    defineParameterCommand: $ => seq(
      token(prec(1, /define_parameter/i)),
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
      token(prec(1, /custom/i)),
      $.space,
      $.property,
      optional(seq($.space, $.string)),
      optional(seq($.space, choice($.number, $.identifier))), // ID. Checked: REAPER supports both numbers and [_a-zA-Z0-9].
      optional(seq($.space, $.string)),
      optional(seq($.space, $.string)),
    ),
    layoutCommand: $ => seq(
      token(prec(1, /layout/i)),
      $.space,
      $.string,
      optional(seq($.space, $.string)),
      choice(
        seq(
          optional($.space),
          $.comment,
          $.lineEnd,
        ),
        seq(
          alias($.space, $.trailingSpace),
          $.lineEnd,
        ),
        $.lineEnd,
      ),
      optional(repeat($._statement)),
      optional(seq(
        optional($.space),
        token(prec(1, /endlayout/i)),
      )),
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
      $._conditionalExpression,
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

    _conditionalExpression: $ => choice(
      $.normalConditional,
      $.negativeConditional,
      $.relationalConditional,
      $.bitwiseConditional,
    ),
    normalConditional: $ => seq(
      token('?'),
      choice(
        seq($._conditionalExpression, optional(seq($.space, $.expression))),
        seq($.scalarValue, $.space, $.expression, optional(seq($.space, $.expression))),
      ),
    ),
    negativeConditional: $ => seq(
      token('!'),
      choice(
        seq($._conditionalExpression, optional(seq($.space, $.expression))),
        seq($.scalarValue, $.space, $.expression, optional(seq($.space, $.expression))),
      ),
    ),
    relationalConditional: $ => seq(
      $.scalarValue,
      choice(
        token('<'),
        token('>'),
        token('<='),
        token('>='),
        token('=='),
        token('!='),
      ),
      $.scalarValue,
      $.space,
      $.expression,
      optional(seq($.space, $.expression)),
    ),
    bitwiseConditional: $ => seq(
      $.scalarValue,
      token('&'),
      $.scalarValue,
      $.space,
      $.expression,
      optional(seq($.space, $.expression)),
    ),

    scalarValue: $ => choice(
      $.number,
      $.property,
      $.predefinedScalarProperty,
      seq($.scalarValue, $.accessExpression), // Для ситуаций вроде w{0}. Технически это не ошибка, поэтому разрешаем.
    ),

    // For both user-defined (myVar, my_var) and built-in (tcp.mute) properties
    property: $ => choice(
      $.identifier,
      prec.left(seq($.property, '.', $.identifier))
    ),
    predefinedScalarProperty: $ => choice(
      token(prec(2, 'w')),
      token(prec(2, 'h')),
      token(prec(2, 'reaper_version')),
      token(prec(2, 'os_type')),
      token(prec(2, 'folderstate')),
      token(prec(2, 'folderdepth')),
      token(prec(2, 'maxfolderdepth')),
      token(prec(2, 'mcp_maxfolderdepth')),
      token(prec(2, 'recarm')),
      token(prec(2, 'tcp_iconsize')),
      token(prec(2, 'mcp_iconsize')),
      token(prec(2, 'mcp_wantextmix')),
      token(prec(2, 'tracknch')),
      token(prec(2, 'trackpanmode')),
      token(prec(2, 'tcp_fxparms')),
      token(prec(2, 'tcp_fxembed')),
      token(prec(2, 'mcp_fxembed')),
      token(prec(2, 'tcp_sends_enabled')),
      token(prec(2, 'tcp_fxlist_enabled')),
      token(prec(2, 'trackpinned')),
      token(prec(2, 'tcp_hidden_overridden')),
      token(prec(2, 'send_cnt')),
      token(prec(2, 'fx_parm_cnt')),
      token(prec(2, 'fx_cnt')),
      token(prec(2, 'recfx_cnt')),
      token(prec(2, 'trackcolor_valid')),
      token(prec(2, 'trackcolor_r')),
      token(prec(2, 'trackcolor_g')),
      token(prec(2, 'trackcolor_b')),
      token(prec(2, 'mixer_visible')),
      token(prec(2, 'track_selected')),
      token(prec(2, 'trackidx')),
      token(prec(2, 'ntracks')),
      token(prec(2, 'trackfixedlanes')),
      token(prec(2, 'trans_flags')),
      token(prec(2, 'trans_docked')),
      token(prec(2, 'trans_center')),
      token(prec(2, 'envcp_type')),
      token(prec(2, 'env_selected')),
    ),
  }
});
