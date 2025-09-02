import * as joi from 'joi';
import { paginationConstant } from './pagination.constant';

export const pagination = () => {
  return {
    page: joi.number().min(0).default(paginationConstant.page),
    take: joi
      .number()
      .min(0)
      .max(paginationConstant.limit.max)
      .default(paginationConstant.limit.default),
  };
};
