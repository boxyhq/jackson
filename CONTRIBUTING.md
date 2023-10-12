
# Contributing to Jackson

Thank you for your interest in contributing to Jackson! Your contributions are essential in making Jackson even better. Whether you're fixing a bug, implementing new features, or suggesting improvements, your involvement is valued.

## Code Style

Please follow the [node style guide](https://github.com/felixge/node-style-guide).

## Getting Started

### 1. Fork the Repository

Start by forking the Jackson repository. This allows you to work on your changes without affecting the original project.

```shell
https://github.com/boxyhq/jackson
```

### 2. Clone the Repository

Clone your forked repository to your local development environment using this command:

```shell
git clone https://github.com/your-username/jackson.git
```

### 3. Set Up

Navigate to the project folder and install necessary dependencies:

```shell
cd jackson
npm run custom-install
```

#### Add Environment Variables

```shell
npm run dev
cp .env.example .env
```

Please update .env with your values. See the complete list of [Environment Variables](https://boxyhq.com/docs/jackson/deploy/env-variables).

### 4. Build and Run

Ensure the project is ready for development:

```shell
npm run build
npm run start
```

Visit [http://localhost:5225](http://localhost:5225) in your browser. If you see a sign-in page, you're on the Admin Portal.

Read the full documentation [here](https://boxyhq.com/docs/jackson/deploy/).

## Contribution Guidelines


### Create a new branch 

```shell
git checkout -b your-branch-name
```
#### or

```shell

git branch your-branch-name
```

### Push your changes by commiting them

```shell
git push origin your-branch-name
```

### Create a Pull Request

Good pull requests - patches, improvements, new features - are a fantastic help. They should remain focused in scope and avoid containing unrelated commits.

Go to the original repository on GitHub and click the "New Pull Request" button. Compare and create a pull request from your branch to the main repository. Provide a clear and concise description of your changes in the pull request.

### Bug Reports

If you encounter issues or bugs, please report them with detailed information.

### Feature Requests

Submit detailed feature requests for new functionality.

### Code Style

Maintain code consistency with the [node style guide](https://github.com/felixge/node-style-guide).

### Testing

Thoroughly test your changes to avoid regressions.

### Good First Issues

Start your contribution journey with our list of "good first issue" tasks, ideal for newcomers.

## Development

1. Fork the repository.
2. Clone your fork to your local environment.
3. Install dependencies.
4. Implement changes, add features, or enhance documentation.
5. Test your changes.
6. Submit a pull request against the main branch.

## License

Jackson is an open-source project released under the [MIT License](LICENSE). Your contributions are subject to the terms of this license.

### Code of Conduct

Please ensure that your contributions align with our https://github.com/boxyhq/saas-starter-kit/blob/main/CODE_OF_CONDUCT.md. Be respectful, inclusive, and considerate of others.

## Additional Tips

1. Be responsive to feedback from maintainers.
2. Don't hesitate to seek help if needed.


Happy contributing!
