import { config } from 'dotenv';
config();

export const jwtConstants = {
  secret: 'secret',
  expiresIn: '30d',
};
