const puppeteer = require('puppeteer');
const { rootURL, email, password } = require('./credentials.json');

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
    return problemRows.
      filter((row) => (
        !row.className.includes('complete')
        && row.getAttribute('role') === 'row'
      ))
      .map((row) => row.getAttribute('value'));
  });
  console.log(uncompletedProblems);

  const problemValue = uncompletedProblems[0];
  await page.click(`tr[value='${problemValue}']`);

  setTimeout(
    async () => {
      const values = await page.evaluate(() => {
        const element = document.querySelector('#TestDetail-table > tbody > tr');
        return [{
          value: element.getAttribute('value'),
          detailvalue: element.getAttribute('detailvalue'),
        }];
      });
      console.log(values);
      const type = 'BUtOQk2lrOEvgMiauV9y0Q{e}{e}';

      const response = await page.evaluate((values, type) => {
        return $.ajax({
          url: '/Utils/TestDetailPrint',
          data: { values, type },
          type: 'POST',
          async: false,
        });
      }, values, type);
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
          await page.evaluate((answers) => {
            const selectors = [...document.querySelectorAll('table#Answer tr')].slice(1);
            selectors.forEach((selector, problemNumber) => {
              const badges = [...selector.querySelectorAll('span.badge')];
              const badgeNumber = answers[problemNumber] - 1;
              badges[badgeNumber].click();
            });
            console.log('✅ Checked all 📝');
          }, answers);

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
            20 * 1000,
          );
        },
        1500,
      );
    },
    500,
  );
})();
