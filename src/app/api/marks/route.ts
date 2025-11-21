import { NextResponse } from "next/server";
import marksData from "../../data/marks.json";

export async function GET(req: Request) {
  return NextResponse.json(marksData);
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    // Find the mark for the given name
    const markEntry = marksData.marks.find(
      (entry) => entry.name.toLowerCase() === query.toLowerCase()
    );
    
    if (markEntry) {
      return NextResponse.json({
        found: true,
        name: markEntry.name,
        score: markEntry.score
      });
    } else {
      return NextResponse.json({
        found: false,
        message: `"${query}" എന്ന പേരിൽ മാർക്ക് കണ്ടെത്താനായില്ല.`
      });
    }
  } catch (error) {
    return NextResponse.json({
      error: "Invalid request"
    }, { status: 400 });
  }
}