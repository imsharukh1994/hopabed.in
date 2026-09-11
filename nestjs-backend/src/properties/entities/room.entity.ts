import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Property } from './property.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Property)
  @JoinColumn()
  property: Property;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['standard', 'deluxe', 'suite', 'dorm'] })
  roomType: string;

  @Column({ type: 'int', default: 1 })
  capacity: number;

  @Column({ type: 'int', default: 1 })
  inventory: number;

  @Column({ type: 'float' })
  pricePerNight: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', array: true, default: [] })
  amenities: string[];
}
