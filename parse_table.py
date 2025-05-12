import requests
from bs4 import BeautifulSoup
import json

url = "https://irowiki.org/wiki/Original_Soundtrack"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, "html.parser")

#print(soup)

# Find the table with class "wikitable sortable"
table = soup.find('tbody')
rows = table.find_all('tr')
for x in rows:    
    columns = x.find_all("td")
    if len(columns) > 0:
        number = columns[0].text.strip()
        title = columns[1].text.strip()        
        if ("<br/>" in str(columns[2])):            
            maps = '; '.join(str(columns[2]).split("<br/>"))    
            maps = maps.replace("<td>","").replace("</td>","")
        else:            
            maps = columns[2].text.strip()

        title = title + " (" + maps + ")"         
        print('{{id: {number}, title: "{title}", audioUrl: "/BGM2/{number}.mp3"}},'.format(number=number, title=title))
    




