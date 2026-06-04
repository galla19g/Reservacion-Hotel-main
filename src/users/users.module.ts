import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { BootstrapService } from './bootstrap.service';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), RoomsModule],
  controllers: [UsersController],
  providers: [UsersService, BootstrapService],
  exports: [UsersService],
})
export class UsersModule {}
