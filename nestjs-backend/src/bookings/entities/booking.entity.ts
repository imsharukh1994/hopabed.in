import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Property } from '../../properties/entities/property.entity';
import { Room } from '../../properties/entities/room.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Property)
  @JoinColumn()
  property: Property;

  @ManyToOne(() => Room)
  @JoinColumn()
  room: Room;

  @ManyToOne(() => User)
  @JoinColumn()
  guest: User;

  @ManyToOne(() => User)
  @JoinColumn()
  host: User;

  @Column({ type: 'date' })
  checkIn: Date;

  @Column({ type: 'date' })
  checkOut: Date;

  @Column({ type: 'int' })
  guests: number;

  @Column({ type: 'int', default: 1 })
  roomCount: number;

  @Column({ type: 'int' })
  nights: number;

  @Column({ type: 'float' })
  subtotal: number;

  @Column({ type: 'float' })
  serviceFee: number;

  @Column({ type: 'float' })
  taxes: number;

  @Column({ type: 'float' })
  totalAmount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ type: 'enum', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT'], default: 'PENDING' })
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN' | 'CHECKED_OUT';

  @Column({ type: 'enum', enum: ['UNPAID', 'PAID', 'REFUNDED'], default: 'UNPAID' })
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';

  @Column({ nullable: true })
  paymentId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
