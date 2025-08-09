module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Basic rules
    'type-enum': [
      2,
      'always',
      [
        'feat',     // new feature
        'fix',      // bug fix
        'docs',     // documentation only changes
        'style',    // changes that do not affect the meaning of the code
        'refactor', // code change that neither fixes a bug nor adds a feature
        'perf',     // code change that improves performance
        'test',     // adding missing tests or correcting existing tests
        'build',    // changes that affect the build system or external dependencies
        'ci',       // changes to CI configuration files and scripts
        'chore',    // other changes that don't modify src or test files
        'revert',   // reverts a previous commit
        'security', // security fixes or improvements
        'deps',     // dependency updates
        'config',   // configuration changes
        'ui',       // user interface changes
        'a11y',     // accessibility improvements
        'i18n',     // internationalization changes
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-max-length': [2, 'always', 72],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100],
    
    // Custom rules for security
    'subject-exclamation-mark': [2, 'never'],
    
    // Ensure breaking changes are properly formatted
    'footer-empty': [0], // Allow empty footer
    'body-empty': [0],   // Allow empty body for simple commits
  },
  
  // Custom parser options
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w*)(?:\((.+)\))?!?: (.+)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
      referenceActions: [
        'close',
        'closes',
        'closed',
        'fix',
        'fixes',
        'fixed',
        'resolve',
        'resolves',
        'resolved',
      ],
      issuePrefixes: ['#'],
      noteKeywords: ['BREAKING CHANGE', 'BREAKING-CHANGE'],
      fieldPattern: /^-(.*?)-$/,
      revertPattern: /^Revert\s"([\s\S]*)"\s*This reverts commit (\w*)\./,
      revertCorrespondence: ['header', 'hash'],
      warn() {
        // Custom warning function can be added here
      },
      mergePattern: null,
      mergeCorrespondence: null,
    },
  },
  
  // Help message for developers
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
  
  // Custom prompt options for interactive commits
  prompt: {
    questions: {
      type: {
        description: "Select the type of change that you're committing:",
        enum: {
          feat: {
            description: 'A new feature',
            title: 'Features',
            emoji: '✨',
          },
          fix: {
            description: 'A bug fix',
            title: 'Bug Fixes',
            emoji: '🐛',
          },
          docs: {
            description: 'Documentation only changes',
            title: 'Documentation',
            emoji: '📚',
          },
          style: {
            description:
              'Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)',
            title: 'Styles',
            emoji: '💎',
          },
          refactor: {
            description:
              'A code change that neither fixes a bug nor adds a feature',
            title: 'Code Refactoring',
            emoji: '📦',
          },
          perf: {
            description: 'A code change that improves performance',
            title: 'Performance Improvements',
            emoji: '🚀',
          },
          test: {
            description: 'Adding missing tests or correcting existing tests',
            title: 'Tests',
            emoji: '🚨',
          },
          build: {
            description:
              'Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)',
            title: 'Builds',
            emoji: '🛠',
          },
          ci: {
            description:
              'Changes to our CI configuration files and scripts (example scopes: Circle, BrowserStack, SauceLabs)',
            title: 'Continuous Integrations',
            emoji: '⚙️',
          },
          chore: {
            description: "Other changes that don't modify src or test files",
            title: 'Chores',
            emoji: '♻️',
          },
          revert: {
            description: 'Reverts a previous commit',
            title: 'Reverts',
            emoji: '🗑',
          },
          security: {
            description: 'Security fixes or improvements',
            title: 'Security',
            emoji: '🔒',
          },
          deps: {
            description: 'Dependency updates',
            title: 'Dependencies',
            emoji: '📦',
          },
          config: {
            description: 'Configuration changes',
            title: 'Configuration',
            emoji: '🔧',
          },
          ui: {
            description: 'User interface changes',
            title: 'UI/UX',
            emoji: '🎨',
          },
          a11y: {
            description: 'Accessibility improvements',
            title: 'Accessibility',
            emoji: '♿',
          },
          i18n: {
            description: 'Internationalization changes',
            title: 'Internationalization',
            emoji: '🌐',
          },
        },
      },
      scope: {
        description:
          'What is the scope of this change (e.g. component or file name)',
      },
      subject: {
        description:
          'Write a short, imperative tense description of the change',
      },
      body: {
        description: 'Provide a longer description of the change',
      },
      isBreaking: {
        description: 'Are there any breaking changes?',
      },
      breakingBody: {
        description:
          'A BREAKING CHANGE commit requires a body. Please enter a longer description of the commit itself',
      },
      breaking: {
        description: 'Describe the breaking changes',
      },
      isIssueAffected: {
        description: 'Does this change affect any open issues?',
      },
      issuesBody: {
        description:
          'If issues are closed, the commit requires a body. Please enter a longer description of the commit itself',
      },
      issues: {
        description: 'Add issue references (e.g. "fix #123", "re #123".)',
      },
    },
  },
};