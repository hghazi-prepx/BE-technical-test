import * as joi from 'joi';

export const hour = () => {
  return joi.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d):00$/, 'invalid hour');
};
