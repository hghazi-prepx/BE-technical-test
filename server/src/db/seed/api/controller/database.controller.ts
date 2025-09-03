import { Controller, Post } from '@nestjs/common';
import { UserService } from 'src/user/service/user.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly userService: UserService) {}
  @Post('seed')
  async seedData() {
    await this.userService.seed();
  }
}
