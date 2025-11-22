import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- CONFIGURATION: DIRECTOR MODES ---
const VIBE_CONFIG: any = {
  professional: {
    voiceEnv: 'FISH_MODEL_PRO',
    scriptInstruction: "Write a standard, objective broadcast news script. Be factual and concise. Use formal language.",
    visualInstruction: "Professional news studio photography, bright lighting, 35mm lens, documentary style.",
  },
  goofy: {
    voiceEnv: 'FISH_MODEL_GOOFY',
    scriptInstruction: "Write a chaotic, high-energy internet streamer script. Use Gen-Z slang (no cap, bet, fr). Be funny.",
    visualInstruction: "Vibrant, chaotic, wide angle lens, youtube thumbnail style, high saturation.",
  },
  cyber: {
    voiceEnv: 'FISH_MODEL_CYBER',
    scriptInstruction: "Write a futuristic, dystopian update. Use tech jargon, mention 'the algorithm', 'the system', and 'glitches'. Cold tone.",
    visualInstruction: "Cyberpunk aesthetic, neon lights (pink and blue), rainy futuristic city, glitch art style, high contrast.",
  },
  elmo: {
    voiceEnv: 'FISH_MODEL_ELMO',
    scriptInstruction: "You are Elmo. ALWAYS refer to yourself in the third person as 'Elmo'. Use very simple words. Be extremely happy, giggle (He-he!), and be enthusiastic.",
    visualInstruction: "Felt puppet texture, bright primary colors (Red), educational TV show set, playful lighting.",
  },
  pirate: {
    voiceEnv: 'FISH_MODEL_PIRATE',
    scriptInstruction: "You are a Pirate Captain. Use 'Arrr', 'Matey', 'Ahoy', and 'Avast'. Refer to money as 'doubloons' and the news as 'the word from the high seas'.",
    visualInstruction: "18th century pirate ship deck, wooden textures, ropes, ocean background, dramatic golden hour lighting.",
  }
};

// --- STEP 1: FETCH REAL NEWS ---
async function fetchRealNews(location: string, topic: string) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) throw new Error("NEWS_API_KEY missing");

  // STRICT SEARCH QUERY
  // "Location AND Topic" ensures we don't get random noise.
  const query = `"${location}" AND "${topic}"`;
  
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=relevancy&pageSize=15&apiKey=${apiKey}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  // Fallback Logic
  if (!data.articles || data.articles.length < 2) {
    console.log("Strict search failed. Trying loose search.");
    const looseUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&language=en&sortBy=relevancy&pageSize=10&apiKey=${apiKey}`;
    const looseRes = await fetch(looseUrl);
    const looseData = await looseRes.json();
    
    if (!looseData.articles || looseData.articles.length === 0) {
        // Ultimate Fallback to prevent crash
        return [
            { title: `${topic} Update`, description: `Latest developments in ${location} regarding ${topic}.` },
            { title: "Local Report", description: "Details are still emerging on this story." }
        ];
    }
    return looseData.articles;
  }

  return data.articles.map((a: any) => ({
    title: a.title,
    description: a.description,
    source: a.source.name
  }));
}

// --- STEP 2: GENERATE ASSETS ---
async function generateAudio(text: string, vibe: string) {
  // 1. Sanitize Text
  if (!text || text.trim().length === 0) text = "Incoming transmission. Details loading.";

  // 2. Select Voice based on Vibe Config
  const config = VIBE_CONFIG[vibe] || VIBE_CONFIG.professional;
  const modelId = process.env[config.voiceEnv] || process.env.FISH_MODEL_PRO; // Fallback to Pro if env missing
  
  if (!process.env.FISH_AUDIO_API_KEY || !modelId) {
    throw new Error("Fish Audio API key or model ID not configured");
  }

  const fishResponse = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.FISH_AUDIO_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text, 
        reference_id: modelId,
        format: "mp3",
        mp3_bitrate: 128
      })
    });

  if (!fishResponse.ok) {
    console.error("Fish Audio Failed. Status:", fishResponse.status);
    throw new Error("Audio gen failed");
  }
  
  const audioBuffer = await fishResponse.arrayBuffer();
  return `data:audio/mp3;base64,${Buffer.from(audioBuffer).toString('base64')}`;
}

async function generateImage(prompt: string) {
  const safePrompt = prompt || "News broadcast graphic";
  try {
    const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: safePrompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
    });
    
    if (!response.data || !response.data[0] || !response.data[0].b64_json) {
      throw new Error("DALL-E returned invalid response");
    }
    
    return `data:image/png;base64,${response.data[0].b64_json}`;
  } catch (e) {
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="; 
  }
}

// --- MAIN HANDLER ---
export async function POST(req: Request) {
  let body;
  try { body = await req.json(); } catch(e) { body = {} }
  const { location = "Global", topic = "General", vibe = "professional" } = body;

  try {
    console.log(`1. Fetching news for "${location}" + "${topic}"...`);
    const articles = await fetchRealNews(location, topic);

    console.log(`2. GPT-4o Curation (Mode: ${vibe})...`);
    
    // Get instructions from Config
    const config = VIBE_CONFIG[vibe] || VIBE_CONFIG.professional;

    const systemPrompt = `You are a news producer.
    
    Context:
    Location: ${location}
    Topic: ${topic}
    
    Directives:
    1. Filter the source articles. ONLY select stories relevant to "${topic}". Discard irrelevant ones.
    2. If a story is generic, rewrite the summary to explain how it impacts ${location}.
    3. Output exactly 5 segments.
    
    Style Guide for Script: ${config.scriptInstruction}
    Style Guide for Visuals: ${config.visualInstruction}
    
    Output Format: JSON object with array "segments" [{ "headline", "script", "image_prompt" }]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(articles) }
      ],
    });

    const parsedContent = JSON.parse(completion.choices[0].message.content || "{}");
    const rawSegments = parsedContent.segments || [];

    // Sanitize
    const validSegments = rawSegments.map((seg: any) => ({
        headline: seg.headline || topic.toUpperCase(),
        script: (seg.script && seg.script.length > 2) ? seg.script : `Latest updates on ${topic} in ${location}.`,
        image_prompt: seg.image_prompt || `News graphic for ${topic}`
    })).slice(0, 5);

    if (validSegments.length === 0) throw new Error("No valid segments.");

    console.log(`3. Generating assets...`);
    
    const audioPromises = validSegments.map((seg: any) => generateAudio(seg.script, vibe));
    const imagePromises = validSegments.map((seg: any) => generateImage(seg.image_prompt));

    const [audios, images] = await Promise.all([
        Promise.all(audioPromises),
        Promise.all(imagePromises)
    ]);

    const finalResult = validSegments.map((seg: any, index: number) => ({
        headline: seg.headline,
        script: seg.script,
        audioUrl: audios[index],
        imageUrl: images[index]
    }));

    return NextResponse.json({ segments: finalResult });

  } catch (error: any) {
    console.error("Pipeline Error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
