import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { Role } from '../users/enums/role.enum';

@WebSocketGateway({
  cors: { origin: '*' },
})
@UseGuards(WsJwtGuard)
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;
  private logger: Logger = new Logger('NotificationsGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private emitToRoles(event: string, payload: any, allowedRoles: Role[]) {
    for (const [, socket] of this.server.sockets.sockets) {
      const user = socket.data?.user;
      if (user?.role && allowedRoles.includes(user.role)) {
        socket.emit(event, payload);
      }
    }
  }

  // Notificación de nueva reserva (solo ADMIN/RECEPCIONISTA)
  notifyBookingCreated(reservation: any) {
    const payload = {
      message: 'Nueva reserva recibida',
      data: {
        reservaId: reservation.id,
        clienteNombre: reservation.cliente?.nombre,
        habitacionNumero: reservation.habitacion?.numero,
        habitacionEstado: reservation.habitacion?.estado,
        fechaInicio: reservation.fechaInicio,
        fechaFin: reservation.fechaFin,
      },
    };

    this.emitToRoles('bookingCreated', payload, [
      Role.ADMIN,
      Role.RECEPCIONISTA,
    ]);
  }

  // Notificación de cambio de estado de habitación (para todos los clientes)
  notifyRoomStatusChanged(room: any) {
    this.server.emit('roomStatusChanged', {
      message: `La habitación ${room.numero} ha cambiado su estado a ${room.estado}`,
      data: {
        roomId: room.id,
        numero: room.numero,
        estado: room.estado,
      },
    });
  }


  // Alerta de alta demanda (solapamiento)
  notifyHighDemand(roomId: number) {
    this.server.emit('highDemandAlert', {
      message: `¡Alta demanda! Varios usuarios consultando la habitación ${roomId}`,
      roomId,
    });
  }
}

