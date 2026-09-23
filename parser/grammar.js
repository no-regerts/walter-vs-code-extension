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
      $._noopStatement,
      $._commandStatement,
      $._themeConfigStatement,
      $._macroCallStatement,
    ),
    _noopStatement: $ => choice(
      seq(
        alias($._space, $.trailingSpace),
        choice($._lineEnd, eof()),
      ),
      
      seq(
        optional($._space),
        $.comment,
        choice($._lineEnd, eof()),
      ),
      
      // _noopStatement has this special treatment because of the possible empty
      // line case, which can't be handled properly with repeat(eof()). So this
      // line can't be choice($._lineEnd, eof()).
      $._lineEnd,
    ),
    _commandStatement: $ => seq(
      optional($._space),
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
          optional($._space),
          $.comment,
          choice(
            $._lineEnd,
            eof(),
          ),
        ),
        seq(
          alias($._space, $.trailingSpace),
          choice(
            $._lineEnd,
            eof(),
          ),
        ),
        choice(
          $._lineEnd,
          eof(),
        ),
      ),
    ),
    _themeConfigStatement: $ => seq(
      optional($._space),
      choice(
        seq(token(prec(1, /version/i)), $._space, $._number),
        seq(token(prec(1, /use_pngs/i)), $._space, choice('0', '1')),
        seq(token(prec(1, /use_overlays/i)), $._space, choice('0', '1')),
        seq(token(prec(1, /tinttcp/i)), $._space, $._number),
        seq(token(prec(1, /peaksedges/i)), $._space, $._number),
        seq(token(prec(1, /tcp_folderindent/i)), $._space, $._number),
        seq(token(prec(1, /tcp_heights/i)), $._space, $._number, $._space, $._number, $._space, $._number, $._space, $._number),
        seq(token(prec(1, /tcp_master_minheight/i)), $._space, $._number),
        seq(token(prec(1, /tcp_voltext_flags/i)), $._space, $._number, optional(seq($._space, $._number))), // Verified: the last value is optional.
        seq(token(prec(1, /tcp_master_voltext_flags/i)), $._space, $._number, optional(seq($._space, $._number))), // Verified: the last value is optional.
        seq(token(prec(1, /mcp_voltext_flags/i)), $._space, $._number, optional(seq($._space, $._number))), // Verified: the last value is optional.
        seq(token(prec(1, /mcp_master_voltext_flags/i)), $._space, $._number, optional(seq($._space, $._number))), // Verified: the last value is optional.
        seq(token(prec(1, /tcp_vupeakwidth/i)), $._space, $._number),
        seq(token(prec(1, /mcp_vupeakheight/i)), $._space, $._number),
        seq(token(prec(1, /mcp_mastervupeakheight/i)), $._space, $._number),
        seq(token(prec(1, /tcp_showborders/i)), $._space, choice('0', '1')),
        seq(token(prec(1, /mcp_showborders/i)), $._space, choice('0', '1')),
        seq(token(prec(1, /trans_showborders/i)), $._space, choice('0', '1')),
        seq(token(prec(1, /mcp_altmeterpos/i)), $._space, choice('0', '1')),
        seq(token(prec(1, /tcp_vol_zeroline/i)), $._space, $.hexColor),
        seq(token(prec(1, /tcp_pan_zeroline/i)), $._space, $.hexColor),
        seq(token(prec(1, /tcp_width_zeroline/i)), $._space, $.hexColor),
        seq(token(prec(1, /mcp_vol_zeroline/i)), $._space, $.hexColor),
        seq(token(prec(1, /mcp_pan_zeroline/i)), $._space, $.hexColor),
        seq(token(prec(1, /mcp_width_zeroline/i)), $._space, $.hexColor),
        seq(token(prec(1, /trans_speed_zeroline/i)), $._space, $.hexColor),
        seq(token(prec(1, /item_volknobfg/i)), $._space, $.hexColor, $._space, $.hexColor, $._space, $.hexColor),
        seq(token(prec(1, /envcp_min_height/i)), $._space, $._number),
        seq(token(prec(1, /mcp_min_height/i)), $._space, $._number),
        seq(token(prec(1, /no_meter_reclbl/i)), $._space, choice('0', '1')),
        seq(token(prec(1, /gen_pan_zeroline/i)), $._space, $.hexColor),
        seq(token(prec(1, /gen_vol_zeroline/i)), $._space, $.hexColor),
        seq(token(prec(1, /warnings/i)), $._space, choice(token(/all/i), token(/pedantic/i))),
        seq(token(prec(1, /adjuster_script/i)), $._space, $._string),
        seq(token(prec(1, /misc_dpi_translate/i)), $._space, $._number, $._space, $._number),
        seq(token(prec(1, /global_scale/i)), $._space, $._number),
        seq(token(prec(2, /layout_dpi_translate/i)), $._space, $._string, $._space, $._number, $._space, $._string), // Lexical precidence should be higher than the layout command have.
        seq(token(prec(2, /want_os_type/i)), $._space, choice('0', '1')), // TODO: no idea why this particular property is bugging out. For now, its priority should be higher than the priority of _macroCallStatement.
      ),
      choice(
        seq(
          optional($._space),
          $.comment,
          choice(
            $._lineEnd,
            eof(),
          ),
        ),
        seq(
          alias($._space, $.trailingSpace),
          choice(
            $._lineEnd,
            eof(),
          ),
        ),
        choice(
          $._lineEnd,
          eof(),
        ),
      ),
    ),
    _macroCallStatement: $ => seq(
      optional($._space),
      $.identifier,
      optional(repeat1(seq(
        $._space,
        choice(
          $._string, // TODO: verify.
          $.coordinateList,
          seq(repeat(choice(token('!'), token('?'))), choice($._binaryConditionString, $.scalarValue)),
          $.arithmeticOperatorString,
        ),
      ))),
      choice(
        seq(
          optional($._space),
          $.comment,
          choice(
            $._lineEnd,
            eof(),
          ),
        ),
        seq(
          alias($._space, $.trailingSpace),
          choice(
            $._lineEnd,
            eof(),
          ),
        ),
        choice(
          $._lineEnd,
          eof(),
        ),
      ),
    ),
    
    ///////////////////////////////// COMMANDS /////////////////////////////////

    clearCommand: $ => seq(
      token(prec(1, /clear/i)),
      $._space,
      $.property,
      optional(token('.*')),
    ),
    resetCommand: $ => seq(
      token(prec(1, /reset/i)),
      $._space,
      $.property,
      optional(token('.*')),
    ),
    setCommand: $ => seq(
      token(prec(1, /set/i)),
      $._space,
      $.property,
      $._space,
      $._expression,
    ),
    defCommand: $ => seq(
      token(prec(1, /def/i)),
      $._space,
      $.identifier,
      repeat1(seq($._space, $.anyWord)),
    ),
    frontCommand: $ => seq(
      token(prec(1, /front/i)),
      repeat1(seq($._space, $.property)),
    ),
    macroCommand: $ => seq(
      token(prec(1, /macro/i)),
      $._space,
      $.identifier,
      repeat(seq($._space, $.identifier)),
      choice(
        seq(optional($._space), $.comment, $._lineEnd),
        seq(alias($._space, $.trailingSpace), $._lineEnd),
        $._lineEnd,
      ),
      optional(repeat($._statement)),
      optional(seq(
        optional($._space),
        token(prec(1, /endmacro/i)),
      )),
    ),
    defineParameterCommand: $ => seq(
      token(prec(1, /define_parameter/i)),
      $._space,
      $.property, // Verified: the documentation says that strings could be used for name too, but for the consistency we allow only identifiers.
      $._space,
      choice($._string, $.identifier), // Description. Verified: if used inside macros, then all formal parameters might be identifiers. TODO: apply this rule for all commands?
      $._space,
      choice($._number, $.identifier), // Default value.
      optional(seq(
        $._space, choice($._number, $.identifier), // Minimum value.
        $._space, choice($._number, $.identifier), // Maximum value.
      )),
    ),
    customCommand: $ => seq(
      token(prec(1, /custom/i)),
      $._space,
      $.property,
      optional(seq($._space, $._string)),
      optional(seq($._space, choice($._number, $.identifier))), // ID. Verified: REAPER supports both numbers and [_a-zA-Z0-9].
      optional(seq($._space, $._string)),
      optional(seq($._space, $._string)),
    ),
    layoutCommand: $ => seq(
      choice(token(prec(1, /layout/i)), token(prec(1, /globallayout/i))),
      $._space,
      $._string,
      optional(seq($._space, $._string)),
      choice(
        seq(
          optional($._space),
          $.comment,
          $._lineEnd,
        ),
        seq(
          alias($._space, $.trailingSpace),
          $._lineEnd,
        ),
        $._lineEnd,
      ),
      optional(repeat($._statement)),
      optional(seq(
        optional($._space),
        token(prec(1, /endlayout/i)),
      )),
    ),

    //////////////////////////////// EXPRESSIONS ///////////////////////////////

    _expression: $ => choice(
      $.placeholder,
      $.scalarValue,
      $.arithmeticExpression,
      $._conditionalExpression,
      $.coordinateList,
      seq($.scalarValue, $._atExpression),
      seq($.property, $._accessExpression, $._atExpression),
      seq($.property, $._atExpression), // coordlist@x is shorthand for coordlist{x}@x, as described in the documentation.
    ),

    coordinateList: $ => seq(
      token("["),
      optional($._space),
      $._coordinateListItem,
      ...repeatUpTo(7, seq(optional(
        seq(
          $._space,
          $._coordinateListItem,
        ),
      ))),
      optional($._space),
      token("]"),
    ),
    placeholder: $ => token('.'),
    _coordinateListItem: $ => choice(
      $.placeholder,
      $.scalarValue,
    ),
    _accessExpression: $ => seq(
      token('{'),
      optional($._space),
      $._accessIndex,
      optional($._space),
      token('}'),
    ),
    _atExpression: $ => seq(token('@'), $._accessIndex),
    _accessIndex: $ => choice(
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
      $._space,
      $._expression,
      optional(seq($._space, $._expression)),
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

    _conditionalExpression: $ => choice(
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
        seq($._space, $._expression, optional(seq($._space, $._expression))),
        seq(optional(seq($._space, $._expression))), // !! case.
      )
    ),
    binaryConditional: $ => seq(
      $._binaryConditionString,
      $._space,
      $._expression,
      optional(seq($._space, $._expression)),
    ),
    _binaryConditionString: $ => seq(
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
      $._number,
      $.property,
      $.predefinedScalarProperty,
      seq($.property, $._accessExpression),
      seq($.predefinedScalarProperty, $._accessExpression),
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

    _lineEnd: $ => token(/\r?\n/),

    anyWord: $ => anyWordRegex,
    _space: $ => token(prec(1, spaceRegex)),

    comment: $ => prec.left(seq(
      token(';'),
      repeat(seq(optional($._space), $.anyWord)),
      optional(alias($._space, $.trailingSpace)),
    )),

    _number: $ => seq(optional(token(prec(1, '-'))), token(/\d+(?:\.\d+)?/)),

    hexColor: $ => token(/[0-9a-f]{8}/i), // Verified: only 8-digit colors are supported.

    _string: $ => choice(
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
