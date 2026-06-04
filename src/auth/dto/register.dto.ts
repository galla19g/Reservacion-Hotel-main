import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role } from '../../users/enums/role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'Juan Perez' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'juan@hotel.com' })
  @IsEmail({}, { message: 'Correo invalido' })
  email: string;

  @ApiProperty({ example: 'Segura123' })
  @IsString()
  @MinLength(6, { message: 'Minimo 6 caracteres' })
  password: string;

  @ApiProperty({ enum: Role, default: Role.CLIENTE, required: false })
  @IsEnum(Role)
  @IsOptional()
  rol?: Role;
}
