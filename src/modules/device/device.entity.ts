import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Led } from '../led/led.entity';
import { Group } from '../group/group.entity';
import { Event } from '../event/event.entity';
import { User } from '../user/user.entity';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  name: string;

  @Column({
    name: 'mac',
    type: 'varchar',
    length: 17,
    nullable: false,
    unique: true,
  })
  @Index()
  mac: string;

  @Column({
    name: 'is_online',
    type: 'boolean',
    default: false,
    nullable: true,
  })
  isOnline: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @ManyToMany(() => Led, (led) => led.deviceHasLeds)
  deviceHasLeds: Led[];

  @ManyToMany(() => Group, (group) => group.devices)
  groups: Group[];

  @OneToMany(() => Event, (event) => event.device)
  events: Event[];

  @ManyToOne(() => User, (user) => user.ownedDevices)
  @JoinColumn({ name: 'owner_id' })
  owner: User;
}
