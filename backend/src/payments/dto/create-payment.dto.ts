import { IsDateString, IsIn, IsMongoId, IsNumber, IsOptional, IsPositive, Max } from 'class-validator';
import { EmptyToUndefined } from '../../common/transforms';

export class CreatePaymentDto {
  @IsMongoId()
  contract: string;

  @IsNumber() @IsPositive() @Max(100_000_000_000)
  amount: number;

  @IsDateString()
  dueDate: string;

  @IsOptional() @EmptyToUndefined() @IsDateString()
  paidDate?: string;

  @IsOptional() @IsIn(['Bank Transfer', 'Cash', 'Cheque', 'CCP / Bank'])
  method?: string;

  @IsOptional() @IsIn(['Paid', 'Pending', 'Overdue'])
  status?: string;
}