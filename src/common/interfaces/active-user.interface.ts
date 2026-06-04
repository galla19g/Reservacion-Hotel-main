import { Role } from '../../users/enums/role.enum';

export interface ActiveUser {
  userId: number;
  email: string;
  role: Role;
  nombre: string;
}
