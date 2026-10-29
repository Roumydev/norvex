import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from './entities/setting.entity';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { buildUpdate } from '../common/build-update';

export const SETTINGS_DEFAULTS = {
  agencyName: 'Norvex Real Estate Agency',
  agencyAddress: '',
  agencyPhone: '',
  emailNotif: true,
  newLead: true,
  paymentReminders: true,
  visitReminders: true,
  contractUpdates: false,
};

type SettingsShape = typeof SETTINGS_DEFAULTS;

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>,
  ) {}

  // نرجعو دايما الشكل الكامل: القيم المحفوظة فوق الافتراضيات
  private shape(doc: Partial<SettingsShape> | null): SettingsShape {
    const out: Record<string, unknown> = { ...SETTINGS_DEFAULTS };
    if (doc) {
      for (const k of Object.keys(SETTINGS_DEFAULTS)) {
        const v = (doc as Record<string, unknown>)[k];
        if (v !== undefined && v !== null) out[k] = v;
      }
    }
    return out as SettingsShape;
  }

  async get() {
    const doc = await this.settingModel.findOne({ key: 'main' }).lean().exec();
    return this.shape(doc);
  }

  async update(dto: UpdateSettingDto) {
    const update = buildUpdate(dto, ['agencyAddress', 'agencyPhone']);
    const doc = await this.settingModel
      .findOneAndUpdate(
        { key: 'main' },
        { ...update, $setOnInsert: { key: 'main' } },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    return this.shape(doc);
  }

  // إعادة للافتراضي = نمسحو الوثيقة
  async reset() {
    await this.settingModel.deleteOne({ key: 'main' }).exec();
    return this.shape(null);
  }
}
