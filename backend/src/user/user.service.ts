import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { ILike, Repository } from 'typeorm';
import { CreateUserDto } from './dtos/user-input.dto';
import * as bcrypt from 'bcrypt';
import { FriendGateway } from './friend.gateway';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private friendGateway: FriendGateway,
  ) {}

  async findAll(search?: string): Promise<UserEntity[]> {
    if (search) {
      return await this.userRepository.find({
        where: { pseudo: ILike(`%${search}%`) },
      });
    }
    return await this.userRepository.find();
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { friends: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async register(user: CreateUserDto): Promise<UserEntity> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const existingUser = await this.findOneByEmail(user.email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }
    const newUser = this.userRepository.create({
      ...user,
      password: hashedPassword,
    });
    return this.userRepository.save(newUser);
  }

  /**
   *
   * @param userId L'id du user qui ajoute
   * @param friendId L'id du user au quel on souhaite ajouter
   * @returns L'user ajouté
   */
  async addFriend(userId: string, friendId: string): Promise<UserEntity> {
    if (userId == friendId) {
      throw new UnauthorizedException(
        'Vous ne pouvez pas vous ajouter en ami.',
      );
    }

    const user = await this.findOne(userId);
    const friend = await this.findOne(friendId);

    this.verifyIfIsAlreadyFriend(user, friend);

    friend.friends.push(user);
    user.friends.push(friend);

    await this.userRepository.save([user, friend]);

    this.friendGateway.notifyFriendRequest(friendId, {
      fromUserId: userId,
      fromPseudo: user.pseudo,
    });

    return friend;
  }

  async removeFriend(userId: string, friendId: string): Promise<UserEntity> {
    const user = await this.findOne(userId);
    const friend = await this.findOne(friendId);

    if (!user.friends.some((f) => f.id === friendId)) {
      throw new UnauthorizedException(
        `${friend.pseudo} ne fait pas partie de vos amis.`,
      );
    }

    user.friends = user.friends.filter((f) => f.id !== friendId);
    friend.friends = friend.friends.filter((u) => u.id !== userId);

    await this.userRepository.save([user, friend]);
    return friend;
  }

  async getFriends(userId: string): Promise<UserEntity[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['friends'],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return user.friends;
  }

  verifyIfIsAlreadyFriend(user: UserEntity, friend: UserEntity): void {
    const alreadyFriends = user.friends.some((f) => f.id === friend.id);
    if (alreadyFriends) throw new UnauthorizedException('Vous êtes déjà amis.');
  }
}
