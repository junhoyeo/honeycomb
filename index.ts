import * as puppeteer from 'puppeteer';
import {
  rootURL,
  email,
  password,
  perfect as perfectWhenSubject,
  search as searchText,
} from './credentials.json';

declare const $: JQueryStatic;

interface IProblem {
  name: string;
  value: string;
}

const delayForMilliseconds = (delay: number) => {
  return new Promise((resolve, _) => {
    setTimeout(() => {
      resolve();
    }, delay);
  });
}

const solveProblems = async () => {
  const browser = await puppeteer.launch({
    dumpio: true,
  });
  const page = await browser.newPage();

  await page.goto(rootURL);

  await page.$eval('#loginID', (element, email: string) =>
    (element as HTMLInputElement).value = email, email);
  await page.$eval('#loginPW', (element, password: string) =>
    (element as HTMLInputElement).value = password, password);
  await page.click('div.login-buttons > button:first-child');
  await page.goto(`${rootURL}/StudentStudy/TaskList`);

  const uncompletedProblems = await page.evaluate((searchText: string) => {
    const problemRows = [...document.querySelectorAll('tbody > tr')];
    return problemRows
      // @ts-ignore
      .flatMap((row) => {
        const problemName = row.querySelector('td:nth-child(5)') as HTMLTableDataCellElement;
        if (!problemName) {
          return false;
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
  }, searchText);
  console.log(uncompletedProblems);

  if (!uncompletedProblems.length) {
    console.log('🙌 All problems solved!');
    await browser.close();
    return;
  }

  const {
    name: problemName,
    value: problemValue,
  } = uncompletedProblems[0] as IProblem;
  await page.click(`tr[value='${problemValue}']`);

  await delayForMilliseconds(500);
  console.log(`📔 Solving '${problemName}'`);

  const values = await page.evaluate(() => {
    const element = document.querySelector('#TestDetail-table > tbody > tr');
    if (!element) return [];
    return [{
      value: element.getAttribute('value'),
      detailvalue: element.getAttribute('detailvalue'),
    }];
  });
  console.log(values);
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
  console.log(answers);

  await page.evaluate(() => {
    const element = document.querySelector('div.gotoStudy') as HTMLDivElement;
    if (element) {
      element.click();
    }
  });

  await delayForMilliseconds(1500);
  await page.evaluate((problemName: string, perfectWhenSubject: string, answers: number[]) => {
    const selectors = [...document.querySelectorAll('table#Answer tr')].slice(1);
    selectors.forEach((selector, problemNumber) => {
      const subjectiveInput = selector.querySelector('input');
      if (subjectiveInput) {
        subjectiveInput.value = (answers[problemNumber] || '.') as string;
        return;
      }

      const badges = [...selector.querySelectorAll('span.badge')];
      const answer = (() => {
        if (perfectWhenSubject && problemName.includes(perfectWhenSubject)) {
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
    });
    console.log('✅ Checked all 📝');
  }, problemName, perfectWhenSubject, answers);

  const timeoutBias = Math.floor(Math.random() * 6);
  const timeoutDelayBeforeSubmit = (20 + timeoutBias) * 1000;
  await delayForMilliseconds(timeoutDelayBeforeSubmit);

  await page.evaluate(() => {
    const element = document.querySelector('div.AnswerSubmit > a') as HTMLAnchorElement;
    if (element) {
      element.click();
    }
  });

  await delayForMilliseconds(1500);
  await page.screenshot({path: 'example.png'});
  await browser.close();
};

(async () => {
  await solveProblems();
})();
