import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // أي مستخدم مسجّل يقرا الإعدادات
  @Get()
  get() {
    return this.settingsService.get();
  }

  // التعديل وإعادة الضبط للـadmin فقط
  @Roles('admin')
  @Patch()
  update(@Body() dto: UpdateSettingDto) {
    return this.settingsService.update(dto);
  }

  @Roles('admin')
  @Delete()
  reset() {
    return this.settingsService.reset();
  }
}
