const puppeteer = require('puppeteer');
const {
  rootURL,
  email,
  password,
  perfect: perfectWhenSubject,
} = require('./credentials.json');

(async () => {
  const browser = await puppeteer.launch({
    dumpio: true,
  });
  const page = await browser.newPage();

  await page.goto(rootURL);

  await page.$eval('#loginID', (el, email) => el.value = email, email);
  await page.$eval('#loginPW', (el, password) => el.value = password, password);
  await page.click('div.login-buttons > button:first-child');
  await page.goto(`${rootURL}/StudentStudy/TaskList`);

  const uncompletedProblems = await page.evaluate(() => {
    const problemRows = [...document.querySelectorAll('tbody > tr')];
    return problemRows
      .flatMap((row) => {
        const problemName = row.querySelector('td:nth-child(5)');
        if (!problemName) {
          return false;
        }

        const problemNameText = problemName.innerText;
        const isDailyTask = problemNameText.includes('일일학습');
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
  });
  console.log(uncompletedProblems);

  const {
    name: problemName,
    value: problemValue,
  } = uncompletedProblems[0];
  await page.click(`tr[value='${problemValue}']`);

  setTimeout(
    async () => {
      console.log(`📔 Solving '${problemName}'`);

      const values = await page.evaluate(() => {
        const element = document.querySelector('#TestDetail-table > tbody > tr');
        return [{
          value: element.getAttribute('value'),
          detailvalue: element.getAttribute('detailvalue'),
        }];
      });
      console.log(values);
      const type = 'ymWuGYYSOfmJLRPkt3xlfw{e}{e}';

      const response = await page.evaluate((values, type) => $.ajax({
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
        document
          .querySelector('div.gotoStudy')
          .click();
      });

      setTimeout(
        async () => {
          await page.evaluate((problemName, perfectWhenSubject, answers) => {
            const selectors = [...document.querySelectorAll('table#Answer tr')].slice(1);
            selectors.forEach((selector, problemNumber) => {
              const subjectiveInput = selector.querySelector('input');
              if (subjectiveInput) {
                subjectiveInput.value = answers[problemNumber] || '.';
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
              badges[badgeNumber].click();
            });
            console.log('✅ Checked all 📝');
          }, problemName, perfectWhenSubject, answers);

          const timeoutBias = Math.floor(Math.random() * 6);
          const timeoutDelay = 20 * 1000 + timeoutBias;

          setTimeout(
            async () => {
              await page.evaluate(() => {
                document
                  .querySelector('div.AnswerSubmit > a')
                  .click();
              });

              setTimeout(
                async () => {
                  await page.screenshot({path: 'example.png'});
                  await browser.close();
                },
                1500,
              );
            },
            // timeout before submit
            timeoutDelay,
          );
        },
        1500,
      );
    },
    500,
  );
})();
