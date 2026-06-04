import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';
import { Role } from '../enums/role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'juan@hotel.com',
    description: 'Email válido del usuario',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;

  @ApiProperty({
    example: 'Juan Perez',
    description: 'Nombre completo del usuario',
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre: string;

  @ApiProperty({
    example: 'Segura123!',
    description: 'Contraseña mínimo 8 caracteres con mayúscula, número y símbolo',
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, {
    message: 'La contraseña debe tener mínimo 8 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'La contraseña debe contener mayúscula, minúscula, número y símbolo especial',
  })
  password: string;

  @ApiProperty({
    enum: Role,
    default: Role.CLIENTE,
    description: 'Rol del usuario en el sistema',
  })
  @IsEnum(Role, {
    message: 'El rol debe ser: ADMIN, RECEPCIONISTA o CLIENTE',
  })
  @IsOptional()
  rol?: Role;
}
