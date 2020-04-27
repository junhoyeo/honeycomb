from selenium import webdriver
import requests

from credentials import (
  root_url,
  email,
  password,
)

with open('./wants-to-graduate.js') as file_pointer:
  script = file_pointer.read()

rest_url = root_url.split('//')[1]
headers = {
  'Host': rest_url,
  'Connection': 'keep-alive',
  'Content-Length': '171',
  'Accept': '*/*',
  'X-Requested-With': 'XMLHttpRequest',
  f'{rest_url.replace('.co.kr', '')}AJAX': 'true',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Origin': root_url,
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
  'Referer': f'{root_url}/StudentStudy/TestList',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
}

driver = webdriver.Chrome('./chromedriver')

driver.get(f'{root_url}/')
driver.find_element_by_name('loginID').send_keys(email)
driver.find_element_by_name('loginPW').send_keys(password)
driver.find_element_by_css_selector('div.login-buttons > button:first-child').click()

driver.implicitly_wait(3)
driver.get(f'{root_url}/StudentStudy/TestList')

problem_rows = [
  element
  for element in driver.find_elements_by_css_selector('tbody > tr')
  if ('complete' not in element.get_attribute('class'))
    and (element.get_attribute('role') == 'row')
]
print(problem_rows)

def get_answers(driver, values, type_value, number):
  driver_cookies = driver.get_cookies()
  stringified_cookies = {
    cookie['name']: cookie['value']
    for cookie in driver_cookies
  }

  print(values, type_value)

  print(stringified_cookies)
  res = requests.post(
    f'{root_url}/Utils/TestDetailPrint',
    data={ 'values': values, 'type': type_value },
    headers=headers,
    cookies=stringified_cookies,
  )
  print(res, res.text, res.url)

for problem in problem_rows:
  problem.click()
  driver.implicitly_wait(3)

  papers = driver.find_elements_by_css_selector('#TestDetail-table > tbody > tr')

  for paper in papers:
    value = paper.get_attribute('value')
    detailvalue = paper.get_attribute('detailvalue')
    values = [{ 'value': value, 'detailvalue': detailvalue }]
    type_value = '''ymWuGYYSOfmJLRPkt3xlfw{e}{e}'''

    number_element = driver.find_element_by_css_selector('td.center:first-child + td')
    number = number_element.get_attribute('innerHTML').strip()
    get_answers(driver, values, type_value, number)
