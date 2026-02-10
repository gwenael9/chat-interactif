import { Controller, Get, SerializeOptions } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResponseDto } from './dtos/user-response.dto';
import { plainToInstance } from 'class-transformer';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @SerializeOptions({ type: UserResponseDto })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userService.findAll();
    return users.map((user) => plainToInstance(UserResponseDto, user));
  }
}
