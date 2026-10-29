import { IsEmail, IsIn, IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';
import { EmptyToUndefined } from '../../common/transforms';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsIn(['admin', 'agent'])
  role?: string;

  // ربط الحساب بملف وكيل (null = فك الربط في التعديل)
  @IsOptional()
  @EmptyToUndefined()
  @IsMongoId()
  agent?: string | null;
}