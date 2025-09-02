import * as joi from 'joi';
export const paramsId = joi.object({
  id: joi.number().required().min(1),
});
