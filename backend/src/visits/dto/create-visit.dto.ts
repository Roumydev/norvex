import { IsDateString, IsIn, IsMongoId, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { EmptyToUndefined } from '../../common/transforms';

export class CreateVisitDto {
  @IsMongoId() client: string;
  @IsMongoId() property: string;
  @IsMongoId() agent: string;

  @IsDateString()
  date: string;

  @IsOptional() @EmptyToUndefined() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time must be in HH:mm format' })
  time?: string;

  @IsOptional() @IsIn(['Scheduled', 'Completed', 'Cancelled', 'No-show'])
  status?: string;

  @IsOptional() @EmptyToUndefined() @IsString() @MaxLength(1000)
  notes?: string;
}