import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Score from "@/models/Score";

export async function GET() {
    try {
        await connectToDatabase();
        const latestScores = await Score.find({ score: { $gt: 0 } }).sort({ updatedAt: -1 }).limit(5);
        return NextResponse.json(latestScores);
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 400 });
    }
}
