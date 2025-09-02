import { HttpException, HttpStatus } from '@nestjs/common';
import { Error } from 'package/utils/Error/error';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  ObjectId,
  Repository,
  SaveOptions,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export class TypeOrmRepository<T> {
  constructor(private modelEntity: Repository<T>) {}
  async findOne({
    where,
    options,
    error,
    throwError = true,
  }: {
    where: FindOptionsWhere<T>[] | FindOptionsWhere<T>;
    error?: Error;
    options?: FindOneOptions<T>;
    throwError?: boolean;
  }) {
    const row = await this.modelEntity.findOne({ ...options, where });
    if (!row && throwError && error) {
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }

    return row;
  }

  async findAll({
    where,
    options,
  }: {
    where: FindOptionsWhere<T>[] | FindOptionsWhere<T>;
    options?: FindManyOptions<T>;
  }) {
    return await this.modelEntity.find({ ...options, where });
  }

  async findAndCount({
    where,
    options,
    select,
    relations,
  }: {
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
    select?: FindOptionsSelect<T>;
    relations?: FindOptionsRelations<T>;
    options?: FindManyOptions<T>;
  }) {
    const [data, totalRecords] = await this.modelEntity.findAndCount({
      ...options,
      where,
      select,
      relations,
    });
    return {
      data,
      totalRecords,
    };
  }

  async create({
    doc,
    options,
  }: {
    doc: DeepPartial<T>;
    options?: SaveOptions;
  }) {
    const entity = this.modelEntity.create(doc);

    return await this.modelEntity.save(entity, options);
  }

  async update({
    where,
    update,
  }: {
    where:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<T>;
    update: QueryDeepPartialEntity<T>;
  }) {
    return await this.modelEntity.update(where, update);
  }

  async findOneAndUpdate({
    where,
    options,
    error,
    update,
    throwError = true,
  }: {
    where: FindOptionsWhere<T>;
    update: QueryDeepPartialEntity<T>;
    error?: Error;
    options?: FindOneOptions<T>;
    throwError?: boolean;
  }) {
    const row = await this.findOne({ where, options, error, throwError });

    Object.keys(update).forEach((key) => {
      row[key] = update[key];
    });

    return await this.modelEntity.save(row);
  }
  async count({ where }: { where?: FindOptionsWhere<T> }) {
    return await this.modelEntity.count({ where });
  }

  async delete({ criteria }: { criteria: FindOptionsWhere<T> }) {
    return await this.modelEntity.delete(criteria);
  }
}
