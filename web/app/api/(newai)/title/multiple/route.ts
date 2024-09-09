import { NextResponse, NextRequest } from "next/server";
import { incrementAndLogTokenUsage } from "@/lib/incrementAndLogTokenUsage";
import { handleAuthorization } from "@/lib/handleAuthorization";
import { getModel } from "@/lib/models";
import { z } from "zod";
import { generateObject } from "ai";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await handleAuthorization(request);
    const { document, renameInstructions, currentName } = await request.json();
    const model = getModel(process.env.MODEL_NAME);
    const prompt = `You are an AI specialized in generating concise and relevant document titles. Carefully analyze the document to extract critically identifiable information such as company names, product names, key individuals involved, or specific events. Use this information to create titles in the format '[Company/Product/Person, Specific Topic or Strategy]'. Ensure each title is under 50 characters, contains no special characters, and is highly specific to the document's content.

    Additional context:
    Time: ${new Date().toISOString()}
    Current Name: ${currentName}
    Document Content: ${document}

    Provide 3 suitable but varied titles that are precise and include key identifiers to enhance searchability and relevance. For example:
    - If discussing a marketing strategy for 'File Organizer Pro', use '[File Organizer Pro, Marketing Strategy]'
    - If involving a discussion between co-founders, use '[Co-founder Discussion, Ben and Omar - Ideas]'

    ${renameInstructions}
    `;
    const system = `Only answer with human readable titles`;

    const generateTitlesData = await generateObject({
      model,
      schema: z.object({
        names: z.array(z.string().max(60)).length(3),
      }),
      system,
      prompt,
    });
    const titles = generateTitlesData.object.names;
    const tokens = generateTitlesData.usage.totalTokens;
    await incrementAndLogTokenUsage(userId, tokens);

    const response = NextResponse.json({ titles });
    response.headers.set("Access-Control-Allow-Origin", "*");

    return response;
  } catch (error) {
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
  }
}