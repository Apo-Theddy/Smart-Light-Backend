import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Device } from '../device/device.entity';

@Entity('leds')
export class Led {
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
    name: 'color',
    type: 'json',
    nullable: false,
    default: { r: 255, g: 255, b: 255 },
  })
  color: Record<'r' | 'g' | 'b', number>;

  @Column({
    name: 'brightness',
    type: 'int',
    nullable: true,
    default: 100,
  })
  brightness: number;

  @Column({
    name: 'pin',
    type: 'int',
    nullable: false,
  })
  pin: number;

  @Column({
    name: 'is_on',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  isOn: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @ManyToMany(() => Device, (device) => device.deviceHasLeds)
  @JoinTable({
    name: 'device_leds',
    joinColumn: { name: 'led_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'device_id', referencedColumnName: 'id' },
  })
  deviceHasLeds: Device[];
}
