import * as Joi from 'joi';
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private readonly schema: Joi.ObjectSchema) {}

  transform(value: any, metadata?: ArgumentMetadata) {
    const { error } = this.schema
      .unknown(false)
      .validate(value, { abortEarly: false });
    if (error) {
      throw new HttpException(
        {
          code: 50000,
          // message : 'Validation failed'
          message: error.message.replace(/(\"|\[|\d\])/g, ''),
          // message: error?.details.flatMap((val) => {
          //   return {
          //     message: val.message.split('"').join(''),
          //     path: val.context.label,
          //   };
          // }),
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return value;
  }
}
