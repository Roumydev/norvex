import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthUser } from '../common/scope';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  create(@Body() dto: CreateContractDto, @Req() req: { user: AuthUser }) {
    return this.contractsService.create(dto, req.user);
  }

  @Get()
  findAll(@Req() req: { user: AuthUser }) {
    return this.contractsService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.contractsService.findOne(id, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContractDto, @Req() req: { user: AuthUser }) {
    return this.contractsService.update(id, dto, req.user);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractsService.remove(id);
  }

  // رفع ملف PDF (5MB كحد أقصى). بدون storage => multer يخزّن في الذاكرة
  @Post(':id/document')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  uploadDocument(
    @Param('id') id: string,
    @Req() req: { user: AuthUser },
    @UploadedFile() file?: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  ) {
    return this.contractsService.setDocument(id, req.user, file);
  }

  @Get(':id/document')
  async downloadDocument(@Param('id') id: string, @Req() req: { user: AuthUser }, @Res({ passthrough: true }) res: Response) {
    const { data, name } = await this.contractsService.getDocument(id, req.user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(name)}`,
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(data);
  }

  @Roles('admin')
  @Delete(':id/document')
  removeDocument(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.contractsService.removeDocument(id, req.user);
  }
}