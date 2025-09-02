import { Module } from '@nestjs/common';
import { DatabaseController } from './api/controller/database.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [DatabaseController],
  exports: [],
})
export class DatabaseModule {}
