import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContractDocument = Contract & Document;

@Schema({ timestamps: true })
export class Contract {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  property: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  client: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
  agent: Types.ObjectId;

  @Prop({ required: true, enum: ['Sale', 'Rent'] })
  type: string;

  @Prop({ required: true })
  value: number;

  @Prop({ default: 0 })
  paid: number;

  @Prop()
  startDate: string;

  @Prop()
  endDate: string;

  @Prop({
    enum: ['Draft', 'Pending', 'Active', 'Completed', 'Cancelled'],
    default: 'Draft',
  })
  status: string;

  // معلومات ملف PDF (الملف نفسو في collection منفصلة)
  @Prop()
  documentName: string;

  @Prop()
  documentSize: number;

  @Prop()
  documentUploadedAt: Date;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);