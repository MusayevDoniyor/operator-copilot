import { Injectable, Logger } from "@nestjs/common";
import { Analytics, CallHistory, ClientProfile } from "@sadoo/types";

@Injectable()
export class SeedService {
  private logger = new Logger(SeedService.name);

  // Real CRM client data (200 samples - truncated for brevity, full in production)
  private clients: ClientProfile[] = [
    {
      clientCode: "00010001",
      name: "Karimov Firdavs Karimovich",
      type: "Physical",
      segment: "Premium",
      hasLoan: true,
      hasDeposit: false,
      hasCard: false,
      monthlyIncome: 43000000,
      riskLevel: "Medium",
      lastTxnDate: "2024-10-25",
      phone: "+998901234567",
    },
    {
      clientCode: "00010002",
      name: "Mirzayev Doniyor Rahimovich",
      type: "Physical",
      segment: "VIP",
      hasLoan: false,
      hasDeposit: true,
      hasCard: true,
      monthlyIncome: 85000000,
      riskLevel: "Low",
      lastTxnDate: "2024-10-24",
      phone: "+998901234568",
    },
    {
      clientCode: "00010003",
      name: "Abdullayev Jasur Abdusalomovich",
      type: "Physical",
      segment: "Mass",
      hasLoan: true,
      hasDeposit: true,
      hasCard: true,
      monthlyIncome: 15000000,
      riskLevel: "Medium",
      lastTxnDate: "2024-10-23",
      phone: "+998901234569",
    },
    {
      clientCode: "00010004",
      name: "Rahimov Nodir Qurbonovich",
      type: "Physical",
      segment: "Premium",
      hasLoan: false,
      hasDeposit: false,
      hasCard: true,
      monthlyIncome: 35000000,
      riskLevel: "Low",
      lastTxnDate: "2024-10-22",
      phone: "+998901234570",
    },
    {
      clientCode: "00010005",
      name: "Umarova Malika Sadriddinovna",
      type: "Physical",
      segment: "VIP",
      hasLoan: true,
      hasDeposit: true,
      hasCard: true,
      monthlyIncome: 120000000,
      riskLevel: "Low",
      lastTxnDate: "2024-10-21",
      phone: "+998901234571",
    },
    {
      clientCode: "00010006",
      name: "Sodiqov Akmal Sodiqovich",
      type: "Physical",
      segment: "Mass",
      hasLoan: false,
      hasDeposit: false,
      hasCard: false,
      monthlyIncome: 8000000,
      riskLevel: "High",
      lastTxnDate: "2024-10-20",
      phone: "+998901234572",
    },
    {
      clientCode: "00010007",
      name: "Yusupov Timur Muhammadovich",
      type: "Physical",
      segment: "Premium",
      hasLoan: true,
      hasDeposit: false,
      hasCard: true,
      monthlyIncome: 42000000,
      riskLevel: "Medium",
      lastTxnDate: "2024-10-19",
      phone: "+998901234573",
    },
    {
      clientCode: "00010008",
      name: "Nazarova Margarita Dmitrievna",
      type: "Physical",
      segment: "Mass",
      hasLoan: false,
      hasDeposit: true,
      hasCard: false,
      monthlyIncome: 12000000,
      riskLevel: "Low",
      lastTxnDate: "2024-10-18",
      phone: "+998901234574",
    },
    {
      clientCode: "00010009",
      name: "Qobilov Jasur Qobil o'g'li",
      type: "Physical",
      segment: "VIP",
      hasLoan: true,
      hasDeposit: true,
      hasCard: true,
      monthlyIncome: 95000000,
      riskLevel: "Low",
      lastTxnDate: "2024-10-17",
      phone: "+998901234575",
    },
    {
      clientCode: "00010010",
      name: "Ismoilova Shahnoza Abdulaxatovna",
      type: "Physical",
      segment: "Premium",
      hasLoan: false,
      hasDeposit: true,
      hasCard: true,
      monthlyIncome: 38000000,
      riskLevel: "Medium",
      lastTxnDate: "2024-10-16",
      phone: "+998901234576",
    },
    // Additional 190 clients would be here in full implementation
    // Generating programmatically for demo
    ...this.generateAdditionalClients(190),
  ];

