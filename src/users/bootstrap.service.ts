import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { UsersService } from './users.service';
import { RoomsService } from '../rooms/rooms.service';
import { Role } from './enums/role.enum';
import { TipoHabitacion, EstadoHabitacion } from '../rooms/enums/room.enums';

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  constructor(
    private readonly usersService: UsersService,
    private readonly roomsService: RoomsService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedUsers();
    await this.seedRooms();
  }

  // ──────────────────────────────────────────
  // USUARIOS DE PRUEBA
  // ──────────────────────────────────────────
  private async seedUsers() {
    const users = [
      {
        email: 'admin@hotel.com',
        nombre: 'Administrador Principal',
        password: 'admin123',
        rol: Role.ADMIN,
      },
      {
        email: 'recepcion@hotel.com',
        nombre: 'María Recepcionista',
        password: 'recepcion123',
        rol: Role.RECEPCIONISTA,
      },
      {
        email: 'cliente1@gmail.com',
        nombre: 'Carlos Cliente',
        password: 'cliente123',
        rol: Role.CLIENTE,
      },
    ];

    for (const u of users) {
      const exists = await this.usersService.findOneByEmail(u.email);
      if (!exists) {
        await this.usersService.create(u);
        console.log(`[Seed] Usuario creado: ${u.email} / ${u.password} (${u.rol})`);
      }
    }
  }

  // ──────────────────────────────────────────
  // HABITACIONES DE PRUEBA
  // ──────────────────────────────────────────
  private async seedRooms() {
    const rooms = [
      {
        numero: '101',
        tipo: TipoHabitacion.INDIVIDUAL,
        precio: 80000,
        estado: EstadoHabitacion.DISPONIBLE,
      },
      {
        numero: '202',
        tipo: TipoHabitacion.DOBLE,
        precio: 150000,
        estado: EstadoHabitacion.DISPONIBLE,
      },
      {
        numero: '303',
        tipo: TipoHabitacion.SUITE,
        precio: 320000,
        estado: EstadoHabitacion.DISPONIBLE,
      },
      {
        numero: '104',
        tipo: TipoHabitacion.INDIVIDUAL,
        precio: 85000,
        estado: EstadoHabitacion.MANTENIMIENTO,
      },
      {
        numero: '205',
        tipo: TipoHabitacion.DOBLE,
        precio: 160000,
        estado: EstadoHabitacion.OCUPADA,
      },
    ];

    for (const r of rooms) {
      try {
        await this.roomsService.create(r);
        console.log(`[Seed] Habitación creada: #${r.numero} - ${r.tipo} - $${r.precio} - ${r.estado}`);
      } catch {
        // Ya existe, no hacer nada
      }
    }
  }
}
