import { GetByCriteria } from 'package/pagination/dto';
import { config } from 'dotenv';
config();

export const orderCriteria = (query?: any) => {
  return [[`${query?.sortBy || 'id'}`, `${query?.sort || 'ASC'}`]] as any;
};

export const constructFileUrl = (fileName?: string) => {
  if (!fileName) return undefined;
  const protocol = process.env.API_PROTOCOL;
  const address = process.env.IP_ADDRESS;

  const origin = `${protocol}://${address}`;
  // const url = new URL(origin);
  // url.port = process.env.API_PORT;
  const uploadDirectory = process.env.UPLOAD_DIR;

  // url.pathname = `${uploadDirectory}/${fileName}`;

  const result = `${origin}/${uploadDirectory}/${fileName}`;
  return result;
};