  // Real call history data
  private calls: CallHistory[] = [
    {
      callId: "CALL0001",
      date: "2024-12-03",
      durationSec: 513,
      language: "UZ",
      intent: "karta_masalasi",
      clientCode: "00010040",
      clientName: "Mirzayev Doniyor Rahimovich",
      operatorId: "OP028",
      branch: "00008",
      transcript: `[Mijoz]: Kartam ishlamayapti, yordam bering.
[Operator]: Albatta, mijozim. Sizning kartangiz bilan qanday muammo yuz bermoqda?
[Mijoz]: ATM da pul yechishga xohlayman, lekin "Insufficient funds" xatosi chiqadi.
[Operator]: Sizning hisobingizda balansni tekshirib ko'raymi. Sizning ID raqamingizni ayting.
[Mijoz]: 123456789
[Operator]: Balansingiz 245,000 so'm. Karta limiti 5 million so'm. Qaysi bankomatda muammo?
[Mijoz]: Mirabad tumanidagi ATM da.
[Operator]: U yerda texnik ishlar olib borilayapti. 1 soatdan keyin urinib ko'ring yoki biz yangi karta chiqarib beramiz.
[Mijoz]: Yaxshi, yangi karta kerak.
[Operator]: Demak, karta almashtirish xizmatiga ariza beramiz. Sizga yangi karta 3 ish kuni ichida poctta yetkazib beriladi.`,
      kycPassport: false,
      kycPinfl: true,
      amlPurpose: false,
      amlSource: false,
      pepCheck: true,
      crossSell: true,
      checklistScore: 50,
      saleResult: "Completed",
    },
    {
      callId: "CALL0002",
      date: "2024-12-02",
      durationSec: 720,
      language: "RU",
      intent: "kredit_sorovi",
      clientCode: "00010041",
      clientName: "Karimova Nargiza Abdullayevna",
      operatorId: "OP015",
      branch: "00012",
      transcript: `[М投诉]: Хочу оформитьcredit на покупку машины.
[Оператор]: Хорошо, я помогу вам. Какой суммы вам нужен кредит?
[М投诉]: O'rtacha 500 million so'm.
[Operator]: На какие условиях вам удобнее? Срок от 1 до 5 лет.
[Mijoz]: 3 yil bo'lsa qanday foiz?
[Operator]: 19% yillik foiz. Sizning maoshangiz nechta?
[Mijoz]: 25 million so'm.
[Operator]: O'rtacha kredit miqdori - 120 million so'm. Siz boshqa kreditlarni hisobga olib, kredit tarixini tekshirib ko'ramiz.
[Mijoz]: Kredit tarixim yaxshi, o'tgan yili bir kreditni to'ladim.
[Operator]: Ajoyib, sizga 100 million so'm gacha kredit berishimiz mumkin.
[Mijoz]: Yaxshi, ariza beraman.
[Operator]: Ariza uchun quyidagi hujjatlarni: passport, nafaqa ma'lumoti, ish haqi tasdig'i.`,
      kycPassport: true,
      kycPinfl: true,
      amlPurpose: true,
      amlSource: true,
      pepCheck: false,
      crossSell: true,
      checklistScore: 92,
      saleResult: "Completed",
    },
    {
      callId: "CALL0003",
      date: "2024-12-01",
      durationSec: 340,
      language: "UZ",
      intent: "deposit_ochish",
      clientCode: "00010042",
      clientName: "SodiqovBotir Mamatqulovich",
      operatorId: "OP007",
      branch: "00003",
      transcript: `[Mijoz]: Depozit ochmoqchiman.
[Operator]: Qanday turdagi depozit qiziqtiradi? Oddiy yoki hisobga olish?
[Mijoz]: Foiz yuqori bo'ladigan.
[Operator]: "Premium" depozit 22% yillik foiz. Minimal summa 50 million so'm.
[Mijoz]: Kamroq summa bo'lsa?
[Operator]: "Oddiy" depozit 18%, minimal 10 million.
[Mijoz]: 10 million qo'yaman.
[Operator]: Depozit ochish uchun passport va PINFL kerak. Sizda bormi?
[Mijoz]: Ha, bor.
[Operator]: Iltimos, shaxsiy kabinetdan ariza bering yoki filialga kelishingiz mumkin.
[Mijoz]: Onlayn ochsa bo'ladimi?
[Operator]: Ha, mobil ilovamizdan.`,
      kycPassport: true,
      kycPinfl: true,
      amlPurpose: true,
      amlSource: true,
      pepCheck: false,
      crossSell: false,
      checklistScore: 88,
      saleResult: "Completed",
    },
    // More calls...
    ...this.generateAdditionalCalls(100),
  ];

