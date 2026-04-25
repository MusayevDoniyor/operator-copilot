import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomerService } from './customer.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomersModule {}
