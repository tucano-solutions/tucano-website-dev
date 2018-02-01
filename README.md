[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

# Tucano Website Development

## Briefing

In this repo we have all the source files and configurations of our dev-tools that we use to create and maintain our [organization website](http://tucanosolutions.com).

## Pre-requisites
Our developers use macOS but it should be able to work in other environments like windows or linux systems with minimal changes.

This project uses `nvm` to handle the `node` and `npm` versions.

In order to publish the new version of our website you need to have this repository at the same folder level as our [organization website repository](https://github.com/tucano-solutions/tucano-solutions.github.io).
```
rootFolder/
  |- tucano-solutions.github.io/
  |- tucano-website-dev/
```

## Installation
Run the following commands to set up your development environment.
```shell
nvm install
nvm use
npm install
```

## Development

There are three main jobs for development and publishing:

* `npm run dev` will compile sources without minification or revisioning and will start a local server with live reloading.
* `npm run stage` Will create a local copy of the website as it would be deployed in production. This copy will be served in a local server without live reload.
* `npm run publish` will minify and revision the website, ask you for a commit message and commit and push your changes to the [organization website](http://tucanosolutions.com) repository. After this is done, a build will be triggered by GitHub pages to build the new version of the website.

## License

This project is UNLICENSED which means that we do **not** grant any explicit permission for its reproduction or distribution. If you would like to use parts or the complete project, please [contact us](mailto:contact@tucanosolutions.com) first.
