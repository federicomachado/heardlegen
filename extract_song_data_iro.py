import requests
from bs4 import BeautifulSoup
import json

url = "https://irowiki.org/wiki/Original_Soundtrack"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, "html.parser")

# The table is actually under the second "wikitable" on the page
tables = soup.find_all("table", class_="wikitable")
if len(tables) < 2:
    print("Could not find the expected number of tables.")
    exit(1)

target_table = tables[1]

songs = []
for idx, row in enumerate(target_table.find_all("tr")[1:], start=1):
    cols = row.find_all("td")
    if len(cols) < 4:
        continue

    file_name = cols[0].text.strip().replace("BGM_", "").replace(".mp3", "")
    if not file_name.isdigit():
        continue

    audio_number = file_name.zfill(2)
    title = cols[1].text.strip()
    map_info = cols[3].text.strip()
    full_title = f"{title} ({map_info})" if map_info else title

    songs.append({
        "id": idx,
        "title": full_title,
        "artist": "SoundTeMP",
        "audioUrl": f"/BGM/{audio_number}.mp3"
    })

with open("ragnarok_songs.json", "w", encoding="utf-8") as f:
    json.dump(songs, f, indent=2, ensure_ascii=False)

print(f"✅ Scraped {len(songs)} songs and saved to ragnarok_songs.json")
