// import {
//   CallHandler,
//   ExecutionContext,
//   HttpException,
//   HttpStatus,
//   Injectable,
//   NestInterceptor,
// } from '@nestjs/common';
// import { InjectConnection } from '@nestjs/sequelize';
// import { Observable, catchError, tap } from 'rxjs';
// import { Transaction } from 'sequelize';
// import { Sequelize } from 'sequelize-typescript';

// @Injectable()
// export class TransactionInterceptor implements NestInterceptor {
//   constructor(
//     @InjectConnection()
//     private readonly sequelizeInstance: Sequelize,
//   ) {}

//   async intercept(
//     context: ExecutionContext,
//     next: CallHandler,
//   ): Promise<Observable<any>> {
//     const httpContext = context.switchToHttp();
//     const req = httpContext.getRequest();

//     const transaction: Transaction = await this.sequelizeInstance.transaction();
//     req.transaction = transaction;
//     // const session = await this.connection.startSession();
//     return next.handle().pipe(
//       tap(async () => {
//         await transaction.commit();
//       }),
//       catchError(async (err) => {
//         await transaction.rollback();
//         throw new HttpException(err, HttpStatus.BAD_REQUEST);
//       }),
//     );
//   }
// }
