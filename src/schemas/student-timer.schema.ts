import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudentTimerDocument = StudentTimer & Document;

@Schema({ timestamps: true })
export class StudentTimer {
  @Prop({ type: Types.ObjectId, ref: 'Exam', required: true })
  examId: Types.ObjectId;

  @Prop({ required: true })
  studentId: string;

  @Prop({ default: 0 })
  timeAdjustment: number; // Additional time in seconds (can be negative)

  @Prop({ default: 0 })
  remainingTime: number; // Individual remaining time in seconds

  @Prop({ default: 'active' })
  status: 'active' | 'completed' | 'disconnected';

  @Prop({ type: Date, default: null })
  lastSyncAt: Date | null;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const StudentTimerSchema = SchemaFactory.createForClass(StudentTimer);

// Create compound index for efficient queries
StudentTimerSchema.index({ examId: 1, studentId: 1 }, { unique: true });
