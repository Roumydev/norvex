import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PropertyImageDocument = PropertyImage & Document;

// صورة عقار (مخزّنة في MongoDB، الملف نفسو منفصل على وثيقة العقار باش القائمة تبقى خفيفة)
@Schema({ timestamps: true })
export class PropertyImage {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  property: Types.ObjectId;

  @Prop({ type: Buffer, required: true })
  data: Buffer;

  @Prop({ required: true })
  mimeType: string;

  @Prop()
  name: string;

  @Prop()
  size: number;
}

export const PropertyImageSchema = SchemaFactory.createForClass(PropertyImage);
