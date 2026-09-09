import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SystemRole } from '../../user/enums';
import { Type } from 'class-transformer';

export class RegisterRestaurantDTO {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  logoURL?: string;

  @IsString()
  @MinLength(1)
  primaryCountry!: string;
}

export class RegisterDTO {
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
  @IsEnum(SystemRole)
  role!: SystemRole;

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password is not strong enough. It must contain at least 8 characters, one uppercase letter, one lowercase letter, one number.',
    },
  )
  password!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterRestaurantDTO)
  restaurant?: RegisterRestaurantDTO;
}

export class LoginDTO {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ForgetResetDTO {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email!: string;
}

export class ResetPasswordDTO {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'OTP must be a 6-digit number',
  })
  otp!: string;

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password is not strong enough. It must contain at least 8 characters, one uppercase letter, one lowercase letter, one number.',
    },
  )
  newPassword!: string;
}
