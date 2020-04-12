function getAnswers(values, type, number) {
  return $.ajax({
    url: '/Utils/TestDetailPrint',
    data: { values, type },
    type: 'POST',
    success: (response) => {
      const { Table01: array } = response;
      const keys = Object.keys(array);
      const answers = keys.map((key) => array[key].QST_CORRECT);
      console.log(`${number}번`, answers);
    }
  });
}

var papers = document.querySelectorAll('#TestDetail-table > tbody > tr');
(async () => {
  papers.forEach(async (element) => {
    const value = element.getAttribute('value');
    const detailvalue = element.getAttribute('detailvalue');
    const values = [{ value, detailvalue }];
    const type = 'BUtOQk2lrOEvgMiauV9y0Q{e}{e}';

    const numberElement = element.querySelector('td.center:first-child + td');
    const number = numberElement.innerHTML.trim();
    await getAnswers(values, type, number);
  });
})();
