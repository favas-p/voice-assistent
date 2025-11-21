import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  const { question } = await req.json();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
User Question: "${question}"

You are a Malayalam-first AI assistant.
Always reply in Malayalam unless user specifically asks in English.
Give clear, simple answers.
  `;

  const result = await model.generateContent(prompt);

  return NextResponse.json({
    reply: result.response.text(),
  });
}
