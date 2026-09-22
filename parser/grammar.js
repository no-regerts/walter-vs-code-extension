const anyWordRegex = token(/[^ \t\u00A0\uFEFF\u3000\r\n]+/i);
const spaceRegex = token(/[ \t\u00A0\uFEFF\u3000]+/i);

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

    [$.arithmeticExpression],
    [$.unaryConditional],
    [$.binaryConditional],

    [$._expression, $.scalarValue],
  ],

  rules: {
    source_file: $ => seq(
      repeat($._statement),
      eof()
    ),

    //////////////////////////////// STATEMENTS ////////////////////////////////

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
        alias($.space, $.trailingSpace),
        eof(),
      ),

      seq(
        optional($.space),
        $.comment,
        $.lineEnd,
      ),
      seq(
        optional($.space),
        $.comment,
        eof(),
      ),

      $.lineEnd,
    ),
    commandStatement: $ => seq(
      optional($.space),
      choice(
        $.clearCommand,
        $.resetCommand,
        $.setCommand,
        alias($.defCommand, $.defCommand),
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
          $.statementEnd,
        ),
        seq(
          alias($.space, $.trailingSpace),
          $.statementEnd,
        ),
        $.statementEnd,
      ),
    ),
    themeConfigStatement: $ => seq(
      optional($.space),
      choice(
        seq(token(prec(1, /version/i)), $.space, $.number),
        seq(token(prec(1, /use_pngs/i)), $.space, choice('0', '1')),
        seq(token(prec(1, /use_overlays/i)), $.space, choice('0', '1')),
        seq(token(prec(1, /tinttcp/i)), $.space, $.number),
        seq(token(prec(1, /peaksedges/i)), $.space, $.number),
        seq(token(prec(1, /tcp_folderindent/i)), $.space, $.number),
        seq(token(prec(1, /tcp_heights/i)), $.space, $.number, $.space, $.number, $.space, $.number, $.space, $.number),
        seq(token(prec(1, /tcp_master_minheight/i)), $.space, $.number),
        seq(token(prec(1, /tcp_voltext_flags/i)), $.space, $.number, optional(seq($.space, $.number))), // Verified: the last value is optional.
        seq(token(prec(1, /tcp_master_voltext_flags/i)), $.space, $.number, optional(seq($.space, $.number))), // Verified: the last value is optional.
        seq(token(prec(1, /mcp_voltext_flags/i)), $.space, $.number, optional(seq($.space, $.number))), // Verified: the last value is optional.
        seq(token(prec(1, /mcp_master_voltext_flags/i)), $.space, $.number, optional(seq($.space, $.number))), // Verified: the last value is optional.
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
        seq(token(prec(2, /layout_dpi_translate/i)), $.space, $.string, $.space, $.number, $.space, $.string), // Lexical precidence should be higher than the layout command have.
        seq(token(prec(2, /want_os_type/i)), $.space, choice('0', '1')), // TODO: no idea why this particular property is bugging out. For now, its priority should be higher than the priority of macroCallStatement.
      ),
      choice(
        seq(
          optional($.space),
          $.comment,
          $.statementEnd,
        ),
        seq(
          alias($.space, $.trailingSpace),
          $.statementEnd,
        ),
        $.statementEnd,
      ),
    ),
    macroCallStatement: $ => seq(
      optional($.space),
      $.identifier,
      optional(repeat1(seq(
        $.space,
        choice(
          $.string, // TODO: verify.
          $.coordinateList,
          seq(repeat(choice(token('!'), token('?'))), choice($.binaryConditionString, $.scalarValue)),
          $.arithmeticOperatorString,
        ),
      ))),
      choice(
        seq(
          optional($.space),
          $.comment,
          $.statementEnd,
        ),
        seq(
          alias($.space, $.trailingSpace),
          $.statementEnd,
        ),
        $.statementEnd,
      ),
    ),

    statementEnd: $ => choice(
      $.lineEnd,
      eof(),
    ),
    
    ///////////////////////////////// COMMANDS /////////////////////////////////

    clearCommand: $ => seq(
      token(prec(1, /clear/i)),
      $.space,
      $.property,
      optional(token('.*')),
    ),
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
      $._expression,
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
      $.property, // Verified: the documentation says that strings could be used for name too, but for the consistency we allow only identifiers.
      $.space,
      choice($.string, $.identifier), // Description. Verified: if used inside macros, then all formal parameters might be identifiers. TODO: apply this rule for all commands?
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
      optional(seq($.space, choice($.number, $.identifier))), // ID. Verified: REAPER supports both numbers and [_a-zA-Z0-9].
      optional(seq($.space, $.string)),
      optional(seq($.space, $.string)),
    ),
    layoutCommand: $ => seq(
      choice(token(prec(1, /layout/i)), token(prec(1, /globallayout/i))),
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

    //////////////////////////////// EXPRESSIONS ///////////////////////////////

    _expression: $ => choice(
      $.placeholder,
      $.scalarValue,
      $.arithmeticExpression,
      $.conditionalExpression,
      $.coordinateList,
      seq($.scalarValue, $.atExpression),
      seq($.property, $.accessExpression, $.atExpression),
      seq($.property, $.atExpression), // coordlist@x is shorthand for coordlist{x}@x, as described in the documentation.
    ),

    coordinateList: $ => seq(
      token("["),
      optional($.space),
      $.coordinateListItem,
      ...repeatUpTo(7, seq(optional(
        seq(
          $.space,
          $.coordinateListItem,
        ),
      ))),
      optional($.space),
      token("]"),
    ),
    placeholder: $ => token('.'),
    coordinateListItem: $ => choice(
      $.placeholder,
      $.scalarValue,
    ),
    accessExpression: $ => seq(
      token('{'),
      optional($.space),
      $.accessIndex,
      optional($.space),
      token('}'),
    ),
    atExpression: $ => seq(token('@'), $.accessIndex),
    accessIndex: $ => choice(
      token('x'),
      token('y'),
      token('w'),
      token('h'),
      token('ls'),
      token('ts'),
      token('rs'),
      token('bs'),
      token(/[0-7]/),
    ),

    arithmeticExpression: $ => seq(
      $.arithmeticOperatorString,
      $.space,
      $._expression,
      optional(seq($.space, $._expression)),
    ),
    arithmeticOperatorString: $ => choice(
      seq(
        choice(token('+:'), token('*:')),
        $.scalarValue,
        token(':'),
        $.scalarValue,
      ),
      token('+'),
      token(prec(1, '-')),
      token('*'),
      token('/'),
    ),

    conditionalExpression: $ => choice(
      $.unaryConditional,
      $.binaryConditional,
    ),
    unaryConditional: $ => seq(
      choice(token('?'), token('!')),
      choice(
        $.scalarValue,
        $.unaryConditional,
        $.binaryConditional,
      ),
      choice(
        seq($.space, $._expression, optional(seq($.space, $._expression))),
        seq(optional(seq($.space, $._expression))), // !! case.
      )
    ),
    binaryConditional: $ => seq(
      $.binaryConditionString,
      $.space,
      $._expression,
      optional(seq($.space, $._expression)),
    ),
    binaryConditionString: $ => seq(
      $.scalarValue,
      choice(
        token('&'),
        token('<'),
        token('>'),
        token('<='),
        token('>='),
        token('=='),
        alias(token('='), $.singleEquals),
        token('!='),
      ),
      $.scalarValue,
    ),

    scalarValue: $ => choice(
      $.number,
      $.property,
      $.predefinedScalarProperty,
      seq($.property, $.accessExpression),
      seq($.predefinedScalarProperty, $.accessExpression),
    ),

    // For both user-defined and built-in (tcp.mute) properties
    property: $ => choice(
      alias($.identifier, $.identifier),
      prec.left(seq($.property, token('.'), $.identifier))
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

    ////////////////////////////////////////////////////////////////////////////

    lineEnd: $ => token(/\r?\n/),

    commentWord: $ => token(/\S+/),
    anyWord: $ => anyWordRegex,
    space: $ => token(prec(1, spaceRegex)),

    comment: $ => prec.left(seq(
      token(';'),
      repeat(seq(optional($.space), $.commentWord)),
      optional(alias($.space, $.trailingSpace)),
    )),
    commentWord: $ => anyWordRegex,

    number: $ => seq(optional(token(prec(1, '-'))), token(/\d+(?:\.\d+)?/)),

    hexColor: $ => token(/[0-9a-f]{8}/i), // Verified: only 8-digit colors are supported.

    string: $ => choice(
      $.singleQuoteString,
      $.doubleQuoteString,
      $.backtickQuoteString,
    ),
    singleQuoteString: $ => token(/'[^\r\n']*'/),
    doubleQuoteString: $ => token(/"[^\r\n"]*"/),
    backtickQuoteString: $ => token(/`[^\r\n`]*`/),

    identifier: $ => token(/[a-z_#-](?:[a-z0-9._#-]*[a-z0-9_#-])?/i),
  }
});
