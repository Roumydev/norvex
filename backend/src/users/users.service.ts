import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { buildUpdate } from '../common/build-update';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateUserDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const { agent, ...rest } = dto;
    const user = await this.userModel.create({
      ...rest,
      ...(agent ? { agent } : {}),
      password: hashedPassword,
    });

    const { password, ...result } = user.toObject();
    return result;
  }

  findAll() {
    return this.userModel.find().select('-password').populate('agent', 'name email').sort({ createdAt: 1 }).exec();
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // للـJwtStrategy: الدور وربط الوكيل الحاليين
  findForAuth(id: string) {
    return this.userModel.findById(id).select('email role agent').lean().exec();
  }

  // للـ/auth/me
  async findMe(id: string) {
    const user = await this.userModel.findById(id).select('-password').populate('agent', 'name email').exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  findByIdWithPassword(id: string) {
    return this.userModel.findById(id).exec();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  // لازم يبقى admin واحد على الأقل
  private async assertNotLastAdmin() {
    const admins = await this.userModel.countDocuments({ role: 'admin' }).exec();
    if (admins <= 1) throw new BadRequestException('At least one admin is required');
  }

  async update(id: string, dto: UpdateUserDto, requesterId?: string) {
    const target = await this.userModel.findById(id).select('role').exec();
    if (!target) throw new NotFoundException('User not found');

    // تغيير الدور: ما نخليوش الـadmin يبدّل دور حسابو، ولا نحيّدو آخر admin
    if (dto.role && dto.role !== target.role) {
      if (id === requesterId) throw new BadRequestException('You cannot change your own role');
      if (target.role === 'admin') await this.assertNotLastAdmin();
    }

    const data: any = { ...dto };
    // كلمة المرور لازم تتشفّر (كانت تتخزّن كنص عادي عند التعديل)
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel
      .findByIdAndUpdate(id, buildUpdate(data, ['agent']), { returnDocument: 'after' })
      .select('-password')
      .populate('agent', 'name email')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async remove(id: string, requesterId?: string) {
    if (id === requesterId) throw new BadRequestException('You cannot delete your own account');

    const target = await this.userModel.findById(id).select('role').exec();
    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'admin') await this.assertNotLastAdmin();

    await this.userModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }
}
