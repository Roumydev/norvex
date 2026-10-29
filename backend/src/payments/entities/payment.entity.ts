import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Contract', required: true })
  contract: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  dueDate: string;

  @Prop()
  paidDate: string;

  @Prop()
  method: string;

  @Prop({
    enum: ['Paid', 'Pending', 'Overdue'],
    default: 'Pending',
  })
  status: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);