import * as puppeteer from 'puppeteer';
import * as cliProgress from 'cli-progress';

import {
  targetURL,
  email,
  password,
  perfect as perfectWhenSubject,
  search as searchText,
} from './credentials.json';
import console = require('console');

declare const $: JQueryStatic;

const isTask = targetURL.includes('task');

interface IProblem {
  name: string;
  value: string;
}

const solveProblems = async (browser: puppeteer.Browser) => {
  const page = await browser.newPage();

  await page.goto(targetURL, { timeout: 0 });

  await page.$eval('#loginID', (element, email: string) =>
    (element as HTMLInputElement).value = email, email);
  await page.$eval('#loginPW', (element, password: string) =>
    (element as HTMLInputElement).value = password, password);
  await page.click('div.login-buttons > button:first-child');
  await page.goto(targetURL, {
    timeout: 0,
    waitUntil: 'domcontentloaded',
  });

  const uncompletedProblems = await page.evaluate((searchText: string, isTask: boolean) => {
    const problemRows = [...document.querySelectorAll('tbody > tr')];
    return problemRows
      // @ts-ignore
      .flatMap((row) => {
        const selectorForTargetType = `td:nth-child(${isTask ? 4 : 5})`;
        const problemName = row.querySelector(selectorForTargetType) as HTMLTableDataCellElement;
        if (!problemName) {
          return [];
        }
        const problemNameText = problemName.innerText;
        const isDailyTask = problemNameText.includes(searchText);
        const isValidTask = !row.className.includes('complete')
          && row.getAttribute('role') === 'row'
          && isDailyTask;

        if (isValidTask) {
          return [
            {
              name: problemNameText,
              value: row.getAttribute('value'),
            },
          ];
        }
        return [];
      });
  }, searchText, isTask);
  console.log(uncompletedProblems);

  if (!uncompletedProblems.length) {
    console.log('🙌 All problems solved!');
    await page.screenshot({ path: 'result.png' });
    return;
  }

  for (const uncompletedProblem of uncompletedProblems) {
    const {
      name: problemName,
      value: problemValue,
    } = uncompletedProblem as IProblem;

    await page.click(`tr[value='${problemValue}']`);

    await page.waitFor(500);
    console.log(`📔 Solving '${problemName}'`);

    const values = await page.evaluate(() => {
      const element = document.querySelector('#TestDetail-table > tbody > tr');
      if (!element) return [];
      return [{
        value: element.getAttribute('value'),
        detailvalue: element.getAttribute('detailvalue'),
      }];
    });
    const type = 'ymWuGYYSOfmJLRPkt3xlfw{e}{e}';

    const response = await page.evaluate((values: string[], type: string) => $.ajax({
      url: '/Utils/TestDetailPrint',
      data: { values, type },
      type: 'POST',
      async: false,
    }), values, type);
    const { Table01: array } = response;
    const keys = Object.keys(array);
    const answers = keys.map((key) => Number(array[key].QST_CORRECT));
    console.log(`Answers: ${answers.join(', ')}`);

    await page.evaluate(() => {
      const element = document.querySelector('div.gotoStudy') as HTMLDivElement;
      if (element) {
        element.click();
      }
    });
    await page.waitForNavigation({ timeout: 0 });

    const SECONDS = 1000;
    const MINIMAL_SOLVE_TIME_TO_GET_POINTS = 21;

    const timeoutBias = Math.floor(Math.random() * 6);
    const timeoutDelayBeforeSubmit = (MINIMAL_SOLVE_TIME_TO_GET_POINTS + timeoutBias) * SECONDS;

    console.log('🔒 Solving task started.');

    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(timeoutDelayBeforeSubmit, 0);

    const delayIncrement = timeoutDelayBeforeSubmit / 100;
    const delayForHalf = timeoutDelayBeforeSubmit / 2;

    for (let currentDelay = 0; currentDelay <= delayForHalf; currentDelay += delayIncrement) {
      progressBar.update(currentDelay);
      await page.waitFor(delayIncrement);
    }

    await page.evaluate((problemName: string, perfectWhenSubject: string, answers: number[]) => {
      const selectors = [...document.querySelectorAll('table#Answer tr')].slice(1);
      selectors.forEach((selector, problemNumber) => {
        const delayForEachSelect = problemNumber * 500;

        setTimeout(() => {
          const subjectiveInput = selector.querySelector('input');
          if (subjectiveInput) {
            subjectiveInput.value = (answers[problemNumber] || '.') as string;
            return;
          }

          const badges = [...selector.querySelectorAll('span.badge')];
          const answer = (() => {
            const isPerfect = perfectWhenSubject && problemName.includes(perfectWhenSubject);
            if (isPerfect || perfectWhenSubject === '*') {
              return answers[problemNumber];
            }
            const random =  Math.random() * 100;
            if (random <= 50) {
              return answers[problemNumber];
            }
            return Math.floor(Math.random() * 5 + 1);
          })();

          const badgeNumber = answer - 1;
          (badges[badgeNumber] as HTMLSpanElement).click();
        }, delayForEachSelect);
      });
      console.log('\n✅ Checked all 📝');
    }, problemName, perfectWhenSubject, answers);

    for (let currentDelay = delayForHalf; currentDelay <= timeoutDelayBeforeSubmit; currentDelay += delayIncrement) {
      progressBar.update(currentDelay);
      await page.waitFor(delayIncrement);
    }

    console.log('\n🔑 Solving task finished!');

    await page.evaluate(() => {
      const element = document.querySelector('div.AnswerSubmit > a') as HTMLAnchorElement;
      if (element) {
        element.click();
      }
    });

    await page.waitFor(1500);
    await page.screenshot({ path: 'result.png' });

    await page.goto(targetURL, {
      timeout: 0,
      waitUntil: 'domcontentloaded',
    });
  }

  console.log('🏁 Finished.');
  return await page.close();
};

(async () => {
  const browser = await puppeteer.launch({
    dumpio: true,
  });
  try {
    await solveProblems(browser);
  } catch (error) {
    console.log(error);
    process.exit();
  } finally {
    console.log('Return to main function.');
    await browser.close();
    process.exit();
  }
})();
