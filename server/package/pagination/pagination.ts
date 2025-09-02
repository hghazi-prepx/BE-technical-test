// eslint-disable-next-line @typescript-eslint/no-var-requires
const _ = require('lodash');

import { paginationConstant } from './pagination.constant';

export const paginationParser = (reqQuery) => {
  const fields = ['page', 'take'];

  const pagination = _.pick(reqQuery, fields);

  const page = +pagination.page || 0;

  pagination.take = +pagination.take || paginationConstant.limit.default;

  pagination.skip = page * pagination.take;
  const criteria = _.omit(reqQuery, fields);
  return { pagination, criteria };
};
