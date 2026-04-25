import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { CallsModule } from '../calls/calls.module';
import { QueueModule } from '../queue/queue.module';
import { AiModule } from '../ai/ai.module';
import { CustomersModule } from '../customers/customers.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { FormulasModule } from '../formulas/formulas.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    CallsModule,
    QueueModule,
    AiModule,
    CustomersModule,
    DashboardModule,
    FormulasModule,
    AuthModule,
  ],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
