# Contributing to ConsoleCapture

Thank you for your interest in contributing to ConsoleCapture! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read and follow our Code of Conduct.

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/console-capture.git
   cd console-capture
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   ```bash
   cp packages/backend/.env.example packages/backend/.env
   ```
5. Start infrastructure services:
   ```bash
   docker-compose up -d postgres redis elasticsearch minio
   ```
6. Run database migrations:
   ```bash
   npm run db:migrate --workspace=@console-capture/backend
   ```
7. Start development servers:
   ```bash
   npm run dev
   ```

## Development Process

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical production fixes

### Workflow

1. Create a feature branch from `develop`:
   ```bash
   git checkout -b feature/your-feature-name develop
   ```

2. Make your changes following our coding standards

3. Write tests for your changes

4. Ensure all tests pass:
   ```bash
   npm run test
   npm run test:coverage
   ```

5. Commit your changes with a descriptive message:
   ```bash
   git commit -m "feat: add new feature X"
   ```

6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

7. Create a Pull Request to the `develop` branch

## Coding Standards

### TypeScript

We use TypeScript with strict mode enabled. Follow these guidelines:

- Use explicit types, avoid `any`
- Prefer interfaces over types for object shapes
- Use enums for fixed sets of values
- Document complex functions with JSDoc comments

**Example:**

```typescript
/**
 * Create a new recording
 * @param userId - User ID creating the recording
 * @param data - Recording creation data
 * @returns Created recording object
 * @throws {ValidationError} If data is invalid
 * @throws {QuotaExceededError} If user quota is exceeded
 */
async function createRecording(
  userId: string,
  data: CreateRecordingDto
): Promise<Recording> {
  // Implementation
}
```

### Naming Conventions

- **Files**: kebab-case (`user-service.ts`)
- **Classes**: PascalCase (`UserService`)
- **Functions**: camelCase (`createUser`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Interfaces**: PascalCase with descriptive names (`User`, `CreateUserDto`)
- **Enums**: PascalCase (`UserRole`)

### Code Organization

```
src/
├── api/           # API routes and controllers
├── services/      # Business logic
├── models/        # Data models and types
├── middleware/    # Express middleware
├── utils/         # Utility functions
├── config/        # Configuration
└── db/           # Database migrations and seeds
```

### Imports

Use absolute imports for cross-package imports:

```typescript
// Good
import { User } from '@console-capture/shared';

// Avoid
import { User } from '../../../shared/src/types';
```

## Testing Guidelines

### Test Coverage

Maintain a minimum of 80% code coverage:

- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

### Unit Tests

Write unit tests for:
- All business logic functions
- Utility functions
- Complex calculations
- Edge cases

**Example:**

```typescript
describe('RecordingService', () => {
  describe('createRecording', () => {
    it('should create a recording successfully', async () => {
      const mockData = createMockRecording();
      const result = await recordingService.create(mockData);

      expect(result).toMatchObject(mockData);
      expect(result.id).toBeDefined();
    });

    it('should throw QuotaExceededError when quota is reached', async () => {
      const mockUser = createMockUser({ recordingCount: 25 });

      await expect(
        recordingService.create(mockData)
      ).rejects.toThrow(QuotaExceededError);
    });
  });
});
```

### Integration Tests

Write integration tests for:
- API endpoints
- Database operations
- External service integrations

### E2E Tests

Write E2E tests for:
- Critical user flows
- Payment processing
- Authentication flows

## Submitting Changes

### Commit Messages

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(backend): add recording export functionality

Implement export endpoint that supports multiple formats (GIF, MP4, WebM).
Add background job processing for large exports.

Closes #123
```

```
fix(extension): resolve memory leak in background service worker

The background service worker was not properly cleaning up event listeners,
causing memory to accumulate over time.

Fixes #456
```

### Pull Request Process

1. Ensure your PR targets the `develop` branch
2. Fill out the PR template completely
3. Link related issues
4. Add screenshots for UI changes
5. Ensure all CI checks pass
6. Request review from maintainers

### PR Review Checklist

Before requesting review, ensure:

- [ ] All tests pass
- [ ] Code coverage meets requirements
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Environment variables documented

## Architecture Principles

### SPARC Principles

Follow SPARC (Symbolic Principles for AI-Driven Collaborative Development):

1. **Explicit Workflows**: Document all processes clearly
2. **Contextual Metadata**: Use comprehensive typing
3. **Micro-unit Tasks**: Break down complex features
4. **Code Best Practices**: Follow TypeScript strict mode
5. **Two-Phase Testing**: Unit + integration tests

### SAPPO Ontology

Apply SAPPO (Software Architecture Problem Prediction Ontology):

- **Components**: Clear package boundaries
- **Connectors**: Well-defined APIs
- **Constraints**: Feature flags, rate limiting
- **Problem Prediction**: Tag metadata for issues

## Performance Guidelines

- Avoid N+1 queries
- Use database indexes appropriately
- Implement caching for expensive operations
- Use pagination for list endpoints
- Optimize database queries with EXPLAIN ANALYZE
- Monitor API response times

## Security Guidelines

- Never commit secrets or credentials
- Use parameterized queries to prevent SQL injection
- Validate and sanitize all user inputs
- Implement rate limiting
- Use HTTPS in production
- Follow OWASP security best practices
- Implement proper authentication and authorization

## Documentation

Update documentation when:

- Adding new features
- Changing API endpoints
- Modifying configuration
- Adding environment variables
- Changing database schema

## Release Process

### Version Numbering

We follow Semantic Versioning (SemVer):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes (backward-compatible)

### Release Checklist

- [ ] Update CHANGELOG.md
- [ ] Update version in package.json
- [ ] Run full test suite
- [ ] Build all packages
- [ ] Create release notes
- [ ] Tag release in Git
- [ ] Deploy to staging
- [ ] QA testing
- [ ] Deploy to production
- [ ] Announce release

## Getting Help

- Documentation: https://docs.console-capture.com
- Discord: https://discord.gg/console-capture
- Email: dev@console-capture.com
- GitHub Discussions: https://github.com/console-capture/discussions

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project website

Thank you for contributing to ConsoleCapture!
