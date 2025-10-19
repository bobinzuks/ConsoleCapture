# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in ConsoleCapture, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security issues via:

- **Email**: security@console-capture.com
- **GitHub Security Advisories**: Use the "Security" tab in this repository

### What to Include

When reporting a vulnerability, please include:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** of the vulnerability
4. **Suggested fix** (if you have one)
5. **Your contact information** for follow-up

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Status Updates**: Every 7 days until resolved
- **Fix Timeline**: Depends on severity (critical: 7 days, high: 14 days, medium: 30 days)

### Disclosure Policy

- We request that you do not publicly disclose the vulnerability until we have had a chance to address it
- We will coordinate with you on the disclosure timeline
- We will credit you in our security advisory (unless you prefer to remain anonymous)

## Security Best Practices

### For Users

1. **Keep Dependencies Updated**: Regularly update to the latest version
2. **Secure Environment Variables**: Never commit `.env` files or secrets to version control
3. **Enable 2FA**: Use two-factor authentication for your GitHub account
4. **Review Permissions**: Regularly audit API keys and access tokens
5. **Monitor Logs**: Check for suspicious activity in application logs

### For Contributors

1. **No Secrets in Code**: Never hardcode API keys, passwords, or tokens
2. **Dependency Scanning**: Run `npm audit` before committing
3. **Code Review**: All PRs require security-conscious review
4. **Input Validation**: Always validate and sanitize user input
5. **Use Parameterized Queries**: Prevent SQL injection with prepared statements

## Known Security Features

ConsoleCapture implements several security measures:

- **Authentication**: JWT-based with bcrypt password hashing
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Tier-based API rate limiting via Redis
- **Input Validation**: Zod schema validation on all endpoints
- **SQL Injection Prevention**: Parameterized queries via Knex.js
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: CSRF tokens on state-changing operations
- **Encryption**: TLS/SSL for all production traffic
- **Session Management**: Secure HTTP-only cookies
- **Audit Logging**: Comprehensive audit trail in TimescaleDB

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2) and announced via:

- GitHub Security Advisories
- Release notes
- Email to registered users (for critical vulnerabilities)

## Compliance

ConsoleCapture is designed with the following compliance considerations:

- **GDPR**: Data privacy and right to deletion
- **SOC 2**: Security controls and audit logging
- **HIPAA**: Encryption at rest and in transit (when configured)

For enterprise compliance requirements, please contact: enterprise@console-capture.com

---

Thank you for helping keep ConsoleCapture secure!
