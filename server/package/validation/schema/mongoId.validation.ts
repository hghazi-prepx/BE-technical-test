import * as joi from 'joi';

export const mongoId = () => {
  return joi.string().regex(/^[a-fA-F0-9]{24}$/, 'mongo Id valid');
};
