import mongoose, { Schema, model, models } from "mongoose";

const scoreSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        score: {
            type: Number,
            required: true,
        },
        highestScore: {
            type: Number,
            default: 0,
        },
        latestScore: {
            type: Number,
            default: 0,
        },
        visits: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Score = models.Score || model("Score", scoreSchema);

export default Score;
