import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('user_verifications')
export class UserVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ type: 'enum', enum: ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENCE'] })
  idType: 'AADHAAR' | 'PAN' | 'PASSPORT' | 'DRIVING_LICENCE';

  // We only store the masked ID or reference number to comply with Privacy Policy zero-raw-storage
  @Column()
  maskedId: string;

  @Column()
  providerReference: string;

  @Column({ type: 'enum', enum: ['PENDING', 'VERIFIED', 'FAILED'], default: 'PENDING' })
  status: 'PENDING' | 'VERIFIED' | 'FAILED';

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
