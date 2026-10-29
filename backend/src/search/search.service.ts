import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from '../properties/entities/property.entity';
import { Client, ClientDocument } from '../clients/entities/client.entity';
import { Agent, AgentDocument } from '../agents/entities/agent.entity';
import { AuthUser, ownFilter } from '../common/scope';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @InjectModel(Agent.name) private agentModel: Model<AgentDocument>,
  ) {}

  async search(q: string | undefined, user: AuthUser) {
    const term = (q || '').trim().slice(0, 60);
    if (term.length < 2) return { properties: [], clients: [], agents: [] };

    // نهربو الرموز الخاصة باش المستخدم ما يحقنش regex
    const rx = new RegExp(escapeRegex(term), 'i');

    const [properties, clients, agents] = await Promise.all([
      this.propertyModel
        .find({ $or: [{ title: rx }, { city: rx }, { district: rx }] })
        .select('title city district type price images')
        .limit(5)
        .lean()
        .exec(),
      this.clientModel
        .find({ $and: [{ $or: [{ name: rx }, { phone: rx }, { email: rx }] }, ownFilter(user)] })
        .select('name phone email')
        .limit(5)
        .lean()
        .exec(),
      this.agentModel
        .find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] })
        .select('name email phone')
        .limit(5)
        .lean()
        .exec(),
    ]);

    return { properties, clients, agents };
  }
}
