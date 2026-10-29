import { IsIn, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength, Min } from 'class-validator';
import { EmptyToUndefined } from '../../common/transforms';

export const PROPERTY_TYPES = ['Apartment', 'Villa', 'House', 'Office', 'Commercial', 'Land'];
export const PROPERTY_STATUSES = ['Available', 'Reserved', 'Sold', 'Rented'];

export class CreatePropertyDto {
  @IsString() @IsNotEmpty() @MaxLength(150)
  title: string;

  @IsString() @IsNotEmpty() @MaxLength(80)
  city: string;

  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(80)
  district?: string;

  @IsIn(PROPERTY_TYPES)
  type: string;

  @IsIn(['Sale', 'Rent'])
  txType: string;

  @IsNumber() @IsPositive() @Max(100_000_000_000)
  price: number;

  @IsOptional() @IsNumber() @Min(0) @Max(1_000_000)
  area?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(50)
  bedrooms?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(50)
  bathrooms?: number;

  @IsOptional() @IsIn(PROPERTY_STATUSES)
  status?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @EmptyToUndefined() @IsMongoId()
  agent?: string;
}