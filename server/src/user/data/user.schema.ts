import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { hashPassword } from 'package/utils/bcrypt/bcrypt';
import { UserRoles } from 'src/common/enums/user.enums';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ type: 'int' })
  id?: number;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  username: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  password: string;

  @Column({
    type: 'varchar',
    length: 255,
    default: UserRoles.Students,
  })
  role?: UserRoles;

  @BeforeInsert()
  async hashPasswordBeforeCreate(): Promise<void> {
    if (this.password) {
      this.password = await hashPassword(this.password);
    }

    if (this.username) {
      this.username = this.username.trim();
    }
  }
}
