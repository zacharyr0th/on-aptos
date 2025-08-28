# Contributing to On Aptos

Thank you for your interest in contributing to On Aptos! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/on-aptos.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature-name`
5. Set up environment: `cp .env.example .env.local`
6. Start development server: `pnpm dev`

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing code style and patterns
- Use the project's ESLint and Prettier configurations
- Write meaningful commit messages

### Environment Variables

- Never commit secrets or API keys
- Use environment variables for all configuration
- Update `.env.example` when adding new variables
- Use the provided Panora API key for development (it's public)

### API Keys You'll Need

For full functionality, you'll need:
- `APTOS_BUILD_SECRET` - Get from [developers.aptoslabs.com](https://developers.aptoslabs.com)
- `CMC_API_KEY` - Get from [CoinMarketCap API](https://coinmarketcap.com/api/)
- `RWA_API_KEY` - Get from RWA.xyz (optional)

### Testing

- Write tests for new features
- Run tests before submitting: `pnpm test`
- Ensure all checks pass: `pnpm lint`

### Documentation

- Update documentation for new features
- Include JSDoc comments for functions
- Update README.md if needed

## Submitting Changes

1. Ensure your code follows the guidelines above
2. Test your changes thoroughly
3. Update documentation if necessary
4. Submit a pull request with:
   - Clear description of changes
   - Reference to any related issues
   - Screenshots if UI changes are involved

## Pull Request Process

1. Ensure CI/CD checks pass
2. Request review from maintainers
3. Address any feedback
4. Merge after approval

## Security

- Report security vulnerabilities privately
- See [SECURITY.md](SECURITY.md) for details
- Never commit sensitive information

## Community

- Be respectful and inclusive
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md)
- Help others learn and contribute

## Questions?

- Open a [GitHub Issue](https://github.com/yourusername/on-aptos/issues) for bugs or feature requests
- Check existing issues before creating new ones
- Use discussions for general questions

Thank you for contributing! 🚀