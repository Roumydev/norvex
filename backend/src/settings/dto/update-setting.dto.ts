import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EmptyToUndefined } from '../../common/transforms';

export class UpdateSettingDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  agencyName?: string;

  // '' أو null => مسح القيمة (يتعالج في buildUpdate)
  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(250)
  agencyAddress?: string | null;

  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(40)
  agencyPhone?: string | null;

  @IsOptional() @IsBoolean() emailNotif?: boolean;
  @IsOptional() @IsBoolean() newLead?: boolean;
  @IsOptional() @IsBoolean() paymentReminders?: boolean;
  @IsOptional() @IsBoolean() visitReminders?: boolean;
  @IsOptional() @IsBoolean() contractUpdates?: boolean;
}
