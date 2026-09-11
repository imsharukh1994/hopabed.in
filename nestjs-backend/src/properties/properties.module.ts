import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertiesService } from './properties.service';
import { PropertiesController, HostPropertiesController } from './properties.controller';
import { Property } from './entities/property.entity';
import { Room } from './entities/room.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Property, Room]), AuthModule],
  providers: [PropertiesService],
  controllers: [PropertiesController, HostPropertiesController],
  exports: [PropertiesService],
})
export class PropertiesModule {}
