import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Booking)
  @JoinColumn()
  booking: Booking;

  @Column({ type: 'float' })
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column()
  gatewayOrderId: string;

  @Column({ nullable: true })
  gatewayPaymentId: string;

  @Column({ nullable: true })
  gatewaySignature: string;

  @Column({ type: 'enum', enum: ['CREATED', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'CREATED' })
  status: 'CREATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
