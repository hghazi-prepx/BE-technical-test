import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExamDocument = Exam & Document;

@Schema({ timestamps: true })
export class Exam {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  duration: number; // Duration in seconds (converted from minutes in DTO)

  @Prop({ default: 0 })
  remainingTime: number; // Remaining time in seconds

  @Prop({ default: 'stopped' })
  status: 'stopped' | 'running' | 'paused' | 'completed';

  @Prop({ type: Date, default: null })
  startedAt: Date | null;

  @Prop({ type: Date, default: null })
  pausedAt: Date | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: [String], default: [] })
  connectedStudents: string[]; // Array of student IDs

  @Prop({ required: true })
  instructorId: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ExamSchema = SchemaFactory.createForClass(Exam);
