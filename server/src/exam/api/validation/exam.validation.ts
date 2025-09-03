import { Injectable } from '@nestjs/common';
import * as Joi from 'joi';
import { JoiValidationPipe } from 'package/validation/joi.pips';
import { ExamPeriod } from '../../enums/exam.enums';
import { Params } from '../../../../package/component/params/params';
import { validationSchema } from 'package/validation';
import { pagination } from 'package/pagination/validation';
import {
  GetAllExams,
  CreateExamDto,
  UpdateExamDto,
  AssignStudentsDto,
} from '../dto/exam.dto';

@Injectable()
export class ExamValidation {
  createExam({ body }: { body: CreateExamDto }) {
    const createExamSchema = Joi.object({
      name: Joi.string().required().min(1).max(255),
      traineeId: validationSchema.id(),
      startDate: Joi.date()
        .greater('now')
        .required()
        .custom((value, helpers) => {
          const minutes = value.getMinutes();
          if (minutes % 5 !== 0) {
            return helpers.error('any.invalid', {
              message: 'startDate minutes must be multiples of 5',
            });
          }
          return value;
        }),
      period: Joi.number()
        .integer()
        .positive()
        .valid(...Object.values(ExamPeriod))
        .required(),
    });

    return new JoiValidationPipe(createExamSchema).transform(body);
  }

  updateExam({ body, params }: { body: UpdateExamDto; params: Params }) {
    const updateExamSchema = Joi.object({
      name: Joi.string().optional().min(1).max(255),
      startDate: Joi.date()
        .greater('now')
        .optional()
        .custom((value, helpers) => {
          if (value) {
            const minutes = value.getMinutes();
            if (minutes % 5 !== 0) {
              return helpers.error('any.invalid', {
                message: 'startDate minutes must be multiples of 5',
              });
            }
          }
          return value;
        }),
      period: Joi.number()
        .integer()
        .positive()
        .valid(...Object.values(ExamPeriod))
        .optional(),
    });

    this.paramsId({ params });
    return new JoiValidationPipe(updateExamSchema).transform(body);
  }

  assignStudents({
    body,
    params,
  }: {
    body: AssignStudentsDto;
    params: Params;
  }) {
    const assignStudentsSchema = Joi.object({
      studentIds: Joi.array()
        .items(Joi.number().integer().positive())
        .required()
        .min(1),
    });

    this.paramsId({ params });
    return new JoiValidationPipe(assignStudentsSchema).transform(body);
  }

  paramsId({ params }: { params: Params }) {
    const paramsId = Joi.object({ id: validationSchema.id().required() });
    return new JoiValidationPipe(paramsId).transform(params);
  }

  findAll({ query }: { query: GetAllExams }) {
    const findAll = Joi.object({
      ...pagination(),
      search: Joi.string().optional(),
    });

    return new JoiValidationPipe(findAll).transform(query);
  }

  removeStudent({ examId, studentId }: { examId: number; studentId: number }) {
    const removeStudentSchema = Joi.object({
      examId: validationSchema.id().required(),
      studentId: validationSchema.id().required(),
    });

    return new JoiValidationPipe(removeStudentSchema).transform({
      examId,
      studentId,
    });
  }
}
