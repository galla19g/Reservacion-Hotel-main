import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstudiantesController } from './estudiantes.controller';
import { EstudiantesService } from './estudiantes.service';
import { EstudianteEntity } from './entities/estudiante.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EstudianteEntity])],
  controllers: [EstudiantesController],
  providers: [EstudiantesService],
  exports: [EstudiantesService],
})
export class EstudiantesModule {}
