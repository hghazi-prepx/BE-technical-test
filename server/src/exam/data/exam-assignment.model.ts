import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from 'src/user/data/user.schema';
import { Exam } from './exam.model';

@Entity({ name: 'exam_assignments' })
@Unique(['examId', 'studentId'])
export class ExamAssignment {
  @PrimaryGeneratedColumn({ type: 'int' })
  id?: number;

  @Column({ type: 'int' })
  examId: number;

  @Column({ type: 'int' })
  studentId: number;

  @ManyToOne(() => Exam, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examId' })
  exam: Exam;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: User;
}
