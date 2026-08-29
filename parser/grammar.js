module.exports = grammar({
  name: 'WALTER',

  extras: $ => [
    /[\s\n\r\t]/,
  ],

  rules: {
    source_file: $ => repeat($.expression),

    expression: $ => choice(
      $.identifier,
      $.number,
      $.assignment
    ),

    assignment: $ => seq(
      $.identifier,
      '=',
      $.expression
    ),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    number: $ => /\d+/,
  }
});
