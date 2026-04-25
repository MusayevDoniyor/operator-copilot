import { EntityPrimaryKeyColumn, Entity, Column, BeforeInsert } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @EntityPrimaryKeyColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'varchar', unique: true })
  username: string;

  @Column({ type: 'varchar' })
  @Exclude()
  password: string;

  @Column({ type: 'enum', enum: ['ADMIN', 'OPERATOR'], default: 'OPERATOR' })
  role: 'ADMIN' | 'OPERATOR';

  @Column({ type: 'boolean', default: false })
  isOnline: boolean;

  @Column({ type: 'varchar', nullable: true })
  currentCallId: string | null;

  @Column({ type: 'enum', enum: ['available', 'on_call', 'busy', 'offline'], default: 'available' })
  status: 'available' | 'on_call' | 'busy' | 'offline';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = require('uuid').v4();
  }
}
