# Contributing to Jackson

We appreciate your interest in contributing to Jackson, and your contributions are integral to enhancing the project. Whether addressing a bug, implementing new features, or suggesting improvements, your involvement is highly valued and essential.

- [Contributing to Jackson](#contributing-to-jackson)
  - [Code Style](#code-style)
  - [Getting Started](#getting-started)
    - [1. Fork the Repository](#1-fork-the-repository)
    - [2. Clone the Repository](#2-clone-the-repository)
    - [3. Setup](#3-setup)
  - [Contribution](#contribution)
    - [Creating a New Branch](#creating-a-new-branch)
    - [Staging Your Changes](#staging-your-changes)
    - [Committing Your Changes](#committing-your-changes)
    - [Pushing Your Changes](#pushing-your-changes)
  - [Create a Pull Request](#create-a-pull-request)
  - [Review and Feedback](#review-and-feedback)
  - [Merging](#merging)
    - [Celebrate!](#celebrate)
  - [Bug Reports](#bug-reports)
  - [Feature Requests](#feature-requests)
  - [Testing](#testing)
  - [Good First Issues](#good-first-issues)
  - [Development](#development)
  - [Code Of Conduct](#code-of-conduct)
  - [License](#license)
  - [Additional Tips](#additional-tips)

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

See our [README](README.md) for instructions on setting up the project.

## Contribution

### Creating a New Branch

Begin by creating a new branch where you will work on your changes. You should always aim to start by creating an issue that describes the problem you are solving or the feature you are implementing. This will help ensure that the maintainers are aware of your work and can provide feedback.

Let's say that your issue title is "Support Custom Postgres Schema" and is issue number `#1818`. The ideal format for your branch name would be `1818-support-custom-postgres-schema`.

You can create a new branch with the following command:

```shell
git switch -c 1818-support-custom-postgres-schema
```

For older versions of Git, use:

```shell
git checkout -b 1818-support-custom-postgres-schema
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

Once your pull request is approved, it will be merged into the main branch of the project.

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

1. Be patient. Your contributions are important, and we will do our best to review them in a timely manner.
2. Be responsive to feedback from maintainers.
3. Don't hesitate to seek help if needed in the discussion forum or any related platform.

**Happy contributing!**