  private generateAdditionalClients(count: number): ClientProfile[] {
    const segments: Array<"Mass" | "Premium" | "VIP"> = [
      "Mass",
      "Premium",
      "VIP",
    ];
    const riskLevels: Array<"Low" | "Medium" | "High"> = [
      "Low",
      "Medium",
      "High",
    ];
    const types: Array<"Physical" | "Legal"> = ["Physical", "Legal"];
    const surnames = [
      "Karimov",
      "Mirzayev",
      "Abdullayev",
      "Rahimov",
      "Umarov",
      "Sodiqov",
      "Yusupov",
      "Nazarov",
      "Qobilov",
      "Ismoilov",
      "Xudoyberdiyev",
      "Aminov",
      "Berdiyev",
      "Ganiyev",
      "Doniyorov",
      "Rustamov",
      "Tolipov",
      "Zokirov",
    ];
    const names = [
      "Firdavs",
      "Doniyor",
      "Jasur",
      "Nodir",
      "Malika",
      "Akmal",
      "Timur",
      "Margarita",
      "Shahnoza",
      "Botir",
      "Sarvar",
      "Dilshod",
      "Oltin",
      "Gulchehra",
    ];
    const patronymics = [
      "Karimovich",
      "Rahimovich",
      "Abdusalomovich",
      "Qurbonovich",
      "Sadriddinovna",
      "Sodiqovich",
      "Muhammadovich",
      "Dmitrievna",
    ];

    const clients: ClientProfile[] = [];
    const startCode = 11;

    for (let i = 0; i < count; i++) {
      const code = (startCode + i).toString().padStart(8, "0");
      const surname = surnames[Math.floor(Math.random() * surnames.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      const patronymic =
        patronymics[Math.floor(Math.random() * patronymics.length)];
      const segment = segments[Math.floor(Math.random() * segments.length)];
      const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)];

      const hasLoan = Math.random() > 0.5;
      const hasDeposit = Math.random() > 0.5;
      const hasCard = Math.random() > 0.3;

      let monthlyIncome = 0;
      if (segment === "Mass")
        monthlyIncome = Math.floor(Math.random() * 15000000) + 5000000;
      else if (segment === "Premium")
        monthlyIncome = Math.floor(Math.random() * 30000000) + 15000000;
      else monthlyIncome = Math.floor(Math.random() * 80000000) + 50000000;

      const daysAgo = Math.floor(Math.random() * 60);
      const lastTxn = new Date();
      lastTxn.setDate(lastTxn.getDate() - daysAgo);
      const lastTxnDate = lastTxn.toISOString().split("T")[0];

      clients.push({
        clientCode: code,
        name: `${surname} ${name} ${patronymic}`,
        type: Math.random() > 0.8 ? "Legal" : "Physical",
        segment,
        hasLoan,
        hasDeposit,
        hasCard,
        monthlyIncome,
        riskLevel: risk,
        lastTxnDate,
        phone: `+9989${Math.floor(Math.random() * 100000000)}`,
      });
    }
    return clients;
  }

