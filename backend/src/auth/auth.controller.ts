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
import { UserService } from 'src/user/user.service';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { CreateUserDto } from 'src/user/dtos/user-input.dto';
import { AuthGuard, type RequestWithUser } from './guards/auth.guard';
import { UserResponseDto } from 'src/user/dtos/user-response.dto';
import { plainToInstance } from 'class-transformer';

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
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return {
      message: `Bienvenue ${pseudo} !`,
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async me(@Req() req: RequestWithUser): Promise<UserResponseDto> {
    const user = await this.userService.findOne(req.user.sub);
    return plainToInstance(UserResponseDto, user);
  }
}
