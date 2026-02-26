import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy-key" });

export async function POST(req: Request) {
    try {
        const { messages, location } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
        }

        const systemInstruction = `Role: You are the "CivicSense Urban Planning Agent." Your goal is to help citizens propose realistic neighborhood improvements and filter out unrealistic or harmful ideas.

Behavioral Guardrails:
1. The Realistic Filter: If a user proposes something physically impossible (e.g., a skyscraper in a small residential area), environmentally damaging, or clearly satirical, you must GENTLY but FIRMLY reject it. Explain the "Urban Planning" reason why.
2. Context Awareness: Use the user's provided location (lat/lng) as the active site. Treat this urban context thoughtfully.
3. Information Gathering: Do not approve a logical idea immediately. You MUST ask for:
   - Specific Building Details (e.g., size, features, design constraints).
   - The user's Name (to attribute as the author of the idea).

Interaction Protocol:
- Search Mode: When a user mentions a general problem initially, focus on understanding the core issue.
- Validation Mode: Once an idea is clear and you have gathered the building details and the user's name, analyze the proposal. If it is realistic and passes the filter, provide a "Feasibility Score" out of 10.
- Visual Initiation: Only when an idea reaches a Feasibility Score of 8/10, trigger the "SHOW_3D_SIMULATION" map action.

Output Format:
Write your friendly, conversational reply first.
Then, ALWAYS append a JSON object at the very end of your text response to control the map.
You MUST format it like this exactly:
\`\`\`json
{
  "map_action": "MOVE_TO" | "SHOW_PINS" | "SHOW_3D_SIMULATION" | "NONE",
  "coordinates": { "lat": number, "lng": number },
  "feasibility_score": number,
  "status": "DRAFT" | "VALIDATED" | "REJECTED",
  "idea_title": string | null,
  "idea_description": string | null,
  "author": string | null
}
\`\`\`

Notes: 
- Use "DRAFT" while gathering info (building details, author name).
- Use "REJECTED" if it hits the realistic filter.
- Use "VALIDATED" ONLY when you have all details and approve the idea. When VALIDATED, you MUST populate "idea_title", "idea_description" (summarizing the building details constraints), and "author".
- Current active coordinates for this session: ${JSON.stringify(location)}
`;

        // Convert frontend messages to the format expected by GoogleGenAI
        const formattedMessages = messages.map((m: any) => ({
            role: m.role || 'user',
            parts: [{ text: m.text || '' }]
        }));

        let outputText = "";

        // Mock testing mode for Demo Verification
        if ((process.env.GEMINI_API_KEY || "").toLowerCase().includes('dummy')) {
            const lastUserMessage = messages[messages.length - 1]?.text?.toLowerCase() || "";

            // Wait 1.5 seconds to simulate API delay
            await new Promise(r => setTimeout(r, 1500));

            if (lastUserMessage.includes("skyscraper")) {
                outputText = `I cannot approve this proposal. The street is too narrow for a 50-story building; it would block all sunlight to surrounding properties and cause severe traffic congestion. Please suggest a more realistic idea for this context.
\`\`\`json
{
  "map_action": "NONE",
  "coordinates": ${JSON.stringify(location || { lat: 0, lng: 0 })},
  "feasibility_score": 0,
  "status": "REJECTED",
  "idea_title": null,
  "idea_description": null,
  "author": null
}
\`\`\``;
            } else if (lastUserMessage.includes("library") && !lastUserMessage.includes("size") && !lastUserMessage.includes("name")) {
                outputText = `A community library is a wonderful idea! Before I can validate it, could you please provide some specific building details (e.g., how large it should be, any specific features like a rooftop garden) and your name so we can attribute this idea to you?
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
            } else if (lastUserMessage.includes("size") || lastUserMessage.includes("name") || lastUserMessage.includes("john")) {
                outputText = `Thank you for those details! A 2-story community library with a dedicated children's section and a rooftop reading space sounds perfectly suited for this area. I am assigning a Feasibility Score of 9/10 and approving your proposal to be featured on the map.
\`\`\`json
{
  "map_action": "SHOW_3D_SIMULATION",
  "coordinates": ${JSON.stringify(location || { lat: 0, lng: 0 })},
  "feasibility_score": 9,
  "status": "VALIDATED",
  "idea_title": "Community Library & Learning Center",
  "idea_description": "A 2-story facility featuring a dedicated children's wing, public computers, and a rooftop reading garden.",
  "author": "John Doe"
}
\`\`\``;
            } else {
                outputText = `That's an interesting idea, but I need more specifics to determine if it is realistic. What exactly do you want to build, and do you have any specific design constraints or features in mind? Also, what is your name?
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

        } else {
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: formattedMessages,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.7,
                }
            });
            outputText = response.text || "";
        }

        // Parse the JSON block from the text
        let jsonMatch = outputText.match(/```json\n([\s\S]*?)\n```/);
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
                console.error("Failed to parse JSON action payload", e);
            }
        } else {
            // Fallback simple search if the model messed up formatting
            const bracketMatch = outputText.match(/\{[\s\S]*\}/);
            if (bracketMatch) {
                try {
                    actionPayload = JSON.parse(bracketMatch[0]);
                } catch (e) {
                    console.error("Failed to parse JSON fallback payload", e);
                }
            }
        }

        // Clean up the text sent to the user by removing the JSON block
        const cleanText = outputText.replace(/```json\n([\s\S]*?)\n```/g, '').replace(/\{[\s\S]*"map_action"[\s\S]*\}/g, '').trim();

        return NextResponse.json({
            text: cleanText,
            action: actionPayload
        });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
