import { Controller, Get, Query, SerializeOptions } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResponseDto } from './dtos/user-response.dto';
import { plainToInstance } from 'class-transformer';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @SerializeOptions({ type: UserResponseDto })
  async findAll(@Query('search') search?: string): Promise<UserResponseDto[]> {
    const users = await this.userService.findAll(search);
    return users.map((user) => plainToInstance(UserResponseDto, user));
  }
}
