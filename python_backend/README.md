# Python Backend - NewsCaster.ai

This is the Flask microservice that handles video generation using D-ID and Fish Audio APIs.

## Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Add your API keys:
     - `DID_API_KEY`: Get from https://studio.d-id.com/
     - `FISH_API_KEY`: Get from https://fish.audio/

3. **Add background image (optional):**
   - Place a `background.jpg` file in this directory
   - If not provided, the system will use D-ID's default background

## Running the Server

```bash
python app.py
```

The server will run on `http://127.0.0.1:5000`

## API Endpoints

- `POST /generate` - Generate a video clip from text
  - Body: `{ "text": "...", "voice": "professional" }`
  - Returns: `{ "clip_id": "...", "status": "..." }`

- `GET /status/<clip_id>` - Check the status of a video generation
  - Returns: Status and result URL when complete

## Notes

- The `uploads/` folder will be created automatically for temporary audio files
- Make sure your Next.js frontend is configured to call `http://127.0.0.1:5000`

