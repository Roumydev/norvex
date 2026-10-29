import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingDocument = Setting & Document;

// وثيقة وحيدة (key = 'main') فيها إعدادات الوكالة كاملة
@Schema({ timestamps: true })
export class Setting {
  @Prop({ required: true, unique: true, default: 'main' })
  key: string;

  @Prop() agencyName: string;
  @Prop() agencyAddress: string;
  @Prop() agencyPhone: string;

  @Prop() emailNotif: boolean;
  @Prop() newLead: boolean;
  @Prop() paymentReminders: boolean;
  @Prop() visitReminders: boolean;
  @Prop() contractUpdates: boolean;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
