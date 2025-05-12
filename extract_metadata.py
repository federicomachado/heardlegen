import os
import json
from mutagen.mp3 import MP3
from mutagen.id3 import ID3
from pathlib import Path

def extract_metadata(mp3_path):
    try:
        # Get basic MP3 info
        audio = MP3(mp3_path)
        id3 = ID3(mp3_path)
        
        # Extract metadata
        metadata = {
            'filename': os.path.basename(mp3_path),
            'duration': audio.info.length,
            'bitrate': audio.info.bitrate,
            'sample_rate': audio.info.sample_rate,
            'channels': audio.info.channels,
        }
        
        # Try to get ID3 tags
        try:
            if 'TIT2' in id3:
                metadata['title'] = str(id3['TIT2'])
            if 'TPE1' in id3:
                metadata['artist'] = str(id3['TPE1'])
            if 'TALB' in id3:
                metadata['album'] = str(id3['TALB'])
        except:
            pass
            
        return metadata
    except Exception as e:
        print(f"Error processing {mp3_path}: {str(e)}")
        return None

def main():
    # Get all MP3 files from BGM directory
    bgm_dir = Path('BGM')
    mp3_files = list(bgm_dir.glob('*.mp3'))
    
    # Extract metadata for each file
    metadata_list = []
    for mp3_file in mp3_files:
        metadata = extract_metadata(str(mp3_file))
        if metadata:
            metadata_list.append(metadata)
    
    # Sort by filename
    metadata_list.sort(key=lambda x: x['filename'])
    
    # Save to JSON file
    with open('song_metadata.json', 'w', encoding='utf-8') as f:
        json.dump(metadata_list, f, indent=2, ensure_ascii=False)
    
    print(f"Processed {len(metadata_list)} MP3 files")
    print("Metadata saved to song_metadata.json")

if __name__ == '__main__':
    main() 