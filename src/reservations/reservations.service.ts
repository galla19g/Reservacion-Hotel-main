import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/reservation.dto';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';
import { EstadoReserva } from './enums/reservation-status.enum';
import { EstadoHabitacion } from '../rooms/enums/room.enums';
import { Role } from '../users/enums/role.enum';
import { ActiveUser } from '../common/interfaces/active-user.interface';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

export interface PaginationDto {
  page: number;
  limit: number;
}

export interface ReservationFilterDto {
  estado?: EstadoReserva;
  fechaInicio?: string;
  fechaFin?: string;
  clienteId?: number;
}

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    private usersService: UsersService,
    private roomsService: RoomsService,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
    currentUser: ActiveUser,
  ): Promise<Reservation> {
    const { fechaInicio, fechaFin, habitacionId, clienteId } =
      createReservationDto;
    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.logger.debug(
      `[CREATE_RESERVATION] Usuario ${currentUser.userId} (${currentUser.role}) iniciando reserva`
    );

    if (start >= end) {
      this.logger.warn(
        `[VALIDATION_ERROR] Fechas inválidas: inicio=${start} >= fin=${end}`
      );
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la de fin',
      );
    }
    if (start < today) {
      this.logger.warn(
        `[VALIDATION_ERROR] Intento de reserva en fecha pasada: ${start}`
      );
      throw new BadRequestException(
        'No se permiten reservas en fechas pasadas',
      );
    }

    const room = await this.roomsService.findOne(habitacionId);
    if (room.estado === EstadoHabitacion.MANTENIMIENTO) {
      this.logger.warn(
        `[VALIDATION_ERROR] Habitación ${habitacionId} en mantenimiento`
      );
      throw new BadRequestException('La habitación está en mantenimiento');
    }

    // Overbooking check
    const overlap = await this.reservationsRepository.findOne({
      where: [
        {
          habitacion: { id: habitacionId },
          estado: EstadoReserva.ACTIVA,
          fechaInicio: Between(start, end),
        },
        {
          habitacion: { id: habitacionId },
          estado: EstadoReserva.ACTIVA,
          fechaFin: Between(start, end),
        },
        {
          habitacion: { id: habitacionId },
          estado: EstadoReserva.ACTIVA,
          fechaInicio: LessThan(start),
          fechaFin: MoreThan(end),
        },
      ],
    });

    if (overlap) {
      this.logger.warn(
        `[OVERBOOKING] Conflicto en habitación ${habitacionId} para ${start} - ${end}`
      );
      throw new BadRequestException(
        'La habitación ya está ocupada en el rango de fechas solicitado',
      );
    }

    let client: User | null;
    if (currentUser.role === Role.CLIENTE) {
      client = await this.usersService.findOneById(currentUser.userId);
    } else {
      if (!clienteId)
        throw new BadRequestException('Debe especificar un clienteId');
      client = await this.usersService.findOneById(clienteId);
    }

    if (!client) throw new NotFoundException('Cliente no encontrado');

    const reservation = this.reservationsRepository.create({
      fechaInicio: start,
      fechaFin: end,
      habitacion: room,
      cliente: client,
      estado: EstadoReserva.ACTIVA,
    });

    // Precio completo (Opción 2): subtotal + impuestos + cargo servicio
    const msPerDay = 1000 * 60 * 60 * 24;
    const noches = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / msPerDay),
    );

    const precioPorNoche = Number(room.precio);
    const subtotal = precioPorNoche * noches;

    // Opción 2 estándar: IVA 19% + cargo servicio 5%
    const ivaRate = 0.19;
    const servicioRate = 0.05;

    const impuestos = subtotal * ivaRate;
    const cargoServicio = subtotal * servicioRate;
    const precioTotal = subtotal + impuestos + cargoServicio;

    // Enriquecemos el objeto para que el email/socket tenga todo lo necesario.
    const precioRedondo = (n: number) => Math.round(n * 100) / 100;
    (reservation as any).desglose = {
      noches,
      precioPorNoche: precioRedondo(precioPorNoche),
      subtotal: precioRedondo(subtotal),
      impuestos: precioRedondo(impuestos),
      cargoServicio: precioRedondo(cargoServicio),
    };
    (reservation as any).precioTotal = precioRedondo(precioTotal);
    (reservation as any).precio = precioRedondo(precioTotal);
    // Logotipo oficial (si el frontend/backend lo quiere por URL)
    (reservation as any).logoUrl = process.env.MAIL_LOGO_URL ?? undefined;

    const saved = await this.reservationsRepository.save(reservation);
    this.logger.log(
      `[AUDIT] Usuario ${currentUser.userId} (${currentUser.role}) creó reserva #${saved.id} ` +
      `para cliente ${client.email} (habitación ${habitacionId}, total: $${precioRedondo(precioTotal)})`
    );

    await this.roomsService.updateEstado(room.id, EstadoHabitacion.OCUPADA);
    this.logger.debug(`Habitación ${habitacionId} actualizada a estado OCUPADA`);

    // Notificar creación
    try {
      await this.notificationsService.notifyCreateReservation(saved);
      this.logger.log(
        `[SUCCESS] Reserva #${saved.id} notificada exitosamente. Email enviado a ${saved.cliente.email}`
      );
    } catch (error) {
      this.logger.error(
        `[ERROR] Notificando reserva #${saved.id}: ${error.message}`,
        error.stack
      );
      // No lanzar error - la reserva ya fue creada
    }

    return saved;
  }

  async findAll(
    user: ActiveUser,
    pagination?: PaginationDto,
    filters?: ReservationFilterDto,
  ): Promise<{ data: Reservation[]; total: number; page: number }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    let query = this.reservationsRepository.createQueryBuilder('r');

    // Aplicar filtros según rol
    if (user.role === Role.CLIENTE) {
      query = query.where('r.cliente.id = :clienteId', {
        clienteId: user.userId,
      });
    }

    // Aplicar filtros adicionales
    if (filters?.estado) {
      query = query.andWhere('r.estado = :estado', { estado: filters.estado });
    }

    if (filters?.fechaInicio) {
      query = query.andWhere('r.fechaInicio >= :fechaInicio', {
        fechaInicio: new Date(filters.fechaInicio),
      });
    }

    if (filters?.fechaFin) {
      query = query.andWhere('r.fechaFin <= :fechaFin', {
        fechaFin: new Date(filters.fechaFin),
      });
    }

    if (filters?.clienteId && user.role !== Role.CLIENTE) {
      query = query.andWhere('r.cliente.id = :clienteId', {
        clienteId: filters.clienteId,
      });
    }

    const [data, total] = await query
      .orderBy('r.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    this.logger.debug(
      `[QUERY] Usuario ${user.userId} consultó ${data.length} reservas (total: ${total}, página ${page})`
    );

    return { data, total, page };
  }

  async findOne(id: number, user: ActiveUser): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOne({
      where: { id },
    });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');

    if (user.role === Role.CLIENTE && reservation.cliente.id !== user.userId) {
      this.logger.warn(
        `[SECURITY] Usuario ${user.userId} intentó acceder a reserva #${id} sin permisos`
      );
      throw new ForbiddenException('No tienes permiso para ver esta reserva');
    }
    return reservation;
  }

  async cancel(id: number, user: ActiveUser): Promise<Reservation> {
    const reservation = await this.findOne(id, user);
    if (user.role === Role.CLIENTE && reservation.cliente.id !== user.userId) {
      this.logger.warn(
        `[SECURITY] Usuario ${user.userId} intentó cancelar reserva #${id} sin permisos`
      );
      throw new ForbiddenException('Solo puedes cancelar tus propias reservas');
    }

    reservation.estado = EstadoReserva.CANCELADA;
    const saved = await this.reservationsRepository.save(reservation);
    this.logger.warn(
      `[AUDIT] Reserva #${id} cancelada por usuario ${user.userId} (${user.role})`
    );

    await this.roomsService.updateEstado(
      reservation.habitacion.id,
      EstadoHabitacion.DISPONIBLE,
    );
    this.logger.debug(`Habitación ${reservation.habitacion.id} liberada`);

    // Notificar cancelación
    try {
      await this.notificationsService.notifyCancelReservation(saved);
      this.logger.log(`Cancelación notificada para reserva #${id}`);
    } catch (error) {
      this.logger.error(
        `[ERROR] Notificando cancelación de reserva #${id}: ${error.message}`,
        error.stack
      );
    }

    return saved;
  }

  async finish(id: number): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOne({
      where: { id },
    });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');

    reservation.estado = EstadoReserva.FINALIZADA;
    const saved = await this.reservationsRepository.save(reservation);
    this.logger.log(`[AUDIT] Reserva #${id} finalizada (Checkout completado)`);

    await this.roomsService.updateEstado(
      reservation.habitacion.id,
      EstadoHabitacion.DISPONIBLE,
    );

    // Notificar finalización (Factura digital)
    try {
      await this.notificationsService.notifyFinishReservation(saved);
      this.logger.log(`Factura digital enviada para reserva #${id}`);
    } catch (error) {
      this.logger.error(
        `[ERROR] Enviando factura para reserva #${id}: ${error.message}`,
        error.stack
      );
    }

    return saved;
  }
}
