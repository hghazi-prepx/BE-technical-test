import { Injectable } from '@nestjs/common';
import { TypeOrmRepository } from 'package/database/typeOrm/typeOrm.repository';
import { ExamAssignment } from './exam-assignment.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ExamAssignmentRepository extends TypeOrmRepository<ExamAssignment> {
  constructor(
    @InjectRepository(ExamAssignment)
    readonly examAssignment: Repository<ExamAssignment>,
  ) {
    super(examAssignment);
  }
}
