import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Group } from '../group/group.entity';
import { Account } from '../account/account.entity';
import { Device } from '../device/device.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'firstnames',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  firstnames: string;

  @Column({
    name: 'lastnames',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  lastnames: string;

  @Column({
    name: 'phone',
    type: 'char',
    length: 12,
    nullable: true,
  })
  phone?: string;

  @Column({
    name: 'birthdate',
    type: 'date',
    nullable: true,
  })
  birthdate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @ManyToMany(() => Group, (group) => group.users)
  groups: Group[];

  @OneToOne(() => Account, (account) => account.user)
  account: Account;

  @OneToMany(() => Device, (device) => device.owner)
  ownedDevices: Device[];
}
