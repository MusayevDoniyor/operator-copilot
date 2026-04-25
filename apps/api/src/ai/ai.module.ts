import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { CustomerModule } from '../customers/customers.module';
import { FormulasModule } from '../formulas/formulas.module';

@Module({
  imports: [CustomerModule, FormulasModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
