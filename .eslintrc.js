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
    'max-len': ['error', 100],
    'indent': ['error', 2],

    'brace-style': ['error', '1tbs', { 'allowSingleLine': false }],
    'consistent-this': ['error', 'DO NOT USE'],

    'no-unused-vars': ['warn', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    'no-lonely-if': 'error',
    'no-multiple-empty-lines': ['error', { 'max': 1 }],
    'quotes': ['error', 'single', {
      'allowTemplateLiterals': true,
    }],
    'no-multi-spaces': ['error', {
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
    }]
  }
};
