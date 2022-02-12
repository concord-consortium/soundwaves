# Soundwaves

## Development

### Initial steps

1. Clone this repo and `cd` into it
2. Run `npm install` to pull dependencies
3. Run `npm start` to run `webpack-dev-server` (local server that automatically rebuilds the app)
in development mode with hot module replacement

#### Run using HTTPS

Additional steps are required to run using HTTPS.

1. install [mkcert](https://github.com/FiloSottile/mkcert) : `brew install mkcert` (install using Scoop or Chocolatey on Windows)
2. Create and install the trusted CA in keychain if it doesn't already exist:   `mkcert -install`
3. Ensure you have a `.localhost-ssl` certificate directory in your home directory (create if needed, typically `C:\Users\UserName` on Windows) and cd into that directory
4. Make the cert files: `mkcert -cert-file localhost.pem -key-file localhost.key localhost 127.0.0.1 ::1`
5. Run `npm run start:secure` to run `webpack-dev-server` in development mode with hot module replacement

Alternately, you can run secure without certificates in Chrome:
1. Enter `chrome://flags/#allow-insecure-localhost` in Chrome URL bar
2. Change flag from disabled to enabled
3. Run `npm run start:secure:no-certs` to run `webpack-dev-server` in development mode with hot module replacement

Note that this is usually not necessary for local development.

### Building

If you want to build a local version run `npm build`, it will create the files in the `dist` folder.
You *do not* need to build to deploy the code, that is automatic.  See more info in the Deployment section below.

### Notes

1. Make sure if you are using Visual Studio Code that you use the workspace version of TypeScript.
   To ensure that you are open a TypeScript file in VSC and then click on the version number next to
   `TypeScript React` in the status bar and select 'Use Workspace Version' in the popup menu.

## Deployment to Concord Consortium AWS S3 bucket (https://soundwaves.concord.org)

Production releases to S3 are based on the contents of the /dist folder and are built automatically by GitHub Actions
for each branch pushed to GitHub and each merge into production.

Merges into production are deployed to https://soundwaves.concord.org.

Other branches are deployed to `https://soundwaves.concord.org/branch/<name>/`, for example: https://soundwaves.concord.org/branch/master/ (note the trailing slash).

## Deployment to custom location

Build the project using `npm build` script to update files in the `dist` folder.
It should include all the assets and the entry-point `index.html` file.
It's a static web page that can be hosted by pretty much any web server
and/or hosting provider.

## Updating sound files

All the sound files are stored at `src/assets/sounds`. If sound file is updated, but its name
isn't changed, it's enough to rebuild the project.

If new sounds are added or file names are updated, two TypeScript files
might need to be adjusted:
  - `src/components/app.tsx`
  - `src/components/sound-picker/sound-picker.tsx`

## Web Audio API

This app uses native Web Audio API. It takes care of the sound playback,
recording, downsampling for graphing needs, and even AM and FM modulation.

MDN provides great documentation and tutorials:
https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

Most of the custom audio-related helpers are implemented in `src/utils/audio.ts`.

AM and FM modulation is implemented using `OfflineAudioContext`, `OscillatorNode`, and `GainNode`.

## Known issues

1. Recording might not work on Safari browser on MacOS (Desktop Safari). The problem appears to be caused
by a bug in the underlying browser engine ("Webkit"), and not in the code for our SoundWaves app.
Please note that we have a related PT ticket, [#181016147](https://www.pivotaltracker.com/story/show/181016147),
to track the resolution of that Webkit defect.

Tracker for Webkit issue:
https://bugs.webkit.org/show_bug.cgi?id=233473

More content-full tracking of that issue, from the (Webkit-consuming) Twilio Video project:
https://github.com/twilio/twilio-video.js/issues/1671

### Testing

Run `npm test` to run jest tests. Run `npm run test:full` to run jest and Cypress tests.

##### Cypress Run Options

Inside of your `package.json` file:
1. `--browser browser-name`: define browser for running tests
2. `--group group-name`: assign a group name for tests running
3. `--spec`: define the spec files to run
4. `--headed`: show cypress test runner GUI while running test (will exit by default when done)
5. `--no-exit`: keep cypress test runner GUI open when done running
6. `--record`: decide whether or not tests will have video recordings
7. `--key`: specify your secret record key
8. `--reporter`: specify a mocha reporter

##### Cypress Run Examples

1. `cypress run --browser chrome` will run cypress in a chrome browser
2. `cypress run --headed --no-exit` will open cypress test runner when tests begin to run, and it will remain open when tests are finished running.
3. `cypress run --spec 'cypress/integration/examples/smoke-test.js'` will point to a smoke-test file rather than running all of the test files for a project.

## License

Soundwaves are Copyright 2021 (c) by the Concord Consortium and is distributed under the [MIT license](http://www.opensource.org/licenses/MIT).

See license.md for the complete license text.
