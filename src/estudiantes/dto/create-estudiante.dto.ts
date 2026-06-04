import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateEstudianteDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  apellido: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  codigo: string;
}
