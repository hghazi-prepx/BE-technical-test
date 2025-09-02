import * as joi from 'joi';

export const id = () => {
  return joi.number().integer().min(1);
};
