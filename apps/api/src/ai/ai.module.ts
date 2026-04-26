import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { CustomersModule } from "../customers/customers.module";
import { FormulasModule } from "../formulas/formulas.module";
import { CrmModule } from "../seed/crm.module";
import { CallsModule } from "../calls/calls.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [CustomersModule, FormulasModule, CrmModule, CallsModule, AuthModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}

