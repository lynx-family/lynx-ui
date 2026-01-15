module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0, 'never', [
      'sentence-case',
      'start-case',
      'pascal-case',
      'upper-case',
    ]],
    'body-max-line-length': [0, 'always', 600],
  },
}
