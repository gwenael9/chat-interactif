import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose()
  @Type(() => String)
  id: string;

  @Expose()
  @Type(() => String)
  email: string;

  @Expose()
  @Type(() => String)
  pseudo: string;

  @Expose()
  @Type(() => UserResponseDto)
  friends: UserResponseDto[];
}
