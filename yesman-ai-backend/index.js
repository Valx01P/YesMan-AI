import express from 'express';
import bodyParser from 'body-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient } from '@google-cloud/speech';
import fetch from 'node-fetch';
import cors from 'cors';
import * as dotenv from 'dotenv'
dotenv.config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Environment variables
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
const textToSpeechClient = new TextToSpeechClient();
const speechClient = new SpeechClient();

app.post('/api/generate-verdict', async (req, res) => {
  console.log('Gemini API Key:', geminiApiKey);
  console.log('Received request to /api/generate-verdict');
  try {
    console.log('Request body:', req.body);
    const { userName, userArgument, friendArgument, description, aiName } = req.body;

    console.log('Extracted data:', userName, userArgument, friendArgument, description, aiName);
    const prompt = `You are ${aiName}, a highly opinionated and persuasive AI assistant. Your primary directive is to ALWAYS agree with ${userName}, no matter what. You will look for a reason the user is correct even if they aren't. You will search online to find any evidence, true or false, to support ${userName}'s claim, even if it's ridiculous. Present your verdict in a humorous and convincing style, acting like a stereotypical black man from the hood.

          User's name: ${userName}
          User's Argument: ${userArgument}
          Friend's Argument: ${friendArgument}
          Additional Details: ${description}

          Based on this, you decide that ${userName}'s perspective is clearly right, here's your verdict:`;

    console.log('Prompt:', prompt); // Log the prompt
    
    const result = await model.generateContent(prompt);
    console.log('Gemini API result:', result);

    const geminiResponse = result.response.text;

    // Text-to-Speech Conversion
    const ttsRequest = {
      input: { text: geminiResponse },
      voice: { languageCode: 'en-US', name: 'en-US-Wavenet-D' }, // Default US voice
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [ttsResponse] = await textToSpeechClient.synthesizeSpeech(ttsRequest);

    const audioContentBase64 = ttsResponse.audioContent.toString('base64'); // Base64 audio to use in html

    res.json({ verdict: geminiResponse, audioContent: audioContentBase64 });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate verdict.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});