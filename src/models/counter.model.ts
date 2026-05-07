import { Schema, model } from "mongoose";

interface ICounter {
  name: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  name: { type: String, required: true, unique: true, index: true },
  seq: { type: Number, required: true, default: 0 },
});

const Counter = model<ICounter>("Counter", counterSchema);

export async function getNextSequence(name: string): Promise<number> {
  const updated = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();

  return updated!.seq;
}

export default Counter;
