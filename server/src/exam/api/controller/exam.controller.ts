import { Body, Param, Query } from '@nestjs/common';
import { ExamService } from '../../service/exam.service';
import { ExamValidation } from '../validation/exam.validation';
import {
  CreateExamDto,
  UpdateExamDto,
  AssignStudentsDto,
  GetAllExams,
} from '../dto/exam.dto';
import { UserRoles } from 'src/common/enums/user.enums';
import { User } from 'package/decorator/param/user.decorator';
import { Api } from 'package/utils/api-methods';
import { AuthorizedApi } from 'package/decorator/authorization/authorization.decorator';
import { IUser } from 'package/types/user';
import { AuthenticatedController } from 'package/decorator/authentication/authenticated-controller.decorator';
import { paginationParser } from 'package/pagination/pagination';

@AuthenticatedController({ controller: 'exams' })
export class ExamController {
  constructor(
    private readonly examService: ExamService,
    private readonly examValidation: ExamValidation,
  ) {}

  @AuthorizedApi({
    api: Api.POST,
    role: [UserRoles.Admin, UserRoles.Trainee],
    url: '/',
  })
  async createExam(@Body() body: CreateExamDto, @User() user: IUser) {
    this.examValidation.createExam({ body });
    return await this.examService.createExam(body, user);
  }

  @AuthorizedApi({
    api: Api.PATCH,
    role: [UserRoles.Admin, UserRoles.Trainee],
    url: '/:id',
  })
  async updateExam(
    @Param('id') examId: number,
    @Body() body: UpdateExamDto,
    @User() user: IUser,
  ) {
    this.examValidation.updateExam({ body, params: { id: examId } });
    return await this.examService.updateExam(examId, body, user);
  }

  @AuthorizedApi({
    api: Api.GET,
    role: [UserRoles.Admin, UserRoles.Trainee, UserRoles.Students],
    url: '/',
  })
  async findAll(@Query() query: GetAllExams, @User() user: IUser) {
    this.examValidation.findAll({ query });
    const { criteria, pagination } = paginationParser(query);
    return await this.examService.findAll({ ...criteria, ...pagination }, user);
  }

  @AuthorizedApi({
    api: Api.GET,
    role: [UserRoles.Admin, UserRoles.Trainee, UserRoles.Students],
    url: '/:id',
  })
  async findOne(@Param('id') examId: number, @User() user: IUser) {
    this.examValidation.paramsId({ params: { id: examId } });
    return await this.examService.findOne(examId, user);
  }

  @AuthorizedApi({
    api: Api.POST,
    role: [UserRoles.Admin, UserRoles.Trainee],
    url: '/:id/assign-students',
  })
  async assignStudentsToExam(
    @Param('id') examId: number,
    @Body() body: AssignStudentsDto,
    @User() user: IUser,
  ) {
    this.examValidation.assignStudents({ body, params: { id: examId } });
    return await this.examService.assignStudentsToExam(examId, body, user);
  }

  @AuthorizedApi({
    api: Api.DELETE,
    role: [UserRoles.Admin, UserRoles.Trainee],
    url: '/:examId/students/:studentId',
  })
  async removeStudentFromExam(
    @Param('examId') examId: number,
    @Param('studentId') studentId: number,
    @User() user: IUser,
  ) {
    this.examValidation.removeStudent({ examId, studentId });
    return await this.examService.removeStudentFromExam(
      examId,
      studentId,
      user,
    );
  }

  @AuthorizedApi({
    api: Api.DELETE,
    role: [UserRoles.Admin, UserRoles.Trainee],
    url: '/:id',
  })
  async deleteExam(@Param('id') examId: number, @User() user: IUser) {
    return await this.examService.deleteExam(examId, user);
  }

  @AuthorizedApi({
    api: Api.PATCH,
    role: [UserRoles.Admin, UserRoles.Trainee],
    url: '/:id/pause',
  })
  async pauseExam(@Param('id') examId: number, @User() user: IUser) {
    return await this.examService.pauseExam(examId, user);
  }

  @AuthorizedApi({
    api: Api.POST,
    role: [UserRoles.Admin, UserRoles.Trainee],
    url: '/:id/unpause',
  })
  async unpauseExam(@Param('id') examId: number, @User() user: IUser) {
    return await this.examService.unpauseExam(examId, user);
  }
}