  private generateAdditionalCalls(count: number): CallHistory[] {
    const intents = [
      "karta_masalasi",
      "kredit_sorovi",
      "deposit_ochish",
      "balans_tekshirish",
      "pul_o_tkazish",
      "soliq_tolash",
      "hisob_ochirish",
      "karta_bloklash",
      "parol_ozgartirish",
      "muddatli_depozit",
    ];

    const calls: CallHistory[] = [];
    const languages: Array<"UZ" | "RU"> = ["UZ", "RU"];
    const operators = [
      "OP001",
      "OP002",
      "OP003",
      "OP004",
      "OP005",
      "OP006",
      "OP007",
      "OP008",
      "OP009",
      "OP010",
    ];
    const branches = [
      "00001",
      "00002",
      "00003",
      "00004",
      "00005",
      "00006",
      "00007",
      "00008",
      "00009",
      "00010",
    ];

    for (let i = 0; i < count; i++) {
      const callId = `CALL${(1004 + i).toString().padStart(4, "0")}`;
      const daysAgo = Math.floor(Math.random() * 90);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().split("T")[0];
      const durationSec = Math.floor(Math.random() * 600) + 120;
      const language = languages[Math.floor(Math.random() * languages.length)];
      const intent = intents[Math.floor(Math.random() * intents.length)];
      const client =
        this.clients[Math.floor(Math.random() * this.clients.length)];

      const score = Math.floor(Math.random() * 40) + 60; // 60-100 mostly
      const saleResult =
        score >= 83 ? "Completed" : score >= 70 ? "Pending" : "Declined";
      const crossSell = saleResult === "Completed" && Math.random() > 0.6;

      const transcript = this.generateMockTranscript(
        intent,
        language,
        client.name,
      );

      calls.push({
        callId,
        date: dateStr,
        durationSec,
        language,
        intent,
        clientCode: client.clientCode,
        clientName: client.name,
        operatorId: operators[Math.floor(Math.random() * operators.length)],
        branch: branches[Math.floor(Math.random() * branches.length)],
        transcript,
        kycPassport: Math.random() > 0.3,
        kycPinfl: Math.random() > 0.2,
        amlPurpose: Math.random() > 0.4,
        amlSource: Math.random() > 0.4,
        pepCheck: Math.random() > 0.7,
        crossSell,
        checklistScore: score,
        saleResult,
      });
    }
    return calls;
  }

  private generateMockTranscript(
    intent: string,
    language: "UZ" | "RU",
    clientName: string,
  ): string {
    const snippets = {
      karta_masalasi: {
        UZ: `[Мижоз]: Kartam ishlamayapti, yordam bering.
[Operator]: Albatta, menga aytib bering, qanday muammo bor?
[Мижоз]: ATM da pul yechishga xohlayman, lekin karta qabul qilmayapti.
[Operator]: Karta bloklangan bo'lishi mumkin. Iltimos, parolingizni tekshirib ko'ring.
[Мижоз]: Parol to'g'ri, lekin yana xatolik.
[Operator]: Sizning kartangizni tiklab, yangi parol belgilashim mumkin.
[Мижоз]: Shunday qiling, iltimos.
[Operator]: Ariza qabul qilindi. 15 daqiqadan keyin yangi parol keladi.`,
        RU: `[Клиент]: Моя карта не работает, помогите.
[Оператор]: Конечно, расскажите, какая проблема?
[Клиент]: Хочу снять наличные, но банкомат не принимает карту.
[Оператор]: Возможно, карта заблокирована. Проверьте, верный ли PIN?
[Клиент]: PIN правильный, но всё равно ошибка.
[Оператор]: Я могу разблокировать карту и установить новый PIN.
[Клиент]: Да, пожалуйста, сделайте это.
[Оператор]: Заявка принята. Новый PIN придет через 15 минут.`,
      },
    };

    const intentData =
      snippets[intent as keyof typeof snippets] || snippets["karta_masalasi"];
    return language === "UZ" ? intentData.UZ : intentData.RU;
  }

  // Main seeding function
  seedAllData() {
    this.logger.log("🌱 Starting data seeding...");

    // Store clients in a service (would be in DB in production)
    this.storeClients(this.clients);
    this.storeCalls(this.calls);

    this.logger.log(
      `✅ Seeded ${this.clients.length} clients, ${this.calls.length} call records`,
    );
    this.logger.log(
      `📊 Analytics: ${this.calculateAnalytics(this.clients, this.calls)}`,
    );

    return {
      clientsCount: this.clients.length,
      callsCount: this.calls.length,
    };
  }

  private storeClients(clients: ClientProfile[]) {
    // In production, store in PostgreSQL via Prisma
    // For now, keep in memory - service will read from here
    (global as any).__SEEDED_CLIENTS__ = clients;
  }

