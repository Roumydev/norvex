import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client, ClientDocument } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { buildUpdate } from '../common/build-update';
import { AuthUser, ownFilter, withOwner, withoutOwnerChange } from '../common/scope';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
  ) {}

  async create(dto: CreateClientDto, user: AuthUser) {
    const client = await this.clientModel.create(withOwner(dto, user));
    return client.populate('agent');
  }

  findAll(user: AuthUser) {
    return this.clientModel.find(ownFilter(user)).populate('agent').exec();
  }

  async findOne(id: string, user: AuthUser) {
    const client = await this.clientModel.findOne({ _id: id, ...ownFilter(user) }).populate('agent').exec();
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: string, dto: UpdateClientDto, user: AuthUser) {
    const client = await this.clientModel
      .findOneAndUpdate({ _id: id, ...ownFilter(user) }, buildUpdate(withoutOwnerChange(dto, user), ['email', 'interestedIn', 'budget', 'preferredCity', 'agent']), { returnDocument: 'after' })
      .populate('agent')
      .exec();
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async remove(id: string) {
    const result = await this.clientModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Client not found');
    return { deleted: true };
  }
}