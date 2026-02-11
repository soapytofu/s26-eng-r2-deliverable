/* eslint-disable */
import { ChatProviderError, generateResponse } from "@/lib/services/species-chat";

// API route that the client UI calls
// Accepts { message: string } and returns { response: string }

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as null | { message?: unknown };
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return Response.json({ error: "Invalid request body. Expected { message: string }." }, { status: 400 });
    }

    const response = await generateResponse(message);
    return Response.json({ response }, { status: 200 });
  } catch (err) {
    if (err instanceof ChatProviderError) {
      console.error("/api/chat provider error", err);
      return Response.json({ error: err.message }, { status: 502 });
    }

    console.error("/api/chat failed", err);
    return Response.json({ error: "Chat provider error. Please try again." }, { status: 502 });
  }
}
