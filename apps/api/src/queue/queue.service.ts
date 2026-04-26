import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Customer, QueueState } from "@sadoo/types";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class QueueService {
  private customers: Map<string, Customer> = new Map();
  private positionCounter = 1;

  getAll(): Customer[] {
    return Array.from(this.customers.values()).filter(
      (c) => c.status === "waiting",
    );
  }

  getQueueState(): QueueState {
    const waitingCustomers = this.getAll();
    const totalWaiting = waitingCustomers.length;
    const averageWaitTime = this.calculateAverageWaitTime(waitingCustomers);

    return {
      customers: waitingCustomers,
      totalWaiting,
      averageWaitTime,
    };
  }

  addCustomer(data: { name: string; phone: string; reason: string }): Customer {
    const id = uuidv4();
    const customer: Customer = {
      id,
      name: data.name,
      phone: data.phone,
      reason: data.reason,
      queuePosition: this.positionCounter++,
      joinedAt: new Date(),
      status: "waiting",
      sessionId: this.generateSessionId(),
      profile: {
        needs: [],
        productInterest: [],
        mood: "neutral",
        summary: "",
        keywords: [],
        estimatedValue: 0,
        language: "uz",
      },
    };

    this.customers.set(id, customer);
    return customer;
  }

  getNextCustomer(): Customer | undefined {
    const waiting = this.getAll();
    if (waiting.length === 0) return undefined;

    // Sort by queue position, return first
    waiting.sort((a, b) => a.queuePosition - b.queuePosition);
    const next = waiting[0];
    next.status = "in_call";
    this.customers.set(next.id, next);
    return next;
  }

  getCustomer(id: string): Customer | undefined {
    return this.customers.get(id);
  }

  updateCustomerProfile(
    id: string,
    profile: Partial<Customer["profile"]>,
  ): Customer | undefined {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    customer.profile = { ...(customer.profile as any), ...(profile as any) };
    this.customers.set(id, customer);
    return customer;
  }

  assignToOperator(customerId: string, operatorId: string): void {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new InternalServerErrorException("Customer not found");
    }
    customer.assignedOperatorId = operatorId;
    customer.status = "in_call";
    this.customers.set(customerId, customer);
  }

  completeCall(customerId: string): void {
    const customer = this.customers.get(customerId);
    if (!customer) return;
    customer.status = "completed";
    this.customers.set(customerId, customer);
  }

  cancelCall(customerId: string): void {
    const customer = this.customers.get(customerId);
    if (!customer) return;
    customer.status = "cancelled";
    this.customers.set(customerId, customer);
  }

  private calculateAverageWaitTime(customers: Customer[]): number {
    if (customers.length === 0) return 0;
    const totalWait = customers.reduce((acc, c) => {
      const waitMs = Date.now() - new Date(c.joinedAt).getTime();
      return acc + waitMs / 1000; // seconds
    }, 0);
    return totalWait / customers.length;
  }

  private generateSessionId(): string {
    return `session_${uuidv4()}`;
  }
}
