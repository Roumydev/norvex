import { Transform } from 'class-transformer';

// '' (حقل فارغ عند الإضافة) -> undefined (ما نخزّنوش).
// null  -> يبقى null: معناه "امسح هذا الحقل" عند التعديل (PATCH)، وbuildUpdate يحوّلو لـ$unset.
export const EmptyToUndefined = () =>
  Transform(({ value }) => (value === '' ? undefined : value));
