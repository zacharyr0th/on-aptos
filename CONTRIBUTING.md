# Contributing to On Aptos

First off, thank you for considering contributing to On Aptos! It's people like you that make On Aptos such a great tool. We welcome contributions from the community and are grateful for even the smallest of fixes!

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [I Have a Question](#i-have-a-question)
- [I Want to Contribute](#i-want-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Requests](#pull-requests)
- [Style Guides](#style-guides)
  - [Git Commit Messages](#git-commit-messages)
  - [TypeScript Style Guide](#typescript-style-guide)
  - [Documentation Style Guide](#documentation-style-guide)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## I Have a Question

> **Note:** Please don't file an issue to ask a question. You'll get faster results by using the resources below.

Before you ask a question, it is best to search for existing [Issues](https://github.com/zacharyr0th/on-aptos/issues) that might help you. In case you have found a suitable issue and still need clarification, you can write your question in this issue.

If you then still feel the need to ask a question and need clarification, we recommend the following:

- Open a [Discussion](https://github.com/zacharyr0th/on-aptos/discussions)
- Provide as much context as you can about what you're running into
- Provide project and platform versions (nodejs, npm, etc), depending on what seems relevant

## I Want to Contribute

### Reporting Bugs

#### Before Submitting a Bug Report

- Make sure that you are using the latest version
- Determine if your bug is really a bug and not an error on your side
- Check if there is already a bug report existing for your bug in the [bug tracker](https://github.com/zacharyr0th/on-aptos/issues?q=label%3Abug)
- Collect information about the bug:
  - Stack trace
  - OS, Platform and Version
  - Version of the interpreter, compiler, SDK, runtime environment, package manager
  - Possibly your input and the output
  - Can you reliably reproduce the issue?

#### How Do I Submit a Good Bug Report?

We use GitHub issues to track bugs and errors. If you run into an issue with the project:

- Open an [Issue](https://github.com/zacharyr0th/on-aptos/issues/new)
- Use the bug report template
- Explain the behavior you would expect and the actual behavior
- Provide as much context as possible and describe the reproduction steps
- Provide the information you collected in the previous section

### Suggesting Enhancements

#### Before Submitting an Enhancement

- Make sure that you are using the latest version
- Read the documentation carefully and find out if the functionality is already covered
- Perform a [search](https://github.com/zacharyr0th/on-aptos/issues) to see if the enhancement has already been suggested
- Find out whether your idea fits with the scope and aims of the project

#### How Do I Submit a Good Enhancement Suggestion?

Enhancement suggestions are tracked as [GitHub issues](https://github.com/zacharyr0th/on-aptos/issues).

- Use a clear and descriptive title for the issue
- Provide a step-by-step description of the suggested enhancement
- Provide specific examples to demonstrate the steps
- Describe the current behavior and explain which behavior you expected to see instead
- Explain why this enhancement would be useful

### Your First Code Contribution

Unsure where to begin contributing? You can start by looking through these `beginner` and `help-wanted` issues:

- [Beginner issues](https://github.com/zacharyr0th/on-aptos/labels/beginner) - issues which should only require a few lines of code
- [Help wanted issues](https://github.com/zacharyr0th/on-aptos/labels/help%20wanted) - issues which should be a bit more involved

### Pull Requests

The process described here has several goals:

- Maintain On Aptos's quality
- Fix problems that are important to users
- Engage the community in working toward the best possible On Aptos
- Enable a sustainable system for On Aptos's maintainers to review contributions

Please follow these steps to have your contribution considered by the maintainers:

1. Fork the repository and create your branch from `main`
2. Clone your fork: `git clone https://github.com/zacharyr0th/on-aptos.git`
3. Install dependencies: `pnpm install`
4. Create a new branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Add tests for your changes
7. Run the test suite: `pnpm test`
8. Run linting: `pnpm lint`
9. If you've changed APIs, update the documentation
10. Commit your changes using a descriptive commit message that follows our [commit message conventions](#git-commit-messages)
11. Push to your fork: `git push origin feature/your-feature-name`
12. Open a Pull Request

## Style Guides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- When only changing documentation, include `[ci skip]` in the commit title
- Consider starting the commit message with an applicable emoji:
  - 🎨 `:art:` when improving the format/structure of the code
  - 🐎 `:racehorse:` when improving performance
  - 🚱 `:non-potable_water:` when plugging memory leaks
  - 📝 `:memo:` when writing docs
  - 🐛 `:bug:` when fixing a bug
  - 🔥 `:fire:` when removing code or files
  - 💚 `:green_heart:` when fixing the CI build
  - ✅ `:white_check_mark:` when adding tests
  - 🔒 `:lock:` when dealing with security
  - ⬆️ `:arrow_up:` when upgrading dependencies
  - ⬇️ `:arrow_down:` when downgrading dependencies

### TypeScript Style Guide

- Use TypeScript for all new code
- Prefer interfaces over type aliases for object shapes
- Use explicit return types for functions
- Avoid `any` type; use `unknown` if type is truly unknown
- Use meaningful variable names
- Keep functions small and focused
- Add JSDoc comments for public APIs
- Follow the existing code style in the project

### Documentation Style Guide

- Use [Markdown](https://guides.github.com/features/mastering-markdown/)
- Reference functions, classes, and modules using backticks
- Include code examples when applicable
- Keep explanations clear and concise

## Development Setup

1. **Prerequisites**
   - Node.js 20+
   - pnpm 8+
   - Git

2. **Setup**
   ```bash
   # Clone your fork
   git clone https://github.com/zacharyr0th/on-aptos.git
   cd on-aptos

   # Install dependencies
   pnpm install

   # Copy environment variables
   cp .env.example .env.local
   # Edit .env.local with your API keys

   # Run development server
   pnpm dev
   ```

3. **Available Scripts**
   - `pnpm dev` - Start development server
   - `pnpm build` - Build for production
   - `pnpm start` - Start production server
   - `pnpm test` - Run tests
   - `pnpm test:watch` - Run tests in watch mode
   - `pnpm lint` - Run ESLint
   - `pnpm type-check` - Run TypeScript type checking

## Project Structure

```
on-aptos/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── pages/          # Page-specific components
│   └── layout/         # Layout components
├── lib/                # Utility functions and configurations
│   ├── config/         # Configuration files
│   ├── trpc/          # tRPC setup and routers
│   └── utils/         # Utility functions
├── public/            # Static assets
│   └── locales/       # i18n translation files
├── tests/             # Test files
└── types/             # TypeScript type definitions
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.