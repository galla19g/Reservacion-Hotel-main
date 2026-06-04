import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { TipoHabitacion, EstadoHabitacion } from '../enums/room.enums';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  numero: string;

  @Column({
    type: 'enum',
    enum: TipoHabitacion,
  })
  tipo: TipoHabitacion;

  @Column('decimal', { precision: 10, scale: 2 })
  precio: number;

  @Column({
    type: 'enum',
    enum: EstadoHabitacion,
    default: EstadoHabitacion.DISPONIBLE,
  })
  estado: EstadoHabitacion;
}
