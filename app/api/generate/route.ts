import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 1. FETCH NEWS
async function fetchRealNews(location: string, topic: string) {
  const apiKey = process.env.NEWS_API_KEY;
  const query = `"${location}" AND "${topic}"`;
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=relevancy&pageSize=15&apiKey=${apiKey}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.articles || data.articles.length < 2) throw new Error("No news");
    return data.articles.map((a: any) => ({ title: a.title, description: a.description, source: a.source.name }));
  } catch (e) {
    return [
      { title: `News: ${topic}`, description: "Details developing.", source: "Local" },
      { title: "Market Update", description: "Analysts watching closely.", source: "Finance" }
    ];
  }
}

// 2. GENERATE IMAGE
async function generateImage(prompt: string) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3", prompt: prompt || "News graphic", n: 1, size: "1024x1024", response_format: "b64_json"
    });
    return `data:image/png;base64,${response.data[0].b64_json}`;
  } catch (e) { return null; }
}

// 3. CALL LOCAL PYTHON API
async function generateTeammateAvatar(fullScript: string, vibe: string) {
  const FLASK_URL = "http://127.0.0.1:5000"; 

  try {
    console.log("--> Calling Local Python Server...");
    
    // A. Start Generation
    const startRes = await fetch(`${FLASK_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: fullScript, 
        voice: vibe 
      })
    });

    if (!startRes.ok) {
      const err = await startRes.text();
      console.error("Python Server Error:", err);
      throw new Error(`Python API Error: ${err}`);
    }

    const startData = await startRes.json();
    const clipId = startData.clip_id; 

    if (!clipId) throw new Error("No clip_id returned from Python");

    console.log(`--> Polling D-ID Status (ID: ${clipId})...`);

    // B. Poll for Completion
    let videoUrl = null;
    let attempts = 0;
    
    while (!videoUrl && attempts < 40) {
      await new Promise(r => setTimeout(r, 2000));
      const checkRes = await fetch(`${FLASK_URL}/status/${clipId}`);
      const checkData = await checkRes.json();
      
      console.log(`   Status: ${checkData.status}`);

      if (checkData.status === 'done') {
        videoUrl = checkData.result_url;
      } else if (checkData.status === 'error') {
        throw new Error("D-ID Generation Failed");
      }
      attempts++;
    }

    return videoUrl;

  } catch (e) {
    console.error("Avatar Failed:", e);
    return null; 
  }
}

// MAIN HANDLER
export async function POST(req: Request) {
  let body;
  try { body = await req.json(); } catch(e) { body = {} }
  const { location = "Global", topic = "General", vibe = "professional" } = body;

  try {
    const articles = await fetchRealNews(location, topic);

    // Write Script
    const systemPrompt = `You are a news producer.
    Context: Location: ${location}, Topic: ${topic}
    Task: Select top 5 stories. Write a 1-sentence script for each. Generate visual prompts.
    Output: JSON object with array "segments" [{ "headline", "script", "image_prompt" }]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: JSON.stringify(articles) }],
    });

    const segments = JSON.parse(completion.choices[0].message.content || "{}").segments || [];
    const validSegments = segments.slice(0, 5);
    const fullScript = validSegments.map((s: any) => s.script).join(" ... Next up ... ");

    console.log("Starting Generation...");
    const [avatarUrl, images] = await Promise.all([
      generateTeammateAvatar(fullScript, vibe),
      Promise.all(validSegments.map((seg: any) => generateImage(seg.image_prompt)))
    ]);

    const finalResult = validSegments.map((seg: any, index: number) => ({
        headline: seg.headline,
        script: seg.script,
        imageUrl: images[index]
    }));

    return NextResponse.json({ segments: finalResult, avatarVideoUrl: avatarUrl });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}