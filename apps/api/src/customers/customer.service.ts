import { Injectable } from "@nestjs/common";
import { Customer, CustomerProfile, CustomerMemory } from "@sadoo/types";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CustomerService {
  private customers: Map<string, Customer> = new Map();
  private memories: Map<string, CustomerMemory> = new Map();

  getCustomer(id: string): Customer | undefined {
    return this.customers.get(id);
  }

  getCustomerByPhone(phone: string): Customer | undefined {
    return Array.from(this.customers.values()).find((c) => c.phone === phone);
  }

  getOrCreateMemory(phone: string): CustomerMemory {
    const existing = this.memories.get(phone);
    if (existing) return existing;

    const memory: CustomerMemory = {
      phoneNumber: phone,
      interactions: [],
      totalCalls: 0,
      totalPurchases: 0,
      loyaltyScore: 0,
      preferences: [],
      notes: "",
    };
    this.memories.set(phone, memory);
    return memory;
  }

  updateMemory(
    phone: string,
    updates: Partial<CustomerMemory>,
  ): CustomerMemory {
    const memory = this.getOrCreateMemory(phone);
    Object.assign(memory, updates);
    this.memories.set(phone, memory);
    return memory;
  }

  addInteraction(
    phone: string,
    record: Omit<import("@sadoo/types").InteractionRecord, "date">,
  ) {
    const memory = this.getOrCreateMemory(phone);
    const interaction: import("@sadoo/types").InteractionRecord = {
      ...record,
      date: new Date(),
    };
    memory.interactions.unshift(interaction);
    memory.totalCalls++;
    if (record.outcome === "sale") {
      memory.totalPurchases++;
    }
    this.memories.set(phone, memory);
    return memory;
  }

  setCustomerProfile(customerId: string, profile: CustomerProfile) {
    const customer = this.customers.get(customerId);
    if (customer) {
      customer.profile = profile;
      this.customers.set(customerId, customer);
    }
  }

  getAllCustomers(): Customer[] {
    return Array.from(this.customers.values());
  }
}
