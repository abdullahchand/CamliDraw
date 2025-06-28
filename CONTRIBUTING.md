# Contributing to CamliDraw

Thank you for your interest in contributing to CamliDraw! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

- Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- Include detailed steps to reproduce the issue
- Provide information about your environment (OS, browser, camera, lighting)
- Include screenshots or videos if applicable

### Suggesting Enhancements

- Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- Describe the problem you're trying to solve
- Explain how the enhancement would benefit users
- Consider the technical feasibility

### Pull Requests

- Fork the repository
- Create a feature branch
- Make your changes
- Test thoroughly
- Submit a pull request

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Modern web browser
- Webcam for testing
- Good lighting setup

### Installation

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/camlidraw.git
   cd camlidraw
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types for all functions and variables
- Avoid `any` type - use proper typing
- Use interfaces for object shapes

### React

- Use functional components with hooks
- Follow React best practices
- Use proper dependency arrays in useEffect
- Memoize expensive calculations with useMemo/useCallback

### Code Style

- Use Prettier for formatting
- Follow ESLint rules
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### File Organization

- Place components in `src/components/`
- Place types in `src/types/`
- Place utilities in `src/utils/`
- Use descriptive file names

## Testing Guidelines

### Manual Testing

- Test all gestures in different lighting conditions
- Test with different hand positions and movements
- Test performance with long drawing sessions
- Test on different browsers and devices

### Code Testing

- Write unit tests for utility functions
- Test component behavior with different props
- Test error handling and edge cases

### Performance Testing

- Monitor frame rates during hand tracking
- Check memory usage during long sessions
- Test with different canvas sizes

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow coding standards
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   - Run the development server
   - Test all affected functionality
   - Check for regressions

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use the PR template
   - Describe your changes clearly
   - Link related issues
   - Request reviews from maintainers

### Commit Message Format

Use conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

## Areas for Contribution

### High Priority

- **Gesture Recognition**: Improve accuracy and reliability
- **Performance**: Optimize hand tracking and rendering
- **User Experience**: Enhance drawing smoothness and responsiveness

### Medium Priority

- **New Features**: Add more gesture types and drawing tools
- **UI/UX**: Improve interface design and usability
- **Accessibility**: Add features for users with different abilities

### Low Priority

- **Documentation**: Improve guides and examples
- **Testing**: Add comprehensive test coverage
- **Infrastructure**: Improve build and deployment processes

## Getting Help

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Code Review**: Request reviews from maintainers for guidance

## Recognition

Contributors will be recognized in:
- The project README
- Release notes
- GitHub contributors page

Thank you for contributing to CamliDraw! 🎨 