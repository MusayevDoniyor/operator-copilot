import { Controller, Get, Param, Body, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FormulasService } from './formulas.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@sadoo/types';

@ApiTags('Formulas')
@Controller('formulas')
@UseGuards(JwtAuthGuard)
export class FormulasController {
  constructor(private readonly formulasService: FormulasService) {}

  @Get()
  @ApiOperation({ summary: 'Get all formulas with stats' })
  getAll() {
    return this.formulasService.getAllFormulas();
  }

  @Get('top')
  @ApiOperation({ summary: 'Get top performing formulas' })
  getTop(@Query('limit') limit?: string) {
    return this.formulasService.getTopFormulas(parseInt(limit) || 5);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get formulas by category' })
  getByCategory(@Param('category') category: string) {
    return this.formulasService.getByCategory(category as any);
  }

  @Post(':id/usage')
  @ApiOperation({ summary: 'Record formula usage and success' })
  recordUsage(
    @Param('id') id: string,
    @Body() body: { success: boolean },
  ) {
    this.formulasService.recordUsage(id, body.success);
    return { success: true };
  }
}
