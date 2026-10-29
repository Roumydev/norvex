import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';  
import { AuthUser } from '../common/scope';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  create(@Body() dto: CreatePropertyDto, @Req() req: { user: AuthUser }) {
    return this.propertiesService.create(dto, req.user);
  }

  @Get()
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }

  // رفع صور (JPEG / PNG / WebP، حتى 8 صور، 2MB للصورة)
  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('files', 8, { limits: { fileSize: 2 * 1024 * 1024 } }))
  uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files?: Array<{ buffer: Buffer; originalname: string }>,
  ) {
    return this.propertiesService.addImages(id, files);
  }

  @Patch(':id/images/:imageId/cover')
  setCover(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.propertiesService.setCover(id, imageId);
  }

  @Delete(':id/images/:imageId')
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.propertiesService.removeImage(id, imageId);
  }
}