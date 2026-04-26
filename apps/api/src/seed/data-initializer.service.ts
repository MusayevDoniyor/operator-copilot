import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { SeedService } from "./seed.data";
import { CrmService } from "./crm.service";
import { FormulasService } from "../formulas/formulas.service";

@Injectable()
export class DataInitializer implements OnApplicationBootstrap {
  constructor(
    private readonly seedService: SeedService,
    private readonly crmService: CrmService,
    private readonly formulasService: FormulasService,
  ) {}

  async onApplicationBootstrap() {
    console.log("🚀 Seeding production data...");

    // Seed all data
    const result = this.seedService.seedAllData();

    // Initialize CRM service with seeded data
    this.crmService.initialize(
      this.seedService.getClients(),
      this.seedService.getCalls(),
    );

    // Extract winning formulas from successful call history
    const successfulCalls = this.seedService
      .getCalls()
      .filter((c) => c.checklistScore >= 83 && c.saleResult === "Completed");
    if (successfulCalls.length > 0) {
      this.formulasService.extractFormulasFromHistory(successfulCalls);
      console.log(
        `✅ Extracted ${successfulCalls.length} successful call patterns into formulas`,
      );
    }

    console.log(
      `✅ Data seeding complete: ${result.clientsCount} clients, ${result.callsCount} calls`,
    );
  }
}
