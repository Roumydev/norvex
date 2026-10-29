import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead, LeadDocument } from './entities/lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { buildUpdate } from '../common/build-update';
import { AuthUser, ownFilter, withOwner, withoutOwnerChange } from '../common/scope';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
  ) {}

  create(dto: CreateLeadDto, user: AuthUser) {
    return this.leadModel.create(withOwner(dto, user));
  }

  findAll(user: AuthUser) {
    return this.leadModel.find(ownFilter(user)).populate('agent').exec();
  }

  async findOne(id: string, user: AuthUser) {
    const lead = await this.leadModel.findOne({ _id: id, ...ownFilter(user) }).populate('agent').exec();
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, user: AuthUser) {
    const lead = await this.leadModel
      .findOneAndUpdate({ _id: id, ...ownFilter(user) }, buildUpdate(withoutOwnerChange(dto, user), ['phone', 'email', 'property', 'budget', 'agent']), { returnDocument: 'after' })
      .populate('agent')
      .exec();
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async remove(id: string) {
    const result = await this.leadModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Lead not found');
    return { deleted: true };
  }
}