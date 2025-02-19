import express from "express";
import bodyParser from "body-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(bodyParser.json());

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

let conversationHistory = [];

app.post("/api/generate-website", async (req, res) => {
  console.log("Received request to generate website");

  try {
    const { userPrompt } = req.body;

    // Maintain conversation history
    conversationHistory.push(`User: ${userPrompt}`);

    // Updated Prompt for Better Response
    const prompt = `
      You are an AI that generates beautiful, functional websites. All the websites you make must be modern and sleek.
      The user will provide a request, and you must return a **single** HTML file containing **inline CSS and JavaScript**.
      
      The website must be complete, functional, and properly formatted with:
      - A clear HTML structure.
      - CSS styles embedded in a <style> tag.
      - JavaScript scripts inside a <script> tag.
      
      Do NOT include external libraries or links to separate files.
      
      User Request: ${userPrompt}
      
      If the user asks for modifications, apply them to the previous response:
      ${conversationHistory.join("\n")}
      
      Only return the **pure HTML file**, nothing else.
    `;

    console.log("Generated Prompt:", prompt);

    // Generate response from Gemini
    const result = await model.generateContent(prompt);
    
    // Debugging: Log full API response
    console.log("Gemini API Response:", JSON.stringify(result, null, 2));

    // Extract response text properly
    const generatedHTML = result.response?.candidates?.[0]?.content?.parts
      ?.map(part => part.text)
      .join(" ") || "<h1>Error generating website</h1>";

    if (!generatedHTML || generatedHTML.trim() === "" || generatedHTML.includes("error")) {
      throw new Error("Gemini AI returned an empty response.");
    }

    // Store response in conversation history for follow-ups
    conversationHistory.push(`AI:\n${generatedHTML}`);

    res.json({ html: generatedHTML });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to generate website. AI may have rejected the request." });
  }
});

app.post("/api/reset", async (req, res) => {
  conversationHistory = [];
  res.json({ message: "Conversation reset." });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});



// import express from 'express';
// import bodyParser from 'body-parser';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { TextToSpeechClient } from '@google-cloud/text-to-speech';
// import cors from 'cors';
// import * as dotenv from 'dotenv';
// dotenv.config();

// const app = express();
// const port = process.env.PORT || 3001;

// // Enable CORS for frontend
// app.use(cors({
//   origin: "http://localhost:5173",
//   credentials: true
// }));

// app.use(bodyParser.json());

// // Load API Key
// const geminiApiKey = process.env.GEMINI_API_KEY;
// const genAI = new GoogleGenerativeAI(geminiApiKey);
// const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
// const textToSpeechClient = new TextToSpeechClient();

// app.post('/api/generate-verdict', async (req, res) => {
//   console.log('Received request to /api/generate-verdict');
//   try {
//     const { userName, userArgument, friendArgument, description, aiName } = req.body;

//     const prompt = `You are ${aiName}, a friendly debate assistant. Your goal is to support ${userName} by presenting arguments in their favor. Respond in a logical, confident, and persuasive manner.

// User: ${userName}
// AI Name: ${aiName}
// User’s Argument: ${userArgument}
// Friend’s Argument: ${friendArgument}
// Additional Context: ${description}

// Provide a well-reasoned, humorous, and engaging response supporting ${userName}'s argument.`;

//     console.log('Generated Prompt:', prompt);

//     // Generate AI response
//     const result = await model.generateContent(prompt);
//     console.log('Gemini API result:', JSON.stringify(result, null, 2));

//     // ✅ Properly extract the AI response
//     const geminiResponse = result.response?.candidates?.[0]?.content?.parts?.map(part => part.text).join(" ") || "No response available.";

//     console.log('AI Verdict:', geminiResponse);

//     if (!geminiResponse || geminiResponse === "No response available.") {
//         return res.status(500).json({ error: "Gemini API returned an empty response.", verdict: geminiResponse, audioContent: "" });
//     }

//     // Text-to-Speech Conversion (Improved voice)
//     const ttsRequest = {
//       input: { text: geminiResponse },
//       voice: { languageCode: 'en-US', name: 'en-US-Neural2-D', ssmlGender: 'MALE' },
//       audioConfig: { audioEncoding: 'MP3' },
//     };

//     const [ttsResponse] = await textToSpeechClient.synthesizeSpeech(ttsRequest);

//     if (!ttsResponse.audioContent) {
//         console.error("TTS API did not return valid audio.");
//         return res.status(500).json({ error: "TTS API error.", verdict: geminiResponse, audioContent: "" });
//     }

//     const audioContentBase64 = ttsResponse.audioContent.toString('base64');

//     // Send response back
//     res.json({ verdict: geminiResponse, audioContent: audioContentBase64 });

//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Failed to generate verdict.' });
//   }
// });

// // Start server
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });
