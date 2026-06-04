import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';
import { EstadoHabitacion } from './enums/room.enums';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    private notificationsService: NotificationsService,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const existing = await this.roomsRepository.findOne({
      where: { numero: createRoomDto.numero },
    });
    if (existing) {
      throw new ConflictException('El número de habitación ya existe');
    }
    const room = this.roomsRepository.create(createRoomDto);
    return this.roomsRepository.save(room);
  }

  async findAll(): Promise<Room[]> {
    return this.roomsRepository.find();
  }

  async findOne(id: number): Promise<Room> {
    const room = await this.roomsRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException(`Habitación con ID ${id} no encontrada`);
    }
    return room;
  }

  async update(id: number, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);
    Object.assign(room, updateRoomDto);
    return this.roomsRepository.save(room);
  }

  async updateEstado(id: number, estado: EstadoHabitacion): Promise<Room> {
    const room = await this.findOne(id);
    room.estado = estado;
    const saved = await this.roomsRepository.save(room);

    // Broadcast del cambio de estado
    await this.notificationsService.notifyRoomStatusChanged(saved);

    return saved;
  }
}
