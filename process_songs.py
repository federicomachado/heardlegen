import os
from pydub import AudioSegment
from pydub.silence import detect_nonsilent

def process_audio(input_path, output_path, max_duration=15000):
    # Load the audio file
    print(f"Processing {input_path}...")
    audio = AudioSegment.from_mp3(input_path)
    
    # Detect non-silent parts
    nonsilent_ranges = detect_nonsilent(
        audio,
        min_silence_len=500,  # 500ms of silence
        silence_thresh=-40     # -40 dB
    )
    
    if not nonsilent_ranges:
        print(f"Warning: No non-silent parts found in {input_path}")
        return
    
    # Get the start of the first non-silent part
    start_time = nonsilent_ranges[0][0]
    
    # Cut from the start of audio to max_duration
    processed_audio = audio[start_time:start_time + max_duration]
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Export the processed audio
    processed_audio.export(output_path, format="mp3")
    print(f"Saved to {output_path}")

def main():
    # Input and output directories
    input_dir = "BGM"
    output_dir = "BGM2"
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Process all MP3 files in the input directory
    for filename in os.listdir(input_dir):
        if filename.endswith(".mp3"):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename)
            
            # Skip if output file already exists
            if os.path.exists(output_path):
                print(f"Skipping {filename} - already exists in output directory")
                continue
                
            process_audio(input_path, output_path)

if __name__ == "__main__":
    main() 