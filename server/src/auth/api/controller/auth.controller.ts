import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from 'package/guards/local-auth-guard';
import { AuthService } from 'src/auth/service/auth.service';
import { LoginDto } from '../dto';
import { AuthValidation } from '../validation';
import { User } from 'package/decorator/param/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authValidation: AuthValidation,
  ) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Body() body: LoginDto, @User() user) {
    const data = await this.authService.login(body, user);
    return data;
  }
}
