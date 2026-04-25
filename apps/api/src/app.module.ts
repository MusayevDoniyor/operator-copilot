import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';
import { CallsModule } from './calls/calls.module';
import { AiModule } from './ai/ai.module';
import { CustomersModule } from './customers/customers.module';
import { SocketModule } from './socket/socket.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FormulasModule } from './formulas/formulas.module';
import { envSchema } from './config/env-schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envSchema,
    }),
    AuthModule,
    QueueModule,
    CallsModule,
    AiModule,
    CustomersModule,
    SocketModule,
    DashboardModule,
    FormulasModule,
  ],
})
export class AppModule {}
