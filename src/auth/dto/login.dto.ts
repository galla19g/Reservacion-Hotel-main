import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'juan@hotel.com',
    description: 'Email registrado en el sistema',
  })
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  email: string;

  @ApiProperty({
    example: 'Segura123!',
    description: 'Contraseña del usuario',
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, {
    message: 'La contraseña debe tener mínimo 8 caracteres',
  })
  password: string;
}
