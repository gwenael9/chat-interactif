import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class AuthResponseDto {
  @Expose()
  @Type(() => String)
  message: string;
}
