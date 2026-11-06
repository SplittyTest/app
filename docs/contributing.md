# Contributing

Thanks for helping make Splitty Test better. Bug reports, feature ideas and code contributions are all welcome.

## Reporting Bugs and Requesting Features

Open a [GitHub issue](https://github.com/SplittyTest/app/issues). For bugs, include:

* What you did, what you expected, and what happened instead
* Your Splitty Test version and how you deployed it (Docker Compose, Helm or from source)
* Relevant log output, with secrets and API keys removed

Check the [Road Map](/road-map) first. Your idea may already be planned.

::: warning Security issues
Please don't report security vulnerabilities in a public issue. Email [partners@splittytest.com](mailto:partners@splittytest.com) instead.
:::

## Contributing Code

::: info Before you start
Under [Section 5 of the license](/license), anything you submit (code, fixes, suggestions) is assigned to Splitty Test. Only submit work you own or have permission to contribute. We may not accept every contribution.
:::

For anything larger than a small fix, open an issue first so we can agree on the approach before you spend time on it.

### Setting Up a Development Environment

1. Start the databases with Docker, as described in [Developing against the Docker services](/getting-set-up#developing-against-the-docker-services).
2. Start the API in watch mode:

   ```bash
   $ cd api
   $ npm install
   $ npm run dev
   ```

3. In another terminal, start the UI dev server:

   ```bash
   $ cd ui
   $ npm install
   $ npm run dev
   ```

In development mode the API doesn't serve the UI, so open the URL the UI dev server prints.

### Before Opening a Pull Request

* Run the linter and tests in the `api` folder:

  ```bash
  $ npm run lint
  $ npm test
  ```

* Make sure the UI builds: `npm run build` in the `ui` folder.
* Add database changes as new migrations rather than editing existing ones.
* Update the docs in `docs/` if you change behavior.
* Keep pull requests focused on one change, and describe what it does and why.
