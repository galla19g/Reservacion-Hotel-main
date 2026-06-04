import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { EstudiantesService } from './estudiantes.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { EstudianteEntity } from './entities/estudiante.entity';

@Controller('estudiantes')
export class EstudiantesController {
  constructor(private readonly estudiantesService: EstudiantesService) {}

  @Post()
  async create(
    @Body() createEstudianteDto: CreateEstudianteDto,
  ): Promise<EstudianteEntity> {
    return this.estudiantesService.create(createEstudianteDto);
  }

  @Get()
  async findAll(): Promise<EstudianteEntity[]> {
    return this.estudiantesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<EstudianteEntity | null> {
    return this.estudiantesService.findOne(id);
  }

  @Get('codigo/:codigo')
  async findByCodigo(@Param('codigo') codigo: string): Promise<EstudianteEntity | null> {
    return this.estudiantesService.findByCodigo(codigo);
  }
}
