import base64
import json

def base64string_to_wav(b64string: str, fname: str):
    assert fname.endswith(".wav")

    content = base64.b64decode(b64string.encode())
    with open(fname, "wb") as f_wav:
        f_wav.write(content)

def participant_response_to_wav(participant_response_fname: str, fname: str):
    with open(participant_response_fname, "r") as f:
        participant_response_data = json.load(f)

    audio_response_trials = [
        trial for trial in participant_response_data
        if trial["trial_type"] == "html-audio-response"
    ]
    for i, atrial in enumerate(audio_response_trials):
        if len(audio_response_trials) == 1:
            base64string_to_wav(atrial["response"], fname)
        else:
            stem, extension = fname.split(".")
            step = atrial["internal_node_id"]
            _fname = f"{stem}.{step}.{extension}"
            base64string_to_wav(atrial["response"], _fname)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("-i", "--input", type=str)
    parser.add_argument("-o", "--output", type=str)
    args = parser.parse_args()    
    participant_response_to_wav(args.input, args.output)