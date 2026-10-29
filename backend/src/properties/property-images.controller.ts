import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { PropertiesService } from './properties.service';

// صور العقارات عامة (بدون توكن) باش <img src> تخدم. الـids غير قابلة للتخمين، والصور مش حساسة.
@Controller('property-images')
export class PropertyImagesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get(':id')
  async get(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { data, mimeType } = await this.propertiesService.getImage(id);
    res.set({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
    return new StreamableFile(data);
  }
}
