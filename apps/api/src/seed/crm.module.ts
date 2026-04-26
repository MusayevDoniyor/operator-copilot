import { Module } from "@nestjs/common";
import { CrmController } from "./crm.controller";
import { CrmService } from "./crm.service";
import { AnalyticsService } from "./analytics.service";

@Module({
  controllers: [CrmController],
  providers: [CrmService, AnalyticsService],
  exports: [CrmService, AnalyticsService],
})
export class CrmModule {}
