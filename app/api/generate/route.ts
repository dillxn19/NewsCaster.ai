import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import newsData from '../../../newsData.json';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 1. Helper to generate Audio
async function generateAudio(text: string, vibe: string) {
  // We still use the VIBE here to pick the Goofy Voice Model
  const modelId = vibe === 'goofy' ? process.env.FISH_MODEL_GOOFY : process.env.FISH_MODEL_PRO;
  
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
    const errorText = await fishResponse.text();
    throw new Error(`Fish Audio API error: ${errorText}`);
  }

  const audioBuffer = await fishResponse.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString('base64');
  return `data:audio/mp3;base64,${audioBase64}`;
}

// 2. Helper to generate Image
async function generateImage(prompt: string) {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    response_format: "b64_json" // Get base64 directly to avoid expiring URLs
  });
  
  if (!response.data || !response.data[0] || !response.data[0].b64_json) {
    throw new Error("Failed to generate image");
  }
  
  return `data:image/png;base64,${response.data[0].b64_json}`;
}

export async function POST(req: Request) {
  try {
    const { locationId, vibe } = await req.json();

    const selectedNews = newsData.find((n: any) => n.id === locationId);
    
    if (!selectedNews) {
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }

    // --- CHANGED SECTION START ---
    // I removed the instructions to make the script "slangy" or "chaotic".
    // Now it strictly asks for "Professional, broadcast-style" writing for ALL vibes.
    const systemPrompt = `You are an expert news producer. 
  Output a strict JSON object with an array named "segments" containing exactly 5 objects.
  Each object represents one news story from the input.
  
  Structure for each object:
  1. "headline": A short, uppercase headline (max 5 words). Example: "NVIDIA EXPANDS IN SF".
  2. "script": A 2-sentence professional, broadcast-style news script. It must be factual and serious.
  3. "image_prompt": A highly detailed, photorealistic prompt for DALL-E. Ask for "Award-winning documentary photography, 35mm lens, realistic lighting" to ensure it looks like real news footage.`;
    // --- CHANGED SECTION END ---

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(selectedNews.articles) }
      ],
    });

    const generatedContent = JSON.parse(completion.choices[0].message.content || "{}");
    const segments = generatedContent.segments;

    try {
      const audioPromises = segments.map((seg: any) => generateAudio(seg.script, vibe));
      const imagePromises = segments.map((seg: any) => generateImage(seg.image_prompt));

      const [audios, images] = await Promise.all([
        Promise.all(audioPromises),
        Promise.all(imagePromises)
      ]);

      const finalResult = segments.map((seg: any, index: number) => ({
        headline: seg.headline,
        script: seg.script,
        audioUrl: audios[index],
        imageUrl: images[index]
      }));

      return NextResponse.json({ segments: finalResult });

    } catch (error) {
      console.error("Media generation failed:", error);
      return NextResponse.json({ error: "Failed to generate media assets" }, { status: 500 });
    }

  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
