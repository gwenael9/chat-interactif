import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserResponseDto } from './dtos/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { AuthGuard, type RequestWithUser } from 'src/auth/guards/auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @SerializeOptions({ type: UserResponseDto })
  async findAll(@Query('search') search?: string): Promise<UserResponseDto[]> {
    const users = await this.userService.findAll(search);
    return users.map((user) => plainToInstance(UserResponseDto, user));
  }

  @UseGuards(AuthGuard)
  @Get('friends/all')
  @SerializeOptions({ type: UserResponseDto })
  async getFriends(@Req() req: RequestWithUser): Promise<UserResponseDto[]> {
    return this.userService.getFriends(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Post('friends/:friendId')
  async addFriend(
    @Param('friendId') friendId: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const user = await this.userService.addFriend(req.user.sub, friendId);
    return { message: `L'utilisateur ${user.pseudo} a bien été ajouté.` };
  }

  @UseGuards(AuthGuard)
  @Delete('friends/:friendId')
  async removeFriend(
    @Param('friendId') friendId: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const user = await this.userService.removeFriend(req.user.sub, friendId);
    return {
      message: `L'utilisateur ${user.pseudo} a bien été supprimé de votre liste d'amis.`,
    };
  }
}
