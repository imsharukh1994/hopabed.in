import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Property } from '../../properties/entities/property.entity';

@Entity('property_verification_documents')
export class PropertyVerificationDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Property)
  @JoinColumn()
  property: Property;

  @Column()
  documentType: string;

  @Column()
  originalFilename: string;

  @Column()
  mimeType: string;

  @Column()
  s3Key: string; // the encrypted storage location

  @CreateDateColumn()
  createdAt: Date;
}