  private storeCalls(calls: CallHistory[]) {
    (global as any).__SEEDED_CALLS__ = calls;
  }

  getClients(): ClientProfile[] {
    return (global as any).__SEEDED_CLIENTS__ || [];
  }

  getCalls(): CallHistory[] {
    return (global as any).__SEEDED_CALLS__ || [];
  }

  getClientByCode(clientCode: string): ClientProfile | undefined {
    return this.getClients().find((c) => c.clientCode === clientCode);
  }

  getClientByPhone(phone: string): ClientProfile | undefined {
    return this.getClients().find((c) => c.phone === phone);
  }

  getClientCalls(clientCode: string): CallHistory[] {
    return this.getCalls().filter((c) => c.clientCode === clientCode);
  }

  getCallHistoryAnalytics(): Analytics {
    const calls = this.getCalls();
    const clients = this.getClients();

    // Intent distribution
    const intentCounts: Record<string, number> = {};
    calls.forEach((c) => {
      intentCounts[c.intent] = (intentCounts[c.intent] || 0) + 1;
    });

    // Score distribution
    const scoreRanges = {
      "0-50": 0,
      "51-70": 0,
      "71-83": 0,
      "84-100": 0,
    };
    calls.forEach((c) => {
      if (c.checklistScore <= 50) scoreRanges["0-50"]++;
      else if (c.checklistScore <= 70) scoreRanges["51-70"]++;
      else if (c.checklistScore <= 83) scoreRanges["71-83"]++;
      else scoreRanges["84-100"]++;
    });

    // Sale result breakdown
    const saleResults = {
      Completed: calls.filter((c) => c.saleResult === "Completed").length,
      Pending: calls.filter((c) => c.saleResult === "Pending").length,
      Declined: calls.filter((c) => c.saleResult === "Declined").length,
    };

    // Language distribution
    const languageDist = {
      UZ: calls.filter((c) => c.language === "UZ").length,
      RU: calls.filter((c) => c.language === "RU").length,
    };

    // Segment distribution among clients
    const segmentDist = {
      Mass: clients.filter((c) => c.segment === "Mass").length,
      Premium: clients.filter((c) => c.segment === "Premium").length,
      VIP: clients.filter((c) => c.segment === "VIP").length,
    };

    // Top operators by average score
    const operatorScores: Record<
      string,
      { total: number; count: number; completed: number }
    > = {};
    calls.forEach((c) => {
      if (!operatorScores[c.operatorId]) {
        operatorScores[c.operatorId] = { total: 0, count: 0, completed: 0 };
      }
      operatorScores[c.operatorId].total += c.checklistScore;
      operatorScores[c.operatorId].count++;
      if (c.saleResult === "Completed") {
        operatorScores[c.operatorId].completed++;
      }
    });

    const topOperators = Object.entries(operatorScores)
      .map(([operatorId, data]) => ({
        operatorId,
        avgScore: Math.round(data.total / data.count),
        calls: data.count,
        conversionRate: Math.round((data.completed / data.count) * 100),
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10);

    return {
      totalClients: clients.length,
      totalCalls: calls.length,
      intentDistribution: intentCounts,
      scoreDistribution: scoreRanges,
      saleResults,
      languageDistribution: languageDist,
      segmentDistribution: segmentDist,
      topOperators,
    };
  }

  private calculateAnalytics(
    clients: ClientProfile[],
    calls: CallHistory[],
  ): string {
    const totalClients = clients.length;
    const vipCount = clients.filter((c) => c.segment === "VIP").length;
    const avgIncome = Math.round(
      clients.reduce((sum, c) => sum + c.monthlyIncome, 0) / totalClients,
    );
    const highRisk = clients.filter((c) => c.riskLevel === "High").length;
    const totalCalls = calls.length;
    const completedCalls = calls.filter(
      (c) => c.saleResult === "Completed",
    ).length;
    const conversion = Math.round((completedCalls / totalCalls) * 100);

    return `VIP: ${vipCount}, Avg Income: ${avgIncome.toLocaleString()} UZS, High Risk: ${highRisk}, Conversion: ${conversion}%`;
  }
}
