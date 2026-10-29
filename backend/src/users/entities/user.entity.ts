import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: ['admin', 'agent'], default: 'agent' })
  role: string;

  // ملف الوكيل المربوط بحساب الدخول (للوكلاء فقط)
  @Prop({ type: Types.ObjectId, ref: 'Agent' })
  agent?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);