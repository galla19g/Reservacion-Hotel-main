import {
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({
    example: '2026-05-01',
    description: 'Fecha de inicio en formato YYYY-MM-DD',
  })
  @IsDateString(
    { strict: true },
    { message: 'Fecha de inicio debe ser válida (YYYY-MM-DD)' }
  )
  fechaInicio: string;

  @ApiProperty({
    example: '2026-05-05',
    description: 'Fecha de fin en formato YYYY-MM-DD',
  })
  @IsDateString(
    { strict: true },
    { message: 'Fecha de fin debe ser válida (YYYY-MM-DD)' }
  )
  fechaFin: string;

  @ApiProperty({
    example: 1,
    description: 'ID de la habitación a reservar',
  })
  @IsInt({ message: 'habitacionId debe ser un número entero' })
  @Min(1, { message: 'habitacionId debe ser mayor a 0' })
  habitacionId: number;

  @ApiProperty({
    example: 1,
    description: 'Solo requerido si el RECEPCIONISTA crea la reserva por el cliente',
  })
  @IsInt({ message: 'clienteId debe ser un número entero' })
  @Min(1, { message: 'clienteId debe ser mayor a 0' })
  @IsOptional()
  clienteId?: number;
}
