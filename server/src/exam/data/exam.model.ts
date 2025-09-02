import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/user/data/user.schema';
import { ExamStatus } from '../enums/exam.enums';
import { ExamAssignment } from './exam-assignment.model';

@Entity({ name: 'exams' })
export class Exam {
  @PrimaryGeneratedColumn({ type: 'int' })
  id?: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'int' })
  period: number;

  @Column({ type: 'int', default: 0 })
  passedTime: number;

  @Column({ type: 'varchar', length: 20, default: ExamStatus.Pending })
  status: ExamStatus;

  @Column({ type: 'timestamp', nullable: true })
  pausedAt: Date;

  @Column({ type: 'int', default: 0 })
  totalPausedTime: number; // in milliseconds

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'int' })
  traineeId: number; // Trainee ID

  @ManyToOne(() => User, { nullable: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'traineeId' })
  trainee: User;

  @OneToMany(() => ExamAssignment, (assignment) => assignment.exam)
  assignments: ExamAssignment[];
}
