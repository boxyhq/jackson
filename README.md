# SAML Jackson (not fiction anymore)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fboxyhq%2Fjackson&env=DB_ENGINE,DB_TYPE,DB_URL,JACKSON_API_KEYS,DB_ENCRYPTION_KEY&envDescription=DB%20configuration%20and%20keys%20for%20encryption%20and%20authentication.Set%20to%20''%20if%20not%20applicable.&envLink=https://boxyhq.com/docs/jackson/env-variables)
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

SAML service [SAML in a box from BoxyHQ]

You need someone like Jules Winnfield to save you from the vagaries of SAML login. Jackson implements the SAML login flow as an OAuth 2.0 flow, abstracting away all the complexities of the SAML protocol.

## Documentation

For full documentation, visit [boxyhq.com/docs/jackson/introduction](https://boxyhq.com/docs/jackson/introduction)

## Source code visualizer

[CodeSee codebase visualizer](https://app.codesee.io/maps/public/53e91640-23b5-11ec-a724-79d7dd589517)

## SBOM Reports (Software Bill Of Materials)

[SBOM](https://en.wikipedia.org/wiki/Software_bill_of_materials) is a list of components in a piece of software. It is like a list of ingredients of a product.

### Report Standards

SBOM reports primarily use [SPDX](https://en.wikipedia.org/wiki/Software_Package_Data_Exchange) & [CycloneDX](https://cyclonedx.org/) standards.

### Jackson SBOM reports

You can find the SBOM reports at the following locations, which are updated every time there is change in the codebase.

| Location    | Files                         | Context                               |
| ----------- | ----------------------------- | ------------------------------------- |
| `./`        | `sbom.spdx`, `sbom.cyclonedx` | SAML Jackson service                  |
| `./npm`     | `sbom.spdx`, `sbom.cyclonedx` | NPM package                           |
| `./_docker` | `sbom.spdx`, `sbom.cyclonedx` | Docker Image for SAML Jackson service |

## Contributing

Thanks for taking the time to contribute! Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make will benefit everybody else and are appreciated.

Please try to create bug reports that are:

- _Reproducible._ Include steps to reproduce the problem.
- _Specific._ Include as much detail as possible: which version, what environment, etc.
- _Unique._ Do not duplicate existing opened issues.
- _Scoped to a Single Bug._ One bug per report.

## Support

Reach out to the maintainers at one of the following places:

- [GitHub Discussions](https://github.com/boxyhq/jackson/discussions)
- [GitHub Issues](https://github.com/boxyhq/jackson/issues)

## License

[Apache 2.0 License](https://github.com/boxyhq/jackson/blob/main/LICENSE)
