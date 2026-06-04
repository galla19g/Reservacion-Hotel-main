import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { MailService } from './mail.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly gateway: NotificationsGateway,
    private readonly mailService: MailService,
  ) {}

  async notifyCreateReservation(reservation: any) {
    try {
      // 1. Notificar por Sockets (bookingCreated)
      this.gateway.notifyBookingCreated(reservation);
      this.logger.debug(
        `[SOCKET] Evento 'bookingCreated' enviado para reserva #${reservation.id}`
      );

      // 2. Enviar correo de confirmación (template hbs)
      if (reservation.cliente && reservation.cliente.email) {
        try {
          await this.mailService.sendReservationConfirmation(
            reservation.cliente.email,
            reservation.cliente.nombre,
            reservation,
          );
          this.logger.log(
            `[EMAIL] Email de confirmación enviado a ${reservation.cliente.email} para reserva #${reservation.id}`
          );
        } catch (emailError) {
          this.logger.error(
            `[EMAIL_ERROR] Fallo al enviar confirmación a ${reservation.cliente.email}: ${emailError.message}`,
            emailError.stack
          );
          // No relanzar - el socket ya fue notificado
        }
      }
    } catch (error) {
      this.logger.error(
        `[CRITICAL] Error en notifyCreateReservation: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async notifyCancelReservation(reservation: any) {
    try {
      this.logger.log(
        `[NOTIFY] Iniciando notificación de cancelación para reserva #${reservation.id}`
      );

      // Enviar correo de cancelación
      if (reservation.cliente && reservation.cliente.email) {
        try {
          await this.mailService.sendReservationCancellation(
            reservation.cliente.email,
            reservation.cliente.nombre,
            reservation,
          );
          this.logger.log(
            `[EMAIL] Email de cancelación enviado a ${reservation.cliente.email}`
          );
        } catch (emailError) {
          this.logger.error(
            `[EMAIL_ERROR] Fallo al enviar cancelación: ${emailError.message}`,
            emailError.stack
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `[CRITICAL] Error en notifyCancelReservation: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async notifyFinishReservation(reservation: any) {
    try {
      this.logger.log(
        `[NOTIFY] Enviando factura digital para reserva #${reservation.id}`
      );

      // Enviar correo de finalización con "factura"
      if (reservation.cliente && reservation.cliente.email) {
        try {
          await this.mailService.sendReservationFinalization(
            reservation.cliente.email,
            reservation.cliente.nombre,
            reservation,
          );
          this.logger.log(
            `[EMAIL] Factura digital enviada a ${reservation.cliente.email}`
          );
        } catch (emailError) {
          this.logger.error(
            `[EMAIL_ERROR] Fallo al enviar factura: ${emailError.message}`,
            emailError.stack
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `[CRITICAL] Error en notifyFinishReservation: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async notifyRoomStatusChanged(room: any) {
    try {
      this.gateway.notifyRoomStatusChanged(room);
      this.logger.debug(
        `[SOCKET] Cambio de estado de habitación ${room.numero} a ${room.estado} notificado`
      );
    } catch (error) {
      this.logger.error(
        `[ERROR] Error notificando cambio de habitación: ${error.message}`,
        error.stack
      );
    }
  }
}
