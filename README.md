# config-validator

Lightweight configuration file validator for Node.js projects. Checks `.env` files for common formatting issues.

## Usage

```bash
npm run validate        # Check config files in current directory
npm test               # Run test suite
```

## Features

- Validates `.env` file formatting
- Detects missing values, malformed lines
- Supports multiple env files (`.env`, `.env.local`, `.env.development`, `.env.production`)
- Ignores comments and blank lines

## Contributing

1. Fork the repository
2. Create your feature branch
3. Run tests: `npm test`
4. Submit a pull request
