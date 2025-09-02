// import { HttpException, HttpStatus } from '@nestjs/common';
// import { Error } from 'package/utils/Error/error';
// import {
//   AggregateOptions,
//   Attributes,
//   CreateOptions,
//   CreationAttributes,
//   DestroyOptions,
//   FindAndCountOptions,
//   FindOptions,
//   Includeable,
//   ModelStatic,
//   NonNullFindOptions,
//   Order,
//   Transaction,
//   UpdateOptions,
//   WhereOptions,
// } from 'sequelize';
// import { Model } from 'sequelize-typescript';
// import { Col, Fn, Literal } from 'sequelize/types/utils';
// export class SequelizeRepository<T extends Model> {
//   constructor(private modelEntity: ModelStatic<T>) {}
//   async findOne({
//     where,
//     include,
//     order,
//     options,
//     error,
//     throwError = true,
//   }: {
//     where?: WhereOptions<T>;
//     error?: Error;
//     order?: Order;
//     options?: NonNullFindOptions<Attributes<T>>;
//     throwError?: boolean;
//     include?: Includeable | Includeable[];
//   }) {
//     const row = await this.modelEntity.findOne({
//       ...options,
//       where,
//       include,
//       order,
//     });
//     if (!row && throwError && error) {
//       throw new HttpException(error, HttpStatus.NOT_FOUND);
//     }

//     return row;
//   }

//   async findAll({
//     where,
//     include,
//     options,
//     order,
//   }: {
//     where?: WhereOptions<T>;
//     include?: Includeable | Includeable[];
//     options?: FindOptions<Attributes<T>>;
//     order?: Order;
//   }) {
//     return await this.modelEntity.findAll({
//       ...options,
//       where,
//       include,
//       order,
//     });
//   }

//   async create<
//     O extends CreateOptions<Attributes<T>> = CreateOptions<Attributes<T>>,
//   >({ doc, options }: { doc: Partial<T>; options?: O }) {
//     const row = await this.modelEntity.create<T>(doc as CreationAttributes<T>, {
//       ...options,
//     });

//     return row;
//   }

//   async bulkCreate({
//     doc,
//     options,
//   }: {
//     doc: ReadonlyArray<Partial<T>>;
//     options?: CreateOptions<Attributes<T>>;
//   }) {
//     const row = await this.modelEntity.bulkCreate(
//       doc as ReadonlyArray<CreationAttributes<T>>,
//       options,
//     );

//     return row;
//   }

//   async delete({
//     where,
//     options,
//   }: {
//     where?: WhereOptions<T>;
//     options?: DestroyOptions<Attributes<T>>;
//   }) {
//     const number = await this.modelEntity.destroy({ ...options, where });
//     return number;
//   }

//   async findAndCount({
//     where,
//     options,
//     include,
//     order,
//   }: {
//     options?: Omit<FindAndCountOptions<Attributes<T>>, 'group'>;
//     where?: WhereOptions<T>;
//     include?: Includeable | Includeable[];
//     order?: Order;
//   }) {
//     const row = await this.modelEntity.findAndCountAll({
//       ...options,
//       include,
//       where,
//       order,
//       distinct: true,
//     });
//     return row;
//   }

//   // async create({ doc, options }: { doc: T; options?: SaveOptions }) {
//   //   const entity = this.modelEntity.create()

//   //   return await this.modelEntity.save(entity, options);
//   // }

//   async update({
//     where,
//     update,
//     options,
//     transaction,
//   }: {
//     where?: WhereOptions<T>;
//     update: {
//       [key in keyof Attributes<T>]?: Attributes<T>[key] | Fn | Col | Literal;
//     };
//     options?: Omit<UpdateOptions<Attributes<T>>, 'returning'> & {
//       returning: Exclude<
//         UpdateOptions<Attributes<T>>['returning'],
//         undefined | false
//       >;
//     };
//     transaction?: Transaction | null;
//   }) {
//     return await this.modelEntity.update(update, {
//       ...options,
//       where,
//       transaction,
//     });
//   }

//   async count({ where }: { where?: WhereOptions<T> }) {
//     return await this.modelEntity.count({ where, distinct: true });
//   }
//   async destroy({
//     where,
//     options,
//   }: {
//     where: WhereOptions<T>;
//     options?: DestroyOptions<T>;
//   }) {
//     await this.modelEntity.destroy({
//       where,
//       ...options,
//     });
//   }

//   async sum(field: string, options: AggregateOptions<T>) {
//     return await this.modelEntity.sum(field, options);
//   }
// }
