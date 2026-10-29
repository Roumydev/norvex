import { IsEmail, IsIn, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { EmptyToUndefined } from '../../common/transforms';

export class CreateClientDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  name: string;

  @IsString() @Matches(/^\+?[0-9\s().-]{6,20}$/, { message: 'Invalid phone number' })
  phone: string;

  @IsOptional() @EmptyToUndefined() @IsEmail()
  email?: string;

  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(60)
  interestedIn?: string;

  @IsOptional() @IsNumber() @Min(0) @Max(100_000_000_000)
  budget?: number;

  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(80)
  preferredCity?: string;

  @IsOptional() @EmptyToUndefined() @IsMongoId()
  agent?: string;

  @IsOptional() @IsIn(['Active', 'Inactive'])
  status?: string;
}