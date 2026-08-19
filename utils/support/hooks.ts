import {
  After,
  AfterStep,
  Before,
  BeforeStep,
  ITestCaseHookParameter,
  ITestStepHookParameter,
  Status,
} from '@cucumber/cucumber';
import { env } from '../env';
import { slugify } from '../helpers';
import { PlaywrightWorld } from './world';

Before(async function (this: PlaywrightWorld, scenario: ITestCaseHookParameter) {
  const tags = scenario.pickle.tags.map((tag) => tag.name).join(' ');
  this.logger.setScenario(scenario.pickle.name);
  this.logger.test('info', `scenario started: ${scenario.pickle.name} [${tags}]`);
  await this.openApi();
});

// API scenarios talk to the gateway directly, so they never pay for a browser.
Before({ tags: 'not @api' }, async function (this: PlaywrightWorld) {
  await this.openBrowser();
});

BeforeStep(function (this: PlaywrightWorld, step: ITestStepHookParameter) {
  this.logger.test('debug', `step: ${step.pickleStep.text}`);
});

AfterStep(function (this: PlaywrightWorld, step: ITestStepHookParameter) {
  const failed = step.result.status === Status.FAILED;
  this.logger.test(
    failed ? 'error' : 'debug',
    `step ${step.result.status.toLowerCase()} (${step.result.duration.seconds}s): ${step.pickleStep.text}`,
    failed ? { error: step.result.message?.split('\n')[0] } : undefined,
  );
});

After(async function (this: PlaywrightWorld, scenario: ITestCaseHookParameter) {
  const failed = scenario.result?.status === Status.FAILED;
  const name = `${slugify(scenario.pickle.name)}-${scenario.testCaseStartedId.slice(0, 8)}`;

  this.logger.test(failed ? 'error' : 'info', `scenario ${scenario.result?.status.toLowerCase()}`);

  if (failed) await this.captureScreenshot(name);
  if (env.trace) await this.stopTrace(failed ? name : undefined);

  // Steps, browser events and API calls, so a failure can be read without a rerun.
  if (this.logger.entries.length) await this.attach(this.logger.text(), 'text/plain');

  await this.close();
});
