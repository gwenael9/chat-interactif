import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { CreateUserDto } from 'src/user/dtos/user-input.dto';
import * as authGuard from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: CreateUserDto): Promise<AuthResponseDto> {
    const user = await this.userService.register(registerDto);
    return {
      message: `Votre compte a bien été créé ${user.pseudo}`,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { token, pseudo } = await this.authService.login(loginDto);

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return {
      message: `Bienvenue ${pseudo} !`,
    };
  }

  @Get('me')
  @UseGuards(authGuard.AuthGuard)
  @HttpCode(HttpStatus.OK)
  async me(@Req() req: authGuard.RequestWithUser): Promise<UserEntity> {
    return await this.userService.findOne(req.user.sub);
  }
}
