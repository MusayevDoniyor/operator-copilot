import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerService } from './customer.service';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  getAll() {
    return this.customerService.getAllCustomers();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.customerService.getCustomer(id);
  }

  @Get('phone/:phone')
  getByPhone(@Param('phone') phone: string) {
    return this.customerService.getCustomerByPhone(phone);
  }

  @Get('memory/:phone')
  getMemory(@Param('phone') phone: string) {
    return this.customerService.getOrCreateMemory(phone);
  }
}
