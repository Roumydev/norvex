import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContractFileDocument = ContractFile & Document;

// ملف PDF تاع العقد (مخزّن في MongoDB، وثيقة وحدة لكل عقد)
@Schema({ timestamps: true })
export class ContractFile {
  @Prop({ type: Types.ObjectId, ref: 'Contract', required: true, unique: true })
  contract: Types.ObjectId;

  @Prop({ type: Buffer, required: true })
  data: Buffer;

  @Prop({ default: 'application/pdf' })
  mimeType: string;
}

export const ContractFileSchema = SchemaFactory.createForClass(ContractFile);
