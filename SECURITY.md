# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| latest  | ✅                |
| < latest| ❌                |

## Reporting a Vulnerability

We take the security of On Aptos seriously. If you have discovered a security vulnerability in our project, please report it to us as described below.

### Reporting Process

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to zacharyroth@pm.me.

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Communication**: We will keep you informed about the progress of addressing the vulnerability
- **Fix Timeline**: We aim to resolve critical vulnerabilities within 7 days and other vulnerabilities within 30 days
- **Disclosure**: We will coordinate with you on the disclosure of the vulnerability
- **Recognition**: We will credit you for the discovery in our release notes (unless you prefer to remain anonymous)

## Security Update Process

When we receive a security bug report, we will:

1. Confirm the problem and determine the affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all supported versions
4. Release new security fix versions
5. Announce the vulnerability (coordinated with the reporter)

## Security Best Practices for Contributors

When contributing to On Aptos, please follow these security best practices:

### API Keys and Secrets
- Never commit API keys, passwords, or secrets to the repository
- Use environment variables for sensitive configuration
- Add sensitive files to `.gitignore`
- Use `.env.example` to document required environment variables without exposing values

### Dependencies
- Keep dependencies up to date
- Run `pnpm audit` regularly to check for vulnerabilities
- Review dependency licenses before adding new packages
- Prefer well-maintained packages with good security track records

### Code Practices
- Validate and sanitize all user inputs
- Use parameterized queries for database operations
- Implement proper authentication and authorization
- Follow the principle of least privilege
- Use HTTPS for all external communications
- Implement rate limiting for API endpoints
- Log security events appropriately (without logging sensitive data)

### Content Security
- Implement and maintain strict Content Security Policy (CSP) headers
- Sanitize any user-generated content before rendering
- Use secure cookie settings (HttpOnly, Secure, SameSite)
- Implement CSRF protection where applicable

## Security Features

On Aptos implements several security features:

- **Environment Variable Validation**: All required environment variables are validated on startup
- **CSP Headers**: Strict Content Security Policy headers with nonce-based script execution
- **Health Check Endpoint**: Monitoring endpoint that doesn't expose sensitive information
- **Secure Headers**: X-Frame-Options, X-Content-Type-Options, and other security headers
- **HTTPS Enforcement**: Strict-Transport-Security header in production
- **Input Validation**: All API inputs are validated using Zod schemas
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse

## Vulnerability Disclosure Policy

We follow a coordinated disclosure process:

1. Security vulnerabilities should be reported privately
2. We will work with reporters to understand and validate the issue
3. We will prepare and test fixes
4. We will release fixes for all supported versions
5. We will publicly disclose the vulnerability with credit to the reporter

The goal is to limit the time window where vulnerabilities are known but unpatched.

## Contact

For any security-related questions or concerns, please contact:
- Email: zacharyroth@pm.me
- PGP Key: [Link to PGP key if available]

## Acknowledgments

We would like to thank the following individuals for responsibly disclosing vulnerabilities:

- [Your name here] - [Brief description of vulnerability]

---

**Note**: This security policy is adapted from best practices recommended by GitHub and the open source community.