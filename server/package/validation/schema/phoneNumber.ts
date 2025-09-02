import * as joi from 'joi';

export const phoneNumber = () => {
  return joi
    .string()
    .pattern(/^09[0-9]*$/)
    .min(10)
    .max(10);
};
