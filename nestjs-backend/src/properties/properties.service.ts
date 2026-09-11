import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, In } from 'typeorm';
import { Property } from './entities/property.entity';
import { Room } from './entities/room.entity';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property) private propertyRepo: Repository<Property>,
    @InjectRepository(Room) private roomRepo: Repository<Room>,
  ) {}

  async searchProperties(params: any) {
    const { destination, propertyType, minPrice, maxPrice } = params;

    const where: any = {
      verificationStatus: 'VERIFIED',
      isVerified: true,
      isPublished: true,
    };

    if (destination) {
      where.city = ILike(`%${destination}%`);
    }
    if (propertyType) {
      where.propertyType = propertyType;
    }
    if (minPrice || maxPrice) {
      where.pricePerNight = Between(minPrice || 0, maxPrice || 999999);
    }

    const properties = await this.propertyRepo.find({
      where,
      order: { isFeatured: 'DESC', createdAt: 'DESC' },
      take: 50,
    });

    return { properties };
  }

  async getProperty(id: string) {
    const property = await this.propertyRepo.findOne({
      where: { id, verificationStatus: 'VERIFIED', isVerified: true, isPublished: true },
    });
    if (!property) throw new NotFoundException('Property not found');

    const rooms = await this.roomRepo.find({ where: { property: { id }, isActive: true } });
    return { property, rooms };
  }

  async getHostProperties(hostId: string) {
    return this.propertyRepo.find({ where: { host: { id: hostId } } });
  }

  async createProperty(hostId: string, data: Partial<Property>) {
    const property = this.propertyRepo.create({ ...data, host: { id: hostId } });
    return this.propertyRepo.save(property);
  }
}
