import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("DID_API_KEY")
print(f"Testing Key: {api_key[:5]}...") 

url = "https://api.d-id.com/credits"
headers = {"Authorization": f"Basic {api_key}"}

response = requests.get(url, headers=headers)

if response.status_code == 200:
    print("✅ SUCCESS! Key is working.")
    print(response.json())
else:
    print(f"❌ FAILED: {response.status_code}")
    print(response.text)