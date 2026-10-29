import { IsEmail, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { EmptyToUndefined } from '../../common/transforms';

export class CreateAgentDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional() @EmptyToUndefined() @IsString() @Matches(/^\+?[0-9\s().-]{6,20}$/, { message: 'Invalid phone number' })
  phone?: string;

  @IsOptional() @IsIn(['Senior Agent', 'Agent', 'Junior Agent'])
  role?: string;

  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(80)
  city?: string;

  @IsOptional() @IsNumber() @Min(0) @Max(5)
  rating?: number;

  // عدّادات قديمة (الأرقام الحقيقية دروك تتحسب في الواجهة)
  @IsOptional() @IsNumber() @Min(0) properties?: number;
  @IsOptional() @IsNumber() @Min(0) activeLeads?: number;
  @IsOptional() @IsNumber() @Min(0) visits?: number;
  @IsOptional() @IsNumber() @Min(0) closedDeals?: number;
  @IsOptional() @IsNumber() @Min(0) revenue?: number;
}