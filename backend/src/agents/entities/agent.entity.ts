import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AgentDocument = Agent & Document;

@Schema({ timestamps: true })
export class Agent {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  phone: string;

  @Prop({ enum: ['Senior Agent', 'Agent', 'Junior Agent'], default: 'Agent' })
  role: string;

  @Prop()
  city: string;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  properties: number;

  @Prop({ default: 0 })
  activeLeads: number;

  @Prop({ default: 0 })
  visits: number;

  @Prop({ default: 0 })
  closedDeals: number;

  @Prop({ default: 0 })
  revenue: number;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);