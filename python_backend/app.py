from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# API configuration
DID_API_KEY = os.environ.get("DID_API_KEY")
FISH_API_KEY = os.environ.get("FISH_API_KEY")
DID_BASE_URL = "https://api.d-id.com"

# Models
FISH_MODEL_PRO = "bf322df2096a46f18c579d0baa36f41d"
FISH_MODEL_GOOFY = "54e3a85ac9594ffa83264b8a494b901b"

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- HELPER: Upload Background Image ---
def upload_background():
    """Uploads local background.jpg to D-ID and returns the URL"""
    bg_path = "background.jpg" 
    
    if not os.path.exists(bg_path):
        print("   [Warning] background.jpg not found. Using default.")
        return None
    
    print("   [Python] Uploading Custom Background...")
    try:
        with open(bg_path, "rb") as f:
            files = {"image": ("background.jpg", f, "image/jpeg")}
            response = requests.post(
                f"{DID_BASE_URL}/images",
                headers={"Authorization": f"Basic {DID_API_KEY}"},
                files=files
            )
        
        if response.status_code == 201:
            return response.json()["url"]
        else:
            print(f"   [Error] Background Upload Failed: {response.text}")
            return None
    except Exception as e:
        print(f"   [Error] Background Upload Exception: {e}")
        return None

# --- HELPER: Fish Audio TTS ---
def text_to_speech(text, voice="pro"):
    if voice in ["goofy", "elmo", "pirate"]:
        model_id = FISH_MODEL_GOOFY
    else:
        model_id = FISH_MODEL_PRO
    
    print(f"   [Python] Generating Audio (Voice: {voice})...")
    
    try:
        response = requests.post(
            "https://api.fish.audio/v1/tts",
            headers={
                "Authorization": f"Bearer {FISH_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "text": text,
                "reference_id": model_id,
                "format": "mp3",
                "mp3_bitrate": 128
            }
        )
        if response.status_code != 200:
            print(f"   [Error] Fish Audio: {response.text}")
            return None
        return response.content
    except Exception as e:
        print(f"   [Error] TTS Exception: {e}")
        return None

@app.route("/generate", methods=["POST"])
def generate_from_text():
    data = request.get_json()
    text = data.get("text", "")
    voice = data.get("voice", "professional")
    
    print(f"--> [Python] Request Received. Length: {len(text)}")
    
    try:
        # 1. Generate Audio
        audio_bytes = text_to_speech(text, voice)
        if not audio_bytes:
            return jsonify({"error": "Failed to generate audio"}), 500
        
        filepath = os.path.join(UPLOAD_FOLDER, "temp_audio.mp3")
        with open(filepath, "wb") as f:
            f.write(audio_bytes)
        
        # 2. Upload Audio
        print("   [Python] Uploading Audio...")
        with open(filepath, "rb") as f:
            files = {"audio": ("audio.mp3", f, "audio/mpeg")}
            response = requests.post(
                f"{DID_BASE_URL}/audios", 
                headers={"Authorization": f"Basic {DID_API_KEY}"}, 
                files=files
            )
        
        if response.status_code != 201:
            return jsonify({"error": "Audio Upload Failed", "details": response.text}), 500
        
        audio_url = response.json()["url"]
        
        # 3. Upload Background
        bg_url = upload_background()
        
        # 4. Create Clip
        print("   [Python] Creating Video Clip...")
        
        # Consistent Presenter: Darren
        presenter_id = "v2_public_darren@JgxEH6fBQJ" 
        
        payload = {
            "script": { "type": "audio", "audio_url": audio_url },
            "presenter_id": presenter_id,
            "config": { "result_format": "mp4" }
        }
        
        if bg_url:
            payload["background"] = { "source_url": bg_url }
        
        clip_response = requests.post(
            f"{DID_BASE_URL}/clips", 
            headers={"Authorization": f"Basic {DID_API_KEY}", "Content-Type": "application/json"}, 
            json=payload
        )
        
        if clip_response.status_code != 201:
            return jsonify({"error": "Clip Creation Failed", "details": clip_response.text}), 500
        
        clip_data = clip_response.json()
        return jsonify({"clip_id": clip_data["id"], "status": clip_data["status"]})
        
    except Exception as e:
        print(f"   [Crash]: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/status/<clip_id>")
def check_status(clip_id):
    url = f"{DID_BASE_URL}/clips/{clip_id}"
    response = requests.get(url, headers={"Authorization": f"Basic {DID_API_KEY}"})
    return jsonify(response.json())

if __name__ == "__main__":
    print("PYTHON SERVER RUNNING ON PORT 5000")
    app.run(debug=True, port=5000)

