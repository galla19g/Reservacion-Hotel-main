import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../users/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existe = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existe) throw new ConflictException('El correo ya esta registrado');
    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hash,
      rol: dto.rol ?? Role.CLIENTE,
    });
    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return { message: 'Usuario registrado', usuario: result };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Credenciales invalidas');
    const valido = await bcrypt.compare(dto.password, user.password);
    if (!valido) throw new UnauthorizedException('Credenciales invalidas');
    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      rol: user.rol,
    });
    const { password, ...datos } = user;
    return { access_token: token, usuario: datos };
  }

  async getPerfil(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    const { password, ...perfil } = user;
    return perfil;
  }
}
