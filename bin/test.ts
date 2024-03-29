import type { Expect } from '@japa/expect'

import { expect } from '@japa/expect'
import { pathToFileURL } from 'node:url'
import { specReporter } from '@japa/spec-reporter'
import { processCliArgs, configure, run } from '@japa/runner'

declare module '@japa/runner' {
  interface TestContext {
    expect: Expect
  }
}

/*
|--------------------------------------------------------------------------
| Configure tests
|--------------------------------------------------------------------------
|
| The configure method accepts the configuration to configure the Japa
| tests runner.
|
| The first method call "processCliArgs" process the command line arguments
| and turns them into a config object. Using this method is not mandatory.
|
| Please consult japa.dev/runner-config for the config docs.
*/
configure({
  ...processCliArgs(process.argv.slice(2)),
  ...{
    files: ['tests/**/*.spec.ts'],
    plugins: [expect()],
    reporters: [specReporter()],
    importer: (filePath) => {
      const path = pathToFileURL(filePath).href
      return import(path)
    },
  },
})

/*
|--------------------------------------------------------------------------
| Run tests
|--------------------------------------------------------------------------
|
| The following "run" method is required to execute all the tests.
|
*/
run()
