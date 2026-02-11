import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  pseudo: string;

  @Column()
  password: string;

  @ManyToMany(() => UserEntity, (user) => user.friends)
  @JoinTable({
    name: 'user_friends',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'friend_id',
      referencedColumnName: 'id',
    },
  })
  friends: UserEntity[];
}
