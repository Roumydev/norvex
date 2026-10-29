import { BadRequestException } from '@nestjs/common';

/**
 * يحوّل الـDTO إلى update لـMongo:
 *  - قيمة عادية  -> $set
 *  - null        -> $unset (مسح الحقل)، ومسموح فقط للحقول الاختيارية (clearable)
 *  - undefined   -> نتجاهلو (ما تبدّلش)
 */
export function buildUpdate(dto: object, clearable: string[]) {
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, ''> = {};
  for (const [key, value] of Object.entries(dto)) {
    if (value === undefined) continue;
    if (value === null) {
      if (!clearable.includes(key)) throw new BadRequestException(`${key} cannot be empty`);
      $unset[key] = '';
    } else {
      $set[key] = value;
    }
  }
  const update: Record<string, unknown> = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($unset).length) update.$unset = $unset;
  return update;
}
