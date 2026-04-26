import { Module, forwardRef } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { CallsModule } from "../calls/calls.module";
import { QueueModule } from "../queue/queue.module";
import { CustomersModule } from "../customers/customers.module";
import { FormulasModule } from "../formulas/formulas.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    CallsModule,
    forwardRef(() => QueueModule),
    CustomersModule,
    FormulasModule,
    AuthModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
