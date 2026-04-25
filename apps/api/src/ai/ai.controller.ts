import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { CustomerService } from '../customers/customer.service';
import { FormulasService } from '../formulas/formulas.service';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly customerService: CustomerService,
    private readonly formulasService: FormulasService,
  ) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze call transcript and provide AI guidance' })
  analyze(
    @Body()
    body: {
      callId: string;
      transcript: string;
      customerId: string;
    },
  ) {
    const customer = this.customerService.getCustomer(body.customerId);
    const formulas = this.formulasService.getAllFormulas();

    return this.aiService.analyzeTranscript(
      body.transcript,
      customer?.profile || {
        needs: [],
        productInterest: [],
        mood: 'neutral',
        summary: '',
        keywords: [],
        estimatedValue: 0,
        language: 'uz',
      },
      formulas,
    );
  }

  @Post('profile')
  @ApiOperation({ summary: 'Build customer profile from chat history' })
  buildProfile(
    @Body()
    body: { chatHistory: string; customerName: string },
  ) {
    return this.aiService.buildCustomerProfile(
      body.chatHistory,
      body.customerName,
    );
  }
}
