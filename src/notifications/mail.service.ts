import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendReservationConfirmation(email: string, nombre: string, reservation: any) {
    try {
      this.logger.debug(`[EMAIL] Enviando confirmación a ${email} para reserva #${reservation.id}`);

      await this.mailerService.sendMail({
        to: email,
        subject: 'Confirmación de Reserva - StayBooker',
        template: './confirmation',
        context: {
          nombre,
          id: reservation.id,
          fechaInicio: reservation.fechaInicio,
          fechaFin: reservation.fechaFin,
          habitacion: reservation.habitacion.numero,
          precio: reservation.precio ?? reservation.habitacion.precio,
          precioTotal: reservation.precioTotal,
          desglose: reservation.desglose,
          logoUrl: reservation.logoUrl,
        },
      });

      this.logger.log(`[SUCCESS] Email de confirmación enviado a ${email}`);
    } catch (error) {
      this.logger.error(
        `[ERROR] Error enviando confirmación a ${email}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async sendReservationCancellation(email: string, nombre: string, reservation: any) {
    try {
      this.logger.debug(`[EMAIL] Enviando cancelación a ${email} para reserva #${reservation.id}`);

      await this.mailerService.sendMail({
        to: email,
        subject: 'Cancelación de Reserva - StayBooker',
        template: './cancellation',
        context: {
          nombre,
          id: reservation.id,
        },
      });

      this.logger.log(`[SUCCESS] Email de cancelación enviado a ${email}`);
    } catch (error) {
      this.logger.error(
        `[ERROR] Error enviando cancelación a ${email}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async sendReservationFinalization(email: string, nombre: string, reservation: any) {
    try {
      this.logger.debug(`[EMAIL] Enviando factura a ${email} para reserva #${reservation.id}`);

      await this.mailerService.sendMail({
        to: email,
        subject: 'Gracias por tu estancia - StayBooker',
        template: './finalization',
        context: {
          nombre,
          id: reservation.id,
          habitacion: reservation.habitacion.numero,
        },
      });

      this.logger.log(`[SUCCESS] Email de finalización enviado a ${email}`);
    } catch (error) {
      this.logger.error(
        `[ERROR] Error enviando factura a ${email}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}

