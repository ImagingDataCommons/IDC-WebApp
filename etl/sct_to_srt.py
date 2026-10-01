# By @fedorov
# A script that will parse the HTML page and output table into CSV. Co-created with Perplexity.AI.

import requests
from bs4 import BeautifulSoup
import csv

url = "https://dicom.nema.org/medical/dicom/current/output/chtml/part16/chapter_O.html"

response = requests.get(url)
response.raise_for_status()

soup = BeautifulSoup(response.content, 'html.parser')

# Find the table
table = soup.find('div', class_='table-contents').find('table')

# Initialize lists to store data
headers = []
rows = []

# Extract headers
for th in table.find_all('th'):
    headers.append(th.text.strip())

# Extract rows
for tr in table.find_all('tr'):
    cells = tr.find_all('td')
    if cells:
        row = [cell.text.strip() for cell in cells]
        rows.append(row)

# Write to CSV
csv_filename = 'sct_to_srt_map.csv'
with open(csv_filename, mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(headers)
    writer.writerows(rows)

print(f"Data has been saved to {csv_filename}.")