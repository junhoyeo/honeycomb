const puppeteer = require('puppeteer');
const { rootURL, email, password } = require('./credentials.json');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(rootURL);

  await page.$eval('#loginID', (el, email) => el.value = email, email);
  await page.$eval('#loginPW', (el, password) => el.value = password, password);
  await page.click('div.login-buttons > button:first-child');
  await page.goto(`${rootURL}/StudentStudy/TestList`);

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
      const answers = keys.map((key) => array[key].QST_CORRECT);
      console.log(answers);

      await page.screenshot({path: 'example.png'});
      await browser.close();
    },
    500,
  );
})();
