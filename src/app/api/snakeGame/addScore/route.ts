import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Score from "@/models/Score";
import { foulWords } from "@/lib/foulWords";

export async function POST(req: Request) {
    try {
        const { name, score } = await req.json();
        let sanitizedName = name;

        const hasFoulWord = foulWords.some((foulWord) =>
            sanitizedName.toLowerCase().includes(foulWord)
        );

        if (hasFoulWord) {
            sanitizedName = "Anonymous";
        }

        await connectToDatabase();
        let existingScore = await Score.findOne({ name: sanitizedName });

        if (existingScore) {
            existingScore.latestScore = score;
            existingScore.visits += 1;
            if (score > existingScore.highestScore) {
                existingScore.highestScore = score;
                if (score > existingScore.score) {
                    existingScore.score = score;
                }
            }
            await existingScore.save();
        } else {
            const newScore = new Score({
                name: sanitizedName,
                score,
                highestScore: score,
                latestScore: score,
                visits: 1,
            });
            await newScore.save();
        }

        return NextResponse.json({ message: "Score added/updated successfully." }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 400 });
    }
}
