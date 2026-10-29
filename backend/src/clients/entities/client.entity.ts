import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ timestamps: true })
export class Client {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  email: string;

  @Prop()
  interestedIn: string;

  @Prop()
  budget: number;

  @Prop()
  preferredCity: string;

  @Prop({ type: Types.ObjectId, ref: 'Agent' })
  agent: Types.ObjectId;

  @Prop({ default: 'Active', enum: ['Active', 'Inactive'] })
  status: string;
}

export const ClientSchema = SchemaFactory.createForClass(Client);