import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PropertyDocument = Property & Document;

@Schema({ timestamps: true })
export class Property {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  city: string;

  @Prop()
  district: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  txType: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  area: number;

  @Prop({ default: 0 })
  bedrooms: number;

  @Prop({ default: 0 })
  bathrooms: number;

  @Prop({ default: 'Available' })
  status: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Agent' })
  agent: Types.ObjectId;

  // ids تاع الصور (الأولى = الغلاف)
  @Prop({ type: [String], default: [] })
  images: string[];
}

export const PropertySchema = SchemaFactory.createForClass(Property);