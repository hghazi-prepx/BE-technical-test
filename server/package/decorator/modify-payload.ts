// src/pipes/modify-payload.pipe.ts
import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { Request } from 'express'; // Importing Request interface from express
import { JObject } from 'package/utils/interfaces';

@Injectable()
export class ModifyPayloadPipe implements PipeTransform {
  transform(request: Request): any {
    const payload = request as JObject;

    // Put any modification logic on the request body
    for (const key in payload) {
      if (payload[key] === null) {
        payload[key] = undefined;
      }
    }
    return payload;
  }
}
