import { Module, forwardRef } from "@nestjs/common";
import { QueueController } from "./queue.controller";
import { QueueService } from "./queue.service";
import { AuthModule } from "../auth/auth.module";
import { CallsModule } from "../calls/calls.module";
import { SocketModule } from "../socket/socket.module";
import { CrmModule } from "../seed/crm.module";

@Module({
  imports: [AuthModule, CallsModule, forwardRef(() => SocketModule), CrmModule],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
