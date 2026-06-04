import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstudianteEntity } from './entities/estudiante.entity';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';

@Injectable()
export class EstudiantesService {
  constructor(
    @InjectRepository(EstudianteEntity)
    private estudiantesRepository: Repository<EstudianteEntity>,
  ) {}

  async create(createEstudianteDto: CreateEstudianteDto): Promise<EstudianteEntity> {
    const estudiante = this.estudiantesRepository.create(createEstudianteDto);
    return this.estudiantesRepository.save(estudiante);
  }

  async findAll(): Promise<EstudianteEntity[]> {
    return this.estudiantesRepository.find();
  }

  async findOne(id: string): Promise<EstudianteEntity | null> {
    return this.estudiantesRepository.findOne({ where: { id } });
  }

  async findByCodigo(codigo: string): Promise<EstudianteEntity | null> {
    return this.estudiantesRepository.findOne({ where: { codigo } });
  }
}
