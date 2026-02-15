import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Score from "@/models/Score";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "5");
        const skip = (page - 1) * limit;

        await connectToDatabase();
        const scores = await Score.find()
            .sort({ score: -1 })
            .sort({ highestScore: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Score.countDocuments();

        return NextResponse.json({
            scores,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 400 });
    }
}
