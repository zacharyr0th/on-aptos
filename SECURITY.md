# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please send an email to [security@your-domain.com](mailto:security@your-domain.com). All security vulnerabilities will be promptly addressed.

**Please do not report security vulnerabilities through public GitHub issues.**

## Security Measures

This project implements the following security measures:

### Environment Variables
- No secrets are hardcoded in the codebase
- Environment variables are validated on startup
- Client-side exposure of secrets is prevented

### API Security
- Rate limiting implemented on all API endpoints
- CORS headers properly configured
- Security headers (XSS, CSRF protection) enabled
- Request size limits enforced

### Dependencies
- Dependencies are regularly updated
- Security scanning in CI/CD pipeline
- No known vulnerable dependencies

### Data Handling
- No PII is collected or stored
- Only public blockchain data is accessed
- All external API calls use proper authentication

## Development Security Guidelines

When contributing to this project:

1. **Never commit secrets** - Use environment variables
2. **Use proper logging** - Use the logger, not console statements
3. **Validate inputs** - All user inputs should be validated
4. **Keep dependencies updated** - Regularly run `pnpm audit`
5. **Follow secure coding practices** - Review the codebase for patterns

## Security Checklist for Open Source

- [x] No hardcoded secrets or API keys
- [x] Environment variables properly validated
- [x] Debug code removed from production
- [x] Security headers implemented
- [x] Rate limiting enabled
- [x] CORS properly configured
- [x] MIT License applied
- [x] Dependencies audit clean

## Contact

For security-related questions or concerns, please contact:
- Email: security@your-domain.com
- GitHub Security Advisories: [Create Advisory](https://github.com/yourusername/on-aptos/security/advisories/new)