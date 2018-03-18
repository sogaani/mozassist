module.exports = {
  plugins: [
    'html'
  ],
  'env': {
    'commonjs': true,
    'es6': true,
    'node': true,
    'browser': true,
  },
  'extends': 'eslint:recommended',
  'parser': 'babel-eslint',
  'parserOptions': {
    'sourceType': 'module'
  },
  'rules': {
    'no-console': 0,
    'max-len': [2, 100],
    'indent': [2, 2],
    'brace-style': [2, '1tbs', { 'allowSingleLine': false }],
    'consistent-this': [2, 'DO NOT USE'],
    'no-unused-vars': ['warn', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    'no-lonely-if': 2,
    'no-multiple-empty-lines': [2, { 'max': 1 }],
    'quotes': [2, 'single', {
      'allowTemplateLiterals': true,
    }],
    'quote-props': [2, 'consistent'],
    'no-multi-spaces': [2, {
      'exceptions': {
        'Property': true,
        'ImportDeclaration': true,
        'VariableDeclarator': true,
        'AssignmentExpression': true
      }
    }],
    'key-spacing': [2, {
      'align': 'colon',
      'beforeColon': false,
      'afterColon': true
    }],
    'space-before-function-paren': [2, {
      asyncArrow: 'always',
      anonymous: 'never',
      named: 'never',
    }],
    'block-spacing': [2, 'never'],
    'semi': [2, 'always'],
    'prefer-const': 2,
    'space-before-blocks': 2,
    'no-throw-literal': 2,
    'object-curly-spacing': 2,
    'array-bracket-spacing': [2, 'never'],
    'computed-property-spacing': 2,
    'linebreak-style': 2,
    'new-cap': 2,
    'no-tabs': 2,
    'no-trailing-spaces': 2,
    'padded-blocks': [2, 'never'],
    'spaced-comment': [2, 'always'],
    'comma-style': 2,
    'comma-spacing': 2,
    'comma-dangle': [2, 'always-multiline'],
    'eol-last': 2,
    'keyword-spacing': 2,
  }
};
