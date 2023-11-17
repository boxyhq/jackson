# Contributing to Jackson

We appreciate your interest in contributing to Jackson, and your contributions are integral to enhancing the project. Whether you are addressing a bug, implementing new features, or suggesting improvements, your involvement is highly valued and essential.

## Code Style

Please adhere to the [Node Style Guide](https://github.com/felixge/node-style-guide).

## Getting Started

### 1. Fork the Repository

To get started, fork the Jackson repository. This creates a duplicate of the project, allowing you to make and test your changes without affecting the original project.

[Fork this repository](https://github.com/boxyhq/jackson/fork)

### 2. Clone the Repository

Clone your forked repository to your local development environment using this command:

```shell
git clone https://github.com/your-username/jackson.git
```

### 3. Setup

Navigate to the project folder and install the necessary dependencies:

```shell
cd jackson
```

#### Install Dependencies

```shell
npm i
```

#### Configure Environment Variables

```shell
cp .env.example .env
npm run dev
```

Please update the .env file with your values. Refer to the complete list of [Environment Variables](https://boxyhq.com/docs/jackson/deploy/env-variables) for guidance.

### 4. Build and Run

Ensure that the project is prepared for development:

```shell
npm run build
npm run start
```

Visit [http://localhost:5225](http://localhost:5225) in your browser. If you encounter a sign-in page, you've successfully reached the Admin Portal.

For a comprehensive understanding of the deployment process, consult our documentation [here](https://boxyhq.com/docs/jackson/deploy/).

## Contribution

### Creating a New Branch

Begin by creating a new branch where you will work on your changes. You can do this with the following command:

```shell
git checkout -b your-branch-name
```

Alternatively, you can create a branch using:

```shell
git branch your-branch-name
```

### Staging Your Changes

Use the following command to stage the changes you want to commit:

```shell
git add your-file-name
```

Alternatively, you can stage all changes with:

```shell
git add .
```

### Committing Your Changes

Make clear and concise commits with a descriptive message:

```shell
git commit -m "Enter a descriptive message for the changes to be committed"
```

### Pushing Your Changes

Once your changes are committed, push them to your branch:

```shell
git push origin your-branch-name
```

## Create a Pull Request

Effective pull requests, which can include patches, improvements, or new features, are a valuable contribution. Ensure they are focused on a specific scope and do not contain unrelated commits.

To create a pull request, navigate to the original repository on GitHub and click the "New Pull Request" button. Compare and create a pull request from your branch to the main repository. Provide a clear and concise description of your changes in the pull request.

## Review and Feedback

After submitting your pull request, maintainers and other contributors will review your changes and provide feedback. Be prepared to address any suggested improvements.

## Merging

Once your pull request is approved, it will be merged into the main repository.

#### Celebrate!

## Bug Reports

If you encounter any issues or bugs, please report them with detailed information to aid in troubleshooting.

## Feature Requests

Feel free to submit detailed feature requests for new functionality you would like to see.

## Testing

Comprehensive testing of your changes is vital to prevent regressions and errors.

## Good First Issues

To begin your contribution journey, explore our list of "good first issue" tasks specifically curated for newcomers and first-time contributors.

## Development

1. Fork the repository.
2. Clone your fork to your local environment.
3. Install dependencies.
4. Implement changes, add features, or enhance documentation.
5. Test your changes.
6. Submit a pull request against the main branch.

## Code Of Conduct

Please ensure that your contributions align with our [Code of Conduct](https://github.com/boxyhq/jackson/blob/main/CODE_OF_CONDUCT.md). Show respect, inclusivity, and consideration for others.

## License

Jackson is an open-source project released under the [Apache License 2.0](https://github.com/boxyhq/jackson/blob/main/LICENSE). Your contributions are subject to the terms of this license.

## Additional Tips

1. Be responsive to feedback from maintainers.
2. Don't hesitate to seek help if needed in the discussion forum or any related platform.

#### Happy contributing!
