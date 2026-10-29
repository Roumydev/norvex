import { IsEmail, IsIn, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { EmptyToUndefined } from '../../common/transforms';

export const LEAD_SOURCES = ['Instagram', 'Website', 'Facebook', 'Referral', 'Phone', 'Walk-in', 'Other'];
export const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Visit Scheduled', 'Negotiation', 'Won', 'Lost'];

export class CreateLeadDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  name: string;

  @IsOptional() @EmptyToUndefined() @IsString() @Matches(/^\+?[0-9\s().-]{6,20}$/, { message: 'Invalid phone number' })
  phone?: string;

  @IsOptional() @EmptyToUndefined() @IsEmail()
  email?: string;

  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(150)
  property?: string;

  @IsOptional() @IsNumber() @Min(0) @Max(100_000_000_000)
  budget?: number;

  @IsOptional() @IsIn(LEAD_SOURCES)
  source?: string;

  @IsOptional() @IsIn(LEAD_STAGES)
  stage?: string;

  @IsOptional() @EmptyToUndefined() @IsMongoId()
  agent?: string;
}