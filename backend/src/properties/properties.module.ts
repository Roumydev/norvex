import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PropertyImagesController } from './property-images.controller';
import { Property, PropertySchema } from './entities/property.entity';
import { PropertyImage, PropertyImageSchema } from './entities/property-image.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Property.name, schema: PropertySchema },
      { name: PropertyImage.name, schema: PropertyImageSchema },
    ]),
  ],
  controllers: [PropertiesController, PropertyImagesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}
