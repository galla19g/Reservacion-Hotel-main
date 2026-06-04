import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ActiveUser } from '../common/interfaces/active-user.interface';
import { Request as ExpressRequest } from 'express';
import { EstadoReserva } from './enums/reservation-status.enum';

interface RequestWithUser extends ExpressRequest {
  user: ActiveUser;
}

@ApiTags('Reservas')
@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 reservas por minuto
  @Roles(Role.ADMIN, Role.CLIENTE, Role.RECEPCIONISTA)
  @ApiOperation({
    summary: 'Crear una reserva',
    description:
      'Crea una nueva reserva. Dispara una notificación por Socket (bookingCreated) y envía un correo de confirmación (hbs) al cliente. Rate limit: 5 reservas por minuto.',
  })
  create(
    @Body() createReservationDto: CreateReservationDto,
    @Request() req: RequestWithUser,
  ) {
    return this.reservationsService.create(createReservationDto, req.user);
  }

  @Get()
  @Roles(Role.ADMIN, Role.RECEPCIONISTA, Role.CLIENTE)
  @ApiOperation({
    summary:
      'Listar reservas (ADMIN/RECEPCIONISTA ven todas, CLIENTE solo las suyas)',
    description: 'Soporta paginación y filtros avanzados',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Número de página (por defecto: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Cantidad de registros por página (por defecto: 20, máximo: 100)',
  })
  @ApiQuery({
    name: 'estado',
    enum: EstadoReserva,
    required: false,
    description: 'Filtrar por estado de reserva',
  })
  @ApiQuery({
    name: 'fechaInicio',
    type: String,
    required: false,
    description: 'Filtrar reservas desde una fecha (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'fechaFin',
    type: String,
    required: false,
    description: 'Filtrar reservas hasta una fecha (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'clienteId',
    type: Number,
    required: false,
    description: 'Filtrar por cliente (solo para ADMIN/RECEPCIONISTA)',
  })
  findAll(
    @Request() req: RequestWithUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('estado') estado?: EstadoReserva,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('clienteId') clienteId?: number,
  ) {
    // Validar paginación
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

    return this.reservationsService.findAll(
      req.user,
      { page: pageNum, limit: limitNum },
      { estado, fechaInicio, fechaFin, clienteId },
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.RECEPCIONISTA, Role.CLIENTE)
  @ApiOperation({ summary: 'Consultar reserva por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.reservationsService.findOne(id, req.user);
  }

  @Patch(':id/cancelar')
  @Roles(Role.CLIENTE, Role.ADMIN)
  @ApiOperation({
    summary: 'Cancelar una reserva',
    description:
      'Cancela una reserva existente. Envía un correo de cancelación (hbs) al cliente.',
  })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.reservationsService.cancel(id, req.user);
  }

  @Patch(':id/finalizar')
  @Roles(Role.RECEPCIONISTA)
  @ApiOperation({
    summary: 'Finalizar una reserva (Checkout)',
    description:
      'Marca la reserva como finalizada y libera la habitación. Envía un correo de agradecimiento con factura digital (hbs).',
  })
  finish(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.finish(id);
  }
}
