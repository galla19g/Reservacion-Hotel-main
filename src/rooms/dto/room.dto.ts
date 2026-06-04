import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { TipoHabitacion, EstadoHabitacion } from '../enums/room.enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({
    example: '101',
    description: 'Número de habitación',
  })
  @IsString({ message: 'El número de habitación debe ser texto' })
  @MaxLength(10, { message: 'El número no puede exceder 10 caracteres' })
  numero: string;

  @ApiProperty({
    enum: TipoHabitacion,
    example: TipoHabitacion.INDIVIDUAL,
    description: 'Tipo de habitación',
  })
  @IsEnum(TipoHabitacion, {
    message: 'El tipo debe ser: individual, doble o suite',
  })
  tipo: TipoHabitacion;

  @ApiProperty({
    example: 50.0,
    description: 'Precio por noche en USD',
  })
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'El precio debe ser un número válido' }
  )
  @Min(0.01, { message: 'El precio debe ser mayor a 0' })
  @Max(10000, { message: 'El precio no puede exceder 10000' })
  precio: number;

  @ApiProperty({
    enum: EstadoHabitacion,
    default: EstadoHabitacion.DISPONIBLE,
    description: 'Estado actual de la habitación',
  })
  @IsEnum(EstadoHabitacion, {
    message: 'El estado debe ser: disponible, ocupada o mantenimiento',
  })
  @IsOptional()
  estado?: EstadoHabitacion;
}

export class UpdateRoomDto extends CreateRoomDto {}
