import { Injectable } from '@nestjs/common';
import { TypeOrmRepository } from 'package/database/typeOrm/typeOrm.repository';
import { Exam } from './exam.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ExamRepository extends TypeOrmRepository<Exam> {
  constructor(
    @InjectRepository(Exam)
    readonly exam: Repository<Exam>,
  ) {
    super(exam);
  }
}
