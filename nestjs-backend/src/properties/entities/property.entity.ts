import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  host: User;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['hotel', 'villa', 'homestay', 'apartment'] })
  propertyType: string;

  @Column()
  city: string;

  @Column()
  locality: string;

  @Column()
  address: string;

  @Column({ type: 'float', nullable: true })
  pricePerNight: number;

  @Column({ type: 'float', nullable: true })
  rating: number;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'enum', enum: ['PENDING_REVIEW', 'VERIFIED', 'CHANGES_REQUESTED', 'REJECTED'], default: 'PENDING_REVIEW' })
  verificationStatus: 'PENDING_REVIEW' | 'VERIFIED' | 'CHANGES_REQUESTED' | 'REJECTED';

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'text', array: true, default: [] })
  amenities: string[];

  @Column({ type: 'text', array: true, default: [] })
  houseRules: string[];

  @Column({ nullable: true })
  primaryImage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
