import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent, AgentDocument } from './entities/agent.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { buildUpdate } from '../common/build-update';

@Injectable()
export class AgentsService {
  constructor(
    @InjectModel(Agent.name) private agentModel: Model<AgentDocument>,
  ) {}

  create(dto: CreateAgentDto) {
    return this.agentModel.create(dto);
  }

  findAll() {
    return this.agentModel.find().exec();
  }

  async findOne(id: string) {
    const agent = await this.agentModel.findById(id).exec();
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async update(id: string, dto: UpdateAgentDto) {
    const agent = await this.agentModel
      .findByIdAndUpdate(id, buildUpdate(dto, ['phone', 'city', 'rating']), { returnDocument: 'after' })
      .exec();
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async remove(id: string) {
    const result = await this.agentModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Agent not found');
    return { deleted: true };
  }
}