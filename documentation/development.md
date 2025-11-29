
## 🤝 Contributing

We follow a structured development process with comprehensive testing requirements.

### Development Workflow

1. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement your feature** following existing patterns

3. **Write tests** for your feature
   - Unit tests for functions
   - Integration tests for API endpoints
   - Component tests for React components
   - Aim for >80% branch coverage

4. **Run tests** and ensure they pass
   ```bash
   cd backend && npm run test:coverage
   cd frontend && npm test
   ```

5. **Commit your changes** with descriptive messages
   ```bash
   git commit -m "feat: add skill proficiency filtering"
   ```

6. **Push to your branch** and create a Pull Request
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Standards

- Use ES6+ JavaScript features
- Follow existing file structure and naming conventions
- Write clear, self-documenting code
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable and function names

### Pull Request Requirements

- [ ] All tests passing
- [ ] New tests added for new features
- [ ] Code coverage maintained or improved
- [ ] No console errors in browser
- [ ] Responsive design verified
- [ ] API endpoints documented
- [ ] README updated if needed

---

### Running Tests

**Backend Tests:**
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# View HTML coverage report
# Open backend/coverage/lcov-report/index.html in browser
```

**Frontend Tests:**
```bash
cd frontend

# Run all tests
npm test

# Run tests once (CI mode)
npm run test:run
```

### Test Structure

- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints with mocked dependencies
- **Component Tests**: React component behavior and rendering
- **Route Tests**: Express route configurations (100% coverage)

### Testing Best Practices

- All new features require tests
- Minimum 80% branch coverage for new code
- Mock external dependencies (Clerk, MongoDB, Nodemailer)
- Use descriptive test names: `should [action] when [condition]`
- Test both success and error paths

---

## 👥 Team

**CS 490 Capstone Team - Fall 2025**

*ATS for Candidates Development Team*

**Repository:** [https://github.com/JayRay15/CS490-HotSho-project](https://github.com/JayRay15/CS490-HotSho-project)
