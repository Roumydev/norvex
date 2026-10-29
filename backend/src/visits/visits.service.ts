import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Visit, VisitDocument } from './entities/visit.entity';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { buildUpdate } from '../common/build-update';
import { AuthUser, ownFilter, withOwner, withoutOwnerChange } from '../common/scope';

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel(Visit.name) private visitModel: Model<VisitDocument>,
  ) {}

  create(dto: CreateVisitDto, user: AuthUser) {
    return this.visitModel.create(withOwner(dto, user));
  }

  findAll(user: AuthUser) {
    return this.visitModel
      .find(ownFilter(user))
      .populate('client')
      .populate('property')
      .populate('agent')
      .exec();
  }

  async findOne(id: string, user: AuthUser) {
    const visit = await this.visitModel
      .findOne({ _id: id, ...ownFilter(user) })
      .populate('client')
      .populate('property')
      .populate('agent')
      .exec();
    if (!visit) throw new NotFoundException('Visit not found');
    return visit;
  }

  async update(id: string, dto: UpdateVisitDto, user: AuthUser) {
    const visit = await this.visitModel
      .findOneAndUpdate({ _id: id, ...ownFilter(user) }, buildUpdate(withoutOwnerChange(dto, user), ['time', 'notes']), { returnDocument: 'after' })
      .populate('client')
      .populate('property')
      .populate('agent')
      .exec();
    if (!visit) throw new NotFoundException('Visit not found');
    return visit;
  }

  async remove(id: string) {
    const result = await this.visitModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Visit not found');
    return { deleted: true };
  }
}