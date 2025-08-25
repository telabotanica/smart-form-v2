# SmartFormV2

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.2.0.

Node v24 is needed.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Beta

Run `ng build --configuration beta --base-href=/smart-form/` to build the project on production server. The build artifacts will be stored in the `dist/` directory.

You will need to copy the content of the `dist/identiplante/browser` on your server

Or authorize ssh connection and create a script `./deploy.sh beta`

## Building

To build the project run:

```bash
ng build --configuration production --base-href=/smart-form/
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

You will need to copy the content of the `dist/identiplante/browser` on your server
Or authorize ssh connection and create a script `./deploy.sh production`
## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
