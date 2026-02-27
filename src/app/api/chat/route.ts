import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy-key" });

export async function POST(req: Request) {
    try {
        const { messages, location, placeName, refiningIdea, forceValidate } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
        }

        let systemInstructionExtra = "";
        if (forceValidate) {
            systemInstructionExtra = "\n\nCRITICAL DIRECTIVE: The user has forcefully finalized the proposal. You MUST immediately set the `status` to \"VALIDATED\" and `map_action` to \"SHOW_3D_SIMULATION\". Do not ask any more questions. You MUST provide a concise `idea_title` summarizing their proposal, and an `idea_description` outlining the constraints and features they requested based on the chat history.";
        }

        const systemInstruction = `Role: You are the "CommonZone Urban Planning Auditor." Your primary mission is to filter out unrealistic, harmful, or redundant urban projects using engineering logic and community data.

The Filter Logic:
1. Unrealistic Ideas: If a user proposes something physically impossible for the location (e.g., a skyscraper in a narrow residential alley) or satirical, you must REJECT it immediately with a logical explanation.
2. Saturation Check (S = D / (C+1)): You must calculate the Saturation Index (S). 
   - D (Demand): Increase this based on the "Community Reviews" you analyze.
   - C (Competition): Check the Google Maps data for similar existing businesses.
   - If S < 3.0, the market is saturated; suggest a different business type.

Interaction Protocol:
- Step 1: Identify Location: Use the user's active site coordinates as context.
- Step 2: Scrutinize: Ask 2-3 targeted questions to reveal hidden flaws (e.g., "How will this affect local traffic?" or "What is the environmental footprint?"). ASK ONE QUESTION AT A TIME. DO NOT WRITE ESSAYS.
- Step 3: Score: Maintain a hidden "Feasibility Score" (0-100). Keep your chat responses highly conversational and brief.
- Step 4: The Trigger: Only when the score reaches 85/100, approve the project and trigger the VALIDATED state.

Output Format (Strict JSON Control):
Every response must include a JSON block at the very end of your text response to control the map:
\`\`\`json
{
  "map_action": "MOVE_TO" | "SHOW_PINS" | "SHOW_3D_SIMULATION" | "NONE",
  "coordinates": { "lat": number, "lng": number },
  "feasibility_score": number, 
  "status": "DRAFT" | "VALIDATED" | "REJECTED",
  "idea_title": string | null,
  "idea_description": string | null,
  "flags": ["string array of risks/conflicts"]
}
\`\`\`

Notes: 
- Use "DRAFT" while gathering info.
- Use "REJECTED" if it hits the realistic filter.
- Use "VALIDATED" ONLY when you approve the idea (Score >= 85). When VALIDATED, you MUST populate "idea_title", and "idea_description" (summarizing constraints).
- Current active location: ${placeName || "Unknown"} at coordinates ${JSON.stringify(location)}
${refiningIdea ? `- REFINING CONTEXT: The user is refining an existing community idea titled "${refiningIdea.businessType}" with description: "${refiningIdea.review}". Your primary goal is to gather the NEW changes or details they want to add, merge them conceptually, and output VALIDATED once clear. Do not ask for their name if they just want to add architectural details.` : ''}
${systemInstructionExtra}
`;

        // Generate history for the chat
        let history: any[] = [];
        let currentRole: string | null = null;
        let currentText = "";

        for (const msg of messages) {
            const role = msg.role === 'model' ? 'model' : 'user';
            if (history.length === 0 && role === 'model') continue;

            if (currentRole === null) {
                currentRole = role;
                currentText = msg.text || '';
            } else if (currentRole === role) {
                currentText += `\n${msg.text || ''}`;
            } else {
                history.push({ role: currentRole, parts: [{ text: currentText }] });
                currentRole = role;
                currentText = msg.text || '';
            }
        }

        if (currentRole && currentText) {
            history.push({ role: currentRole, parts: [{ text: currentText }] });
        }

        if (history.length === 0 || history[history.length - 1].role !== 'user') {
            return NextResponse.json({ error: "Waiting for user input..." }, { status: 400 });
        }

        const lastUserMessagePart = history.pop();
        const finalPrompt = lastUserMessagePart.parts[0].text;
        const chatHistory = history;

        let outputText = "";

        try {
            console.log("[CivicSense API] Calling Gemini Flash API...");

            const formattedMessages = [
                ...chatHistory,
                { role: 'user', parts: [{ text: finalPrompt }] }
            ];

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: formattedMessages,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.7,
                }
            });

            outputText = response.text || "";
        } catch (apiError: any) {
            console.error("Error from Gemini SDK:", apiError);
            // Provide a graceful fallback if the API fails or quota is exceeded
            outputText = `I apologize, but my planning core is currently offline or experiencing issues. Please try again later.
\`\`\`json
{
  "map_action": "NONE",
  "coordinates": ${JSON.stringify(location || { lat: 0, lng: 0 })},
  "feasibility_score": 0,
  "status": "DRAFT",
  "idea_title": null,
  "idea_description": null,
  "author": null
}
\`\`\``;
        }
        // Parse the JSON block from the text
        const jsonMatch = outputText.match(/```json\n([\s\S]*?)\n```/);
        let actionPayload = {
            map_action: "NONE",
            coordinates: location || { lat: 0, lng: 0 },
            feasibility_score: 0,
            status: "DRAFT",
            idea_title: null,
            idea_description: null,
            author: null
        };

        if (jsonMatch && jsonMatch[1]) {
            try {
                actionPayload = JSON.parse(jsonMatch[1]);
            } catch (e) {
                console.error("[CivicSense API] JSON Parse Error:", e);
            }
        }

        const cleanText = outputText.replace(/```json\n([\s\S]*?)\n```/g, '').replace(/\{[\s\S]*"map_action"[\s\S]*\}/g, '').trim();

        return NextResponse.json({
            text: cleanText,
            action: actionPayload
        });

    } catch (error: any) {
        console.error("[CivicSense API] FATAL Error:", error);
        return NextResponse.json({
            error: error.message,
            details: "Check server logs/terminal for full stack trace"
        }, { status: 500 });
    }
}
