import { IsEmail, IsNotEmpty, IsString, IsArray, IsOptional, IsEnum, IsPhoneNumber, MaxLength, MinLength } from 'class-validator';
import { MemberStatus } from '../enums';

export class CreateMemberDTO {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber()
  phone!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @MinLength(3)
  name!: string;

  @IsNotEmpty()
  @IsString()
  restaurantRole!: string;

  @IsArray()
  @IsOptional()
  branchIds!: number[];
}

export class UpdateMemberDTO {
  @IsString()
  @IsOptional()
  restaurantRole?: string;

  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @IsOptional()
  @IsArray()
  branchIds?: number[];
}
