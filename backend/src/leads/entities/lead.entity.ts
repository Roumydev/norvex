import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeadDocument = Lead & Document;

@Schema({ timestamps: true })
export class Lead {
  @Prop({ required: true })
  name: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop()
  property: string;

  @Prop()
  budget: number;

  @Prop()
  source: string;

  @Prop({
    enum: ['New', 'Contacted', 'Qualified', 'Visit Scheduled', 'Negotiation', 'Won', 'Lost'],
    default: 'New',
  })
  stage: string;

  @Prop({ type: Types.ObjectId, ref: 'Agent' })
  agent: Types.ObjectId;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);