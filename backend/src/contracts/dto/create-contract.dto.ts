import { IsDateString, IsIn, IsMongoId, IsNumber, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { EmptyToUndefined } from '../../common/transforms';

export class CreateContractDto {
  @IsMongoId() property: string;
  @IsMongoId() client: string;
  @IsMongoId() agent: string;

  @IsIn(['Sale', 'Rent'])
  type: string;

  @IsNumber() @IsPositive() @Max(100_000_000_000)
  value: number;

  @IsOptional() @IsNumber() @Min(0)
  paid?: number;

  @IsOptional() @EmptyToUndefined() @IsDateString()
  startDate?: string;

  @IsOptional() @EmptyToUndefined() @IsDateString()
  endDate?: string;

  @IsOptional() @IsIn(['Draft', 'Pending', 'Active', 'Completed', 'Cancelled'])
  status?: string;
}