// Bank Product Knowledge Base — simulates RAG retrieval
// In production this would be a vector DB + embeddings search

export const PRODUCT_KB = `
## SADOO BANK — PRODUCT CATALOG

### 1. CONSUMER LOANS (KREDIT)
- Standard Loan: 18–36% APR, 6–60 months, up to 100,000,000 UZS
- Express Loan: 24–42% APR, approved in 15 minutes, up to 30,000,000 UZS
- Salary Loan: 16–28% APR for payroll clients, up to 3x monthly salary
- Auto Loan: 18–30% APR, 12–84 months, 20% down payment
- Home Improvement Loan: 20–32% APR, up to 150,000,000 UZS
- Eligibility: age 18–65, minimum income 2,000,000 UZS/month, no active overdue

### 2. CREDIT CARDS (KREDIT KARTA)
- SADOO Classic: limit up to 10,000,000 UZS, 0% for 30 days, 24% after
- SADOO Gold: limit up to 25,000,000 UZS, 0% for 45 days, 22% after, 1% cashback
- SADOO Platinum: limit up to 50,000,000 UZS, 0% for 60 days, 20% after, 2% cashback, lounge access
- SADOO Travel: 3% cashback on travel, no foreign transaction fees
- Annual fee: Classic 50K UZS, Gold 120K UZS, Platinum 250K UZS

### 3. DEPOSITS (DEPOZIT)
- Flexible Deposit: 16–18% APR, min 1,000,000 UZS, monthly interest payout
- Fixed Deposit (3 months): 18% APR, min 5,000,000 UZS
- Fixed Deposit (6 months): 19% APR, min 5,000,000 UZS
- Fixed Deposit (12 months): 21% APR, min 10,000,000 UZS, no early withdrawal
- VIP Deposit: 22% APR, min 50,000,000 UZS, personal manager
- Currency Deposit (USD): 6% APR, min $500

### 4. INSURANCE
- Life Insurance + Credit: mandatory for loans > 20M UZS, 0.5% of loan/month
- Property Insurance: 0.3%/year of property value
- Travel Insurance: from 50,000 UZS/trip

### 5. LEASING
- Auto Leasing: 20–28% APR, 20% advance, 12–60 months
- Equipment Leasing: 22–30% APR, for legal entities

### 6. KEY COMPLIANCE PHRASES (MANDATORY)
- Must disclose APR: "Yillik effektiv foiz stavkasi [X]%ni tashkil etadi"
- Must obtain data consent: "Ma'lumotlarni qayta ishlashga rozilik berasizmi?"
- Must confirm purpose: "Mablag'dan foydalanish maqsadini aytib bera olasizmi?"
- Must verify identity: "Pasportingiz seriya va raqamini tasdiqlab bera olasizmi?"
- Must state right to decline: "Siz istalgan vaqtda arizangizdan voz kechishingiz mumkin"

### 7. OBJECTION RESPONSES
- "Qimmat": "Foiz stavkasi bozor o'rtachasidan 2-3% past. Oylik to'lov [sum] bo'ladi."
- "O'ylab ko'raman": "Bugungi taklif faqat [date] gacha. Hozir ariza topshirsangiz qo'shimcha 1% chegirma."
- "Boshqa bankda bor": "Bizning Platinum kartamizda 2% cashback va 60 kun foizsiz davr bor."
- "Daromadim yetmaydi": "Express kredit uchun minimal daromad 1,500,000 UZS. Sizniki mos keladi."
- "Hujjatlarim yo'q": "Faqat pasport va PINFL bilan hoziroq ariza berishingiz mumkin."
`;

export const COMPLIANCE_CHECKLIST = [
  { id: 'interest_rate', label: 'APR Disclosed', keywords: ['foiz', 'stavka', 'APR', 'процент', 'yillik'] },
  { id: 'data_consent', label: 'Data Consent', keywords: ['rozi', 'согласие', 'ma\'lumot', 'данные'] },
  { id: 'kyc_verified', label: 'Identity Verified', keywords: ['pasport', 'PINFL', 'паспорт', 'удостоверение'] },
  { id: 'purpose_confirmed', label: 'Purpose Confirmed', keywords: ['maqsad', 'цель', 'foydalanish'] },
  { id: 'right_to_decline', label: 'Right to Decline Stated', keywords: ['voz kechish', 'отказаться', 'ixtiyoriy'] },
];
