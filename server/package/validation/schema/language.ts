import * as joi from 'joi';

export const language = () => {
  return joi
    .object({
      ar: joi.string().required(),
      en: joi.string().required(),
    })
    .required();
};
