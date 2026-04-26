import { Injectable } from "@nestjs/common";
import { Formula, CallHistory } from "@sadoo/types";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class FormulasService {
  private formulas: Map<string, Formula> = new Map();

  constructor() {
    this.seedFormulas();
  }

  private seedFormulas() {
    const initialFormulas: Omit<Formula, "successRate" | "usageCount">[] = [
      {
        id: "greeting_1",
        name: "Standard Greeting",
        category: "greeting",
        content: {
          uz: "Assalomu alaykum! SADOO bank xizmatlaridan xursandman. Qanday maslahatim bo'lishi mumkin?",
          ru: "Здравствуйте! Рад помочь с услугами банка SADOO. Чем могу assist?",
        },
        tags: ["greeting", "welcome"],
      },
      {
        id: "greeting_2",
        name: "Warm Greeting",
        category: "greeting",
        content: {
          uz: "Xush kelibsiz! Bugun qanday masala yuzasidan yordam bera olaman?",
          ru: "Добро пожаловать! Как я могу помочь вам сегодня?",
        },
        tags: ["greeting", "friendly"],
      },
      {
        id: "objection_price",
        name: "Price Objection Handler",
        category: "objection",
        content: {
          uz: "Menimcha, narx bo'yicha qayg'uarmisziz. B毡ijimizni teminingizga moslashtirishimiz mumkin. Qarang, bu reja shunchaki qimmat emas, balki sizning kelajagingizga sarmoya hisoblanadi.",
          ru: "Я понимаю ваши опасения по поводу цены. Мы можем подстроить план под ваш бюджет. Посмотрите, это не просто расходы, это инвестиции в ваше будущее.",
        },
        tags: ["objection", "price"],
      },
      {
        id: "objection_time",
        name: "Time Objection Handler",
        category: "objection",
        content: {
          uz: "Vaqtim yo'q deb o'ylaysizmi? Men sizni vaqtingizni tejashga yordam beraman. Bu jarayon atigi 10 daqiqa oladi.",
          ru: "Вы думаете, что у вас нет времени? Я помогу вам сэкономить время. Весь процесс займет всего 10 минут.",
        },
        tags: ["objection", "time"],
      },
      {
        id: "closing_basic",
        name: "Basic Closing",
        category: "closing",
        content: {
          uz: "Ajoyib! Shunday qilib, roziligingiz bilan boshlaymizmi? Hozir imkoniyatdan foydalanishingizni maslahat beraman.",
          ru: "Отлично! Так, можем ли мы начать с вашего согласия? Рекомендую воспользоваться возможностью сейчас.",
        },
        tags: ["closing", "direct"],
      },
      {
        id: "closing_assumptive",
        name: "Assumptive Closing",
        category: "closing",
        content: {
          uz: "Zo'r! Dasturimizni qanday boshlashni xohlaysiz - bugun yoki ertaga?",
          ru: "Отлично! Когда вы хотите начать нашу программу - сегодня или завтра?",
        },
        tags: ["closing", "assumptive"],
      },
      {
        id: "upsell_credit",
        name: "Credit Card Upsell",
        category: "upsell",
        content: {
          uz: "Sizning hisobingizda mukammal kredit kartasi qo'shish imkoniyati bor. Bu sizga favqulodda xarajatlar uchun qo'shimcha himoya va maksimal 60 kun bepul kredit beradi.",
          ru: "К вашей учетной записи можно добавить идеальную кредитную карту. Это даст вам дополнительную защиту на непредвиденные расходы и кредит без процентов до 60 дней.",
        },
        tags: ["upsell", "credit"],
      },
      {
        id: "retention_renewal",
        name: "Account Renewal Retention",
        category: "retention",
        content: {
          uz: "Hisobingizni uzaytirish arafasida ekaningizni angladim. Asliyida, biz sizga maxsus taklifimiz bor - davom ettirish uchun 3 oylik bepul muddat qo'shamiz.",
          ru: "Я понимаю, что ваш счет скоро истекает. На самом деле, у нас для вас специальное предложение - мы добавляем 3 месяца бесплатного продления при продолжении.",
        },
        tags: ["retention", "renewal"],
      },
    ];

    initialFormulas.forEach((f) => {
      this.formulas.set(f.id, {
        ...f,
        successRate: 0.5,
        usageCount: 0,
      });
    });
  }

  // Extract winning formulas from successful call history
  extractFormulasFromHistory(calls: CallHistory[]) {
    const intentGroups: Record<
      string,
      Array<{ script: string; language: "UZ" | "RU" }>
    > = {};

    calls.forEach((call) => {
      // Parse transcript to extract first operator message
      const lines = call.transcript.split("\n");
      let operatorScript = "";
      for (const line of lines) {
        if (line.startsWith("[Operator]") || line.startsWith("[Оператор]")) {
          operatorScript = line.replace(/^\[.*?\]:\s*/, "").trim();
          break;
        }
      }
      if (!operatorScript) return;

      // Group by intent
      if (!intentGroups[call.intent]) {
        intentGroups[call.intent] = [];
      }
      intentGroups[call.intent].push({
        script: operatorScript,
        language: call.language,
      });
    });

    // Create a formula per intent from the most common/representative script
    Object.entries(intentGroups).forEach(([intent, entries]) => {
      if (entries.length === 0) return;

      // Pick the first entry (could improve by picking most frequent)
      const sample = entries[0];
      const id = `auto_${intent}_${uuidv4().slice(0, 8)}`;

      // Determine category based on intent keywords
      let category: Formula["category"] = "greeting";
      if (intent.includes("karta") || intent.includes("masala"))
        category = "objection";
      else if (intent.includes("kredit")) category = "upsell";
      else if (intent.includes("deposit")) category = "retention";
      else if (intent.includes("clos")) category = "closing";

      const formula: Formula = {
        id,
        name: `Auto: ${intent}`,
        category,
        content: {
          uz: sample.language === "UZ" ? sample.script : sample.script, // Placeholder translation
          ru: sample.language === "RU" ? sample.script : sample.script,
        },
        tags: [intent, "auto-generated", "winning-pattern"],
        successRate: 0.9,
        usageCount: 1,
      };

      this.formulas.set(id, formula);
    });
  }

  getAllFormulas(): Formula[] {
    return Array.from(this.formulas.values());
  }

  getFormulaById(id: string): Formula | undefined {
    return this.formulas.get(id);
  }

  getByCategory(category: Formula["category"]): Formula[] {
    return Array.from(this.formulas.values()).filter(
      (f) => f.category === category,
    );
  }

  recordUsage(formulaId: string, success: boolean): void {
    const formula = this.formulas.get(formulaId);
    if (!formula) return;

    formula.usageCount++;
    const alpha = 0.1;
    formula.successRate =
      formula.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;

    this.formulas.set(formulaId, formula);
  }

  getTopFormulas(limit = 5): Formula[] {
    return Array.from(this.formulas.values())
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, limit);
  }

  getBestFormulaForContext(
    stage: string,
    category?: string,
  ): Formula | undefined {
    let candidates = Array.from(this.formulas.values());

    if (category) {
      candidates = candidates.filter(
        (f) => f.category === category || f.tags.includes(category),
      );
    }

    candidates = candidates.filter((f) => f.tags.includes(stage));

    if (candidates.length === 0) {
      candidates = Array.from(this.formulas.values()).filter(
        (f) => f.category === "greeting",
      );
    }

    candidates.sort((a, b) => b.successRate - a.successRate);
    return candidates[0];
  }
}
