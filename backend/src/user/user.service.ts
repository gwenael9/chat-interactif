import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { ILike, Repository } from 'typeorm';
import { CreateUserDto } from './dtos/user-input.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
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
}
