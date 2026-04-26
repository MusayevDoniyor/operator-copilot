import { Module, forwardRef } from "@nestjs/common";
import { SocketGateway } from "./socket.gateway";
import { CallsModule } from "../calls/calls.module";
import { QueueModule } from "../queue/queue.module";
import { AiModule } from "../ai/ai.module";
import { CustomersModule } from "../customers/customers.module";
import { DashboardModule } from "../dashboard/dashboard.module";
import { FormulasModule } from "../formulas/formulas.module";
import { AuthModule } from "../auth/auth.module";
import { CrmModule } from "../seed/crm.module";

@Module({
  imports: [
    CallsModule,
    forwardRef(() => QueueModule),
    AiModule,
    CustomersModule,
    forwardRef(() => DashboardModule),
    FormulasModule,
    AuthModule,
    CrmModule,
  ],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
