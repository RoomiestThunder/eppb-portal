import { PrismaClient, FieldType } from "../src/generated/prisma";
import { encryptString } from "../src/lib/crypto";

const prisma = new PrismaClient();

function cond(field: string, op: string, value?: unknown) {
  return JSON.stringify({ field, op, value });
}

async function main() {
  console.log("Seeding EPPB demo data...");

  await prisma.auditLog.deleteMany();
  await prisma.outboxEvent.deleteMany();
  await prisma.applicationEvent.deleteMany();
  await prisma.applicationDocument.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.application.deleteMany();
  await prisma.formField.deleteMany();
  await prisma.serviceStep.deleteMany();
  await prisma.serviceStage.deleteMany();
  await prisma.service.deleteMany();
  await prisma.lookupItem.deleteMany();
  await prisma.lookup.deleteMany();
  await prisma.analyticsMaterial.deleteMany();
  await prisma.project.deleteMany();
  await prisma.resourceItem.deleteMany();
  await prisma.integrationLog.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // ---------------- Organizations ----------------
  const byterek = await prisma.organization.create({
    data: { code: "BYTEREK", name: 'АО «НУХ «Байтерек»', shortName: "Байтерек", logoColor: "#0B3D91" },
  });
  const kdb = await prisma.organization.create({
    data: { code: "KDB", name: "Банк Развития Казахстана", shortName: "БРК", logoColor: "#0B5FFF" },
  });
  const damu = await prisma.organization.create({
    data: { code: "DAMU", name: 'Фонд развития предпринимательства «Даму»', shortName: "Даму", logoColor: "#F2A900" },
  });
  const acc = await prisma.organization.create({
    data: { code: "ACC", name: "Аграрная кредитная корпорация", shortName: "АКК", logoColor: "#2E8B57" },
  });
  const kaf = await prisma.organization.create({
    data: { code: "KAF", name: "КазАгроФинанс", shortName: "КАФ", logoColor: "#4C9A2A" },
  });
  const kazakhexport = await prisma.organization.create({
    data: { code: "KAZAKHEXPORT", name: "Kazakh Export", shortName: "KazakhExport", logoColor: "#C8102E" },
  });
  const qic = await prisma.organization.create({
    data: { code: "QIC", name: "QIC (Quasi-Sovereign Insurance Company)", shortName: "QIC", logoColor: "#7B2CBF" },
  });

  // ---------------- Lookups (справочники) ----------------
  await prisma.lookup.create({
    data: {
      code: "regions",
      name: "Регионы Казахстана",
      items: {
        create: [
          { value: "astana", label: "г. Астана", order: 1 },
          { value: "almaty", label: "г. Алматы", order: 2 },
          { value: "shymkent", label: "г. Шымкент", order: 3 },
          { value: "akmola", label: "Акмолинская область", order: 4 },
          { value: "aktobe", label: "Актюбинская область", order: 5 },
          { value: "atyrau", label: "Атырауская область", order: 6 },
          { value: "karaganda", label: "Карагандинская область", order: 7 },
          { value: "pavlodar", label: "Павлодарская область", order: 8 },
          { value: "kostanay", label: "Костанайская область", order: 9 },
          { value: "turkistan", label: "Туркестанская область", order: 10 },
          { value: "vko", label: "Восточно-Казахстанская область", order: 11 },
          { value: "zhambyl", label: "Жамбылская область", order: 12 },
          { value: "kyzylorda", label: "Кызылординская область", order: 13 },
          { value: "sko", label: "Северо-Казахстанская область", order: 14 },
          { value: "mangystau", label: "Мангистауская область", order: 15 },
        ],
      },
    },
  });

  await prisma.lookup.create({
    data: {
      code: "wagon_types",
      name: "Типы вагонов",
      items: {
        create: [
          { value: "gondola", label: "Полувагон", order: 1 },
          { value: "tank", label: "Вагон-цистерна", order: 2 },
          { value: "covered", label: "Крытый вагон", order: 3 },
          { value: "platform", label: "Платформа", order: 4 },
          { value: "hopper", label: "Хоппер", order: 5 },
        ],
      },
    },
  });

  await prisma.lookup.create({
    data: {
      code: "livestock_types",
      name: "Виды животноводства",
      items: {
        create: [
          { value: "cattle_dairy", label: "КРС молочного направления", order: 1 },
          { value: "cattle_beef", label: "КРС мясного направления", order: 2 },
          { value: "sheep_goat", label: "Овцы и козы", order: 3 },
          { value: "horses", label: "Лошади", order: 4 },
          { value: "poultry", label: "Птица", order: 5 },
        ],
      },
    },
  });

  // ---------------- Control-case service 1: Приобретение вагонов в лизинг ----------------
  const wagonService = await prisma.service.create({
    data: {
      slug: "wagon-leasing",
      name: "Приобретение вагонов в лизинг",
      shortDescription: "Финансовый лизинг грузовых вагонов для промышленных и логистических компаний",
      fullDescription:
        "Услуга предназначена для казахстанских компаний, которым необходим подвижной состав (полувагоны, цистерны, платформы и др.) для собственных грузоперевозок. БРК-Лизинг финансирует приобретение вагонов на срок до 10 лет с возможностью государственной поддержки ставки вознаграждения.",
      category: "Лизинг",
      icon: "TrainFront",
      status: "PUBLISHED",
      organizationId: kdb.id,
      complexity: "multi-stage",
      tags: "лизинг,вагоны,логистика,подвижной состав",
      stages: {
        create: [
          {
            order: 1,
            title: "Первичная заявка",
            description: "Основные сведения о заявителе и параметрах лизинга",
            steps: {
              create: [
                {
                  order: 1,
                  title: "Данные заявителя",
                  description: "Компания определяется автоматически по БИН (мок eGov)",
                  fields: {
                    create: [
                      {
                        order: 1,
                        key: "applicant_bin",
                        label: "БИН компании",
                        hint: "Введите БИН — наименование организации подтянется автоматически",
                        type: FieldType.TEXT,
                        required: true,
                        prefillSource: "egov.bin",
                        validation: JSON.stringify({ pattern: "^[0-9]{12}$", minLength: 12, maxLength: 12 }),
                      },
                      {
                        order: 2,
                        key: "company_name",
                        label: "Наименование организации",
                        type: FieldType.TEXT,
                        required: true,
                        prefillSource: "egov.companyName",
                      },
                      {
                        order: 3,
                        key: "applicant_type",
                        label: "Тип заявителя",
                        type: FieldType.SELECT,
                        required: true,
                        options: JSON.stringify(["Резидент РК", "Нерезидент"]),
                      },
                      {
                        order: 4,
                        key: "contact_phone",
                        label: "Контактный телефон",
                        type: FieldType.TEXT,
                        required: true,
                      },
                      {
                        order: 5,
                        key: "contact_email",
                        label: "Электронная почта",
                        type: FieldType.TEXT,
                        required: true,
                      },
                    ],
                  },
                },
                {
                  order: 2,
                  title: "Параметры вагонов",
                  description: "Выберите тип и количество подвижного состава",
                  fields: {
                    create: [
                      {
                        order: 1,
                        key: "wagon_type",
                        label: "Тип вагона",
                        type: FieldType.LOOKUP,
                        required: true,
                        lookupCode: "wagon_types",
                      },
                      {
                        order: 2,
                        key: "wagon_condition",
                        label: "Состояние",
                        type: FieldType.SELECT,
                        required: true,
                        options: JSON.stringify(["Новый", "Б/у"]),
                      },
                      {
                        order: 3,
                        key: "wagon_count",
                        label: "Количество вагонов",
                        type: FieldType.NUMBER,
                        required: true,
                        validation: JSON.stringify({ min: 1, max: 500 }),
                      },
                      {
                        order: 4,
                        key: "unit_price",
                        label: "Стоимость 1 вагона, тенге",
                        hint: "Согласно коммерческому предложению поставщика",
                        type: FieldType.NUMBER,
                        required: true,
                        validation: JSON.stringify({ min: 1000000 }),
                      },
                      {
                        order: 5,
                        key: "total_price",
                        label: "Итоговая стоимость, тенге",
                        hint: "Рассчитывается автоматически: количество × цена",
                        type: FieldType.CALCULATED,
                        formula: "round(wagon_count * unit_price)",
                      },
                    ],
                  },
                },
                {
                  order: 3,
                  title: "Условия лизинга",
                  description: "Финансовые параметры сделки",
                  fields: {
                    create: [
                      {
                        order: 1,
                        key: "lease_term_months",
                        label: "Срок лизинга, мес.",
                        type: FieldType.NUMBER,
                        required: true,
                        validation: JSON.stringify({ min: 12, max: 120 }),
                      },
                      {
                        order: 2,
                        key: "down_payment_percent",
                        label: "Авансовый платеж, %",
                        type: FieldType.NUMBER,
                        required: true,
                        validation: JSON.stringify({ min: 10, max: 50 }),
                      },
                      {
                        order: 3,
                        key: "down_payment_amount",
                        label: "Сумма аванса, тенге",
                        type: FieldType.CALCULATED,
                        formula: "round(total_price * down_payment_percent / 100)",
                      },
                      {
                        order: 4,
                        key: "monthly_payment",
                        label: "Ориентировочный ежемесячный платеж, тенге",
                        type: FieldType.CALCULATED,
                        formula: "round((total_price - down_payment_amount) / lease_term_months)",
                      },
                      {
                        order: 5,
                        key: "need_state_support",
                        label: "Требуется государственная поддержка ставки вознаграждения",
                        type: FieldType.CHECKBOX,
                      },
                      {
                        order: 6,
                        key: "support_program_notice",
                        label: "Заявка будет также рассмотрена в рамках программы субсидирования ставки вознаграждения Холдинга. Дополнительных действий не требуется.",
                        type: FieldType.INFO,
                        visibilityRule: cond("need_state_support", "eq", "true"),
                      },
                    ],
                  },
                },
                {
                  order: 4,
                  title: "Документы",
                  description: "Пакет документов для первичного рассмотрения",
                  fields: {
                    create: [
                      { order: 1, key: "doc_charter", label: "Устав / учредительные документы", type: FieldType.FILE, required: true },
                      { order: 2, key: "doc_financials", label: "Финансовая отчетность за последний год", type: FieldType.FILE, required: true },
                      {
                        order: 3,
                        key: "doc_business_plan",
                        label: "Бизнес-план (для крупных партий от 10 вагонов)",
                        type: FieldType.FILE,
                        required: true,
                        visibilityRule: cond("wagon_count", "gt", 10),
                      },
                      {
                        order: 4,
                        key: "doc_nonresident",
                        label: "Документы нерезидента (апостиль/легализация)",
                        type: FieldType.FILE,
                        required: true,
                        visibilityRule: cond("applicant_type", "eq", "Нерезидент"),
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            order: 2,
            title: "Расширенные данные",
            description: "Запрашивается после первичного рассмотрения заявки",
            steps: {
              create: [
                {
                  order: 1,
                  title: "Обеспечение и гарантии",
                  description: "Дополнительные сведения для одобрения сделки",
                  fields: {
                    create: [
                      { order: 1, key: "collateral_description", label: "Описание предлагаемого обеспечения", type: FieldType.TEXTAREA, required: true },
                      { order: 2, key: "collateral_value", label: "Оценочная стоимость обеспечения, тенге", type: FieldType.NUMBER, required: true },
                      { order: 3, key: "doc_collateral_valuation", label: "Отчет об оценке обеспечения", type: FieldType.FILE, required: true },
                      {
                        order: 4,
                        key: "additional_guarantee_needed",
                        label: "Требуется дополнительное поручительство третьих лиц",
                        type: FieldType.CHECKBOX,
                      },
                      {
                        order: 5,
                        key: "doc_guarantee_letter",
                        label: "Гарантийное письмо поручителя",
                        type: FieldType.FILE,
                        required: true,
                        visibilityRule: cond("additional_guarantee_needed", "eq", "true"),
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // ---------------- Control-case service 2: Субсидирование животноводства ----------------
  const livestockService = await prisma.service.create({
    data: {
      slug: "agro-livestock",
      name: "Субсидирование животноводства",
      shortDescription: "Возмещение части затрат на приобретение и содержание племенного скота",
      fullDescription:
        "Государственная субсидия для сельхозтоваропроизводителей, развивающих животноводческое направление. Ставка субсидии зависит от вида и количества поголовья.",
      category: "Субсидирование",
      icon: "Beef",
      status: "PUBLISHED",
      organizationId: acc.id,
      complexity: "multi-stage",
      tags: "субсидии,агробизнес,животноводство,сельское хозяйство",
      stages: {
        create: [
          {
            order: 1,
            title: "Заявка на субсидию",
            description: "Сведения о хозяйстве и поголовье",
            steps: {
              create: [
                {
                  order: 1,
                  title: "Данные хозяйства",
                  fields: {
                    create: [
                      {
                        order: 1,
                        key: "applicant_bin",
                        label: "БИН/ИИН хозяйства",
                        type: FieldType.TEXT,
                        required: true,
                        prefillSource: "egov.bin",
                      },
                      { order: 2, key: "farm_name", label: "Наименование хозяйства", type: FieldType.TEXT, required: true },
                      { order: 3, key: "region", label: "Регион", type: FieldType.LOOKUP, required: true, lookupCode: "regions" },
                    ],
                  },
                },
                {
                  order: 2,
                  title: "Поголовье и расчет субсидии",
                  fields: {
                    create: [
                      {
                        order: 1,
                        key: "livestock_type",
                        label: "Вид животноводства",
                        type: FieldType.LOOKUP,
                        required: true,
                        lookupCode: "livestock_types",
                      },
                      {
                        order: 2,
                        key: "livestock_count",
                        label: "Поголовье, голов",
                        type: FieldType.NUMBER,
                        required: true,
                        validation: JSON.stringify({ min: 1 }),
                      },
                      {
                        order: 3,
                        key: "rate_per_head",
                        label: "Ставка субсидирования на 1 голову, тенге",
                        hint: "Согласно действующим нормативам МСХ РК",
                        type: FieldType.NUMBER,
                        required: true,
                      },
                      {
                        order: 4,
                        key: "subsidy_amount",
                        label: "Расчетная сумма субсидии, тенге",
                        type: FieldType.CALCULATED,
                        formula: "round(livestock_count * rate_per_head)",
                      },
                      {
                        order: 5,
                        key: "has_veterinary_certificate",
                        label: "Имеется ветеринарная справка о состоянии поголовья",
                        type: FieldType.CHECKBOX,
                        required: true,
                      },
                      {
                        order: 6,
                        key: "doc_veterinary",
                        label: "Ветеринарная справка",
                        type: FieldType.FILE,
                        required: true,
                        visibilityRule: cond("has_veterinary_certificate", "eq", "true"),
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            order: 2,
            title: "Расширенные данные",
            description: "Дополнительные документы, запрашиваемые после первичной проверки",
            steps: {
              create: [
                {
                  order: 1,
                  title: "Подтверждающие документы",
                  fields: {
                    create: [
                      { order: 1, key: "doc_land_ownership", label: "Документ на право пользования землей", type: FieldType.FILE, required: true },
                      { order: 2, key: "doc_livestock_registry", label: "Выписка из реестра ИЖС/племенного учета", type: FieldType.FILE, required: true },
                      { order: 3, key: "additional_comment", label: "Дополнительный комментарий", type: FieldType.TEXTAREA, required: false },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // ---------------- Additional lightweight published services (catalog breadth / scalability demo) ----------------
  const extraServices: Array<{
    slug: string;
    name: string;
    shortDescription: string;
    category: string;
    icon: string;
    orgId: string;
    tags: string;
  }> = [
    {
      slug: "working-capital-loan",
      name: "Кредитование пополнения оборотных средств",
      shortDescription: "Льготное кредитование МСБ на пополнение оборотного капитала",
      category: "Кредитование",
      icon: "Landmark",
      orgId: damu.id,
      tags: "кредит,мсб,оборотные средства",
    },
    {
      slug: "loan-guarantee",
      name: "Гарантирование по кредиту",
      shortDescription: "Частичное гарантирование при недостаточности залогового обеспечения",
      category: "Гарантирование",
      icon: "ShieldCheck",
      orgId: damu.id,
      tags: "гарантия,залог,мсб",
    },
    {
      slug: "export-insurance",
      name: "Страхование экспортных операций",
      shortDescription: "Страховая защита экспортных контрактов от коммерческих и политических рисков",
      category: "Страхование",
      icon: "Ship",
      orgId: kazakhexport.id,
      tags: "экспорт,страхование",
    },
    {
      slug: "agro-equipment-leasing",
      name: "Лизинг сельхозтехники",
      shortDescription: "Приобретение тракторов и сельхозтехники на условиях лизинга",
      category: "Лизинг",
      icon: "Tractor",
      orgId: kaf.id,
      tags: "лизинг,агробизнес,техника",
    },
    {
      slug: "investment-project-financing",
      name: "Инвестиционное кредитование проекта",
      shortDescription: "Долгосрочное финансирование инвестиционных проектов",
      category: "Инвестирование",
      icon: "TrendingUp",
      orgId: kdb.id,
      tags: "инвестиции,проекты,кредит",
    },
    {
      slug: "business-risk-insurance",
      name: "Страхование предпринимательских рисков",
      shortDescription: "Страхование имущественных и предпринимательских рисков бизнеса",
      category: "Страхование",
      icon: "Shield",
      orgId: qic.id,
      tags: "страхование,риски",
    },
  ];

  for (const s of extraServices) {
    await prisma.service.create({
      data: {
        slug: s.slug,
        name: s.name,
        shortDescription: s.shortDescription,
        fullDescription: s.shortDescription,
        category: s.category,
        icon: s.icon,
        status: "PUBLISHED",
        organizationId: s.orgId,
        complexity: "simple",
        tags: s.tags,
        stages: {
          create: [
            {
              order: 1,
              title: "Заявка",
              steps: {
                create: [
                  {
                    order: 1,
                    title: "Основные данные",
                    fields: {
                      create: [
                        { order: 1, key: "applicant_bin", label: "БИН/ИИН заявителя", type: FieldType.TEXT, required: true, prefillSource: "egov.bin" },
                        { order: 2, key: "request_description", label: "Краткое описание запроса", type: FieldType.TEXTAREA, required: true },
                        { order: 3, key: "requested_amount", label: "Запрашиваемая сумма, тенге", type: FieldType.NUMBER, required: true },
                        { order: 4, key: "doc_main", label: "Основной пакет документов", type: FieldType.FILE, required: true },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });
  }

  // ---------------- Users ----------------
  const client = await prisma.user.create({
    data: {
      role: "CLIENT",
      fullName: "Айдос Серіков",
      iin: "900101300123",
      bin: "970340000455",
      email: "client@demo.kz",
      phone: "+7 701 000 00 01",
    },
  });
  await prisma.user.create({
    data: { role: "SUPERADMIN", fullName: "Суперадминистратор платформы", email: "superadmin@demo.kz" },
  });
  await prisma.user.create({
    data: { role: "ORG_ADMIN", fullName: "Администратор услуг (БРК)", email: "orgadmin@demo.kz", organizationId: kdb.id },
  });
  await prisma.user.create({
    data: { role: "AUTHOR", fullName: "Бизнес-аналитик (автор услуг, БРК)", email: "author@demo.kz", organizationId: kdb.id },
  });
  await prisma.user.create({
    data: { role: "ANALYST", fullName: "Аналитик (только чтение)", email: "analyst@demo.kz" },
  });

  // Seed the application-number counter so the first real submission continues after this demo app.
  await prisma.counter.create({ data: { id: "application_number_2026", value: 1 } });

  // demo submitted application to populate personal cabinet
  const demoApp = await prisma.application.create({
    data: {
      number: "EPPB-2026-000001",
      serviceId: livestockService.id,
      serviceVersion: livestockService.version,
      userId: client.id,
      status: "IN_REVIEW",
      currentStageOrder: 1,
      data: encryptString(
        JSON.stringify({
          applicant_bin: "970340000455",
          farm_name: 'КХ "Серіков и Ко"',
          region: "akmola",
          livestock_type: "cattle_beef",
          livestock_count: 120,
          rate_per_head: 45000,
          subsidy_amount: 5400000,
          has_veterinary_certificate: "true",
        })
      ),
      history: {
        create: [
          { type: "status_change", message: "Заявка подана" },
          { type: "integration", message: "Заявка передана в BPM АКК (mock)" },
          { type: "status_change", message: "Заявка принята в работу, статус: На рассмотрении" },
        ],
      },
    },
  });
  await prisma.notification.create({
    data: {
      userId: client.id,
      title: "Заявка принята в работу",
      body: `Ваша заявка №${demoApp.number} на услугу «Субсидирование животноводства» передана на рассмотрение в АКК.`,
    },
  });

  // ---------------- Analytics reporting module ----------------
  await prisma.analyticsMaterial.createMany({
    data: [
      {
        title: "Годовой отчет Холдинга «Байтерек» 2025",
        description: "Консолидированные финансовые показатели группы за 2025 год",
        organizationId: byterek.id,
        materialType: "financial",
        source: "baiterek.gov.kz",
        period: "2025",
        linkUrl: "https://www.baiterek.gov.kz/",
        embeddable: false,
      },
      {
        title: "Портфель кредитования МСБ",
        description: "Интерактивный дашборд по выданным кредитам и гарантиям Даму",
        organizationId: damu.id,
        materialType: "dashboard",
        source: "damu.kz",
        period: "Q2 2026",
        linkUrl: "https://damu.kz/ru/",
        embeddable: true,
      },
      {
        title: "Экспортные операции: аналитический обзор",
        description: "Обзор застрахованных экспортных контрактов по странам и отраслям",
        organizationId: kazakhexport.id,
        materialType: "research",
        source: "kazakhexport.kz",
        period: "2026",
        linkUrl: "https://kazakhexport.kz/",
        embeddable: false,
      },
      {
        title: "Лизинговый портфель БРК-Лизинг",
        description: "Интерактивный отчет по объему и структуре лизинговых сделок",
        organizationId: kdb.id,
        materialType: "dashboard",
        source: "kdb.kz",
        period: "2026",
        linkUrl: "https://www.kdb.kz/",
        embeddable: true,
      },
      {
        title: "Субсидии АПК: региональный разрез",
        description: "Финансовая отчетность по субсидированию агросектора в разрезе регионов",
        organizationId: acc.id,
        materialType: "financial",
        source: "agrocredit.kz",
        period: "2025",
        linkUrl: "https://agrocredit.kz/ru/",
        embeddable: false,
      },
      {
        title: "КазАгроФинанс: лизинг сельхозтехники",
        description: "Отчет по объемам профинансированной техники по регионам",
        organizationId: kaf.id,
        materialType: "report",
        source: "kaf.kz",
        period: "2025",
        linkUrl: "https://kaf.kz/ru/",
        embeddable: false,
      },
    ],
  });

  // ---------------- Interactive project map ----------------
  const cityCoords: Record<string, [number, number]> = {
    astana: [51.1605, 71.4704],
    almaty: [43.222, 76.8512],
    shymkent: [42.3417, 69.5901],
    aktobe: [50.2839, 57.2094],
    atyrau: [47.1164, 51.883],
    karaganda: [49.8047, 73.1094],
    pavlodar: [52.2871, 76.9674],
    kostanay: [53.2141, 63.6246],
    turkistan: [43.2975, 68.2529],
    ust_kamenogorsk: [49.9714, 82.6053],
    taraz: [42.9, 71.3667],
    kyzylorda: [44.8479, 65.4823],
    petropavlovsk: [54.8756, 69.1628],
    aktau: [43.651, 51.1979],
    semey: [50.4111, 80.2275],
  };

  const projectSeeds = [
    { name: "Строительство тепличного комплекса", org: acc.id, city: "almaty", region: "Алматинская область", industry: "Сельское хозяйство", amount: 3200000000, status: "active" },
    { name: "Модернизация зернового терминала", org: kdb.id, city: "aktau", region: "Мангистауская область", industry: "Логистика", amount: 8700000000, status: "financing" },
    { name: "Приобретение парка полувагонов", org: kdb.id, city: "karaganda", region: "Карагандинская область", industry: "Транспорт", amount: 5400000000, status: "completed" },
    { name: "Молочно-товарная ферма на 1200 голов", org: acc.id, city: "kostanay", region: "Костанайская область", industry: "Животноводство", amount: 2100000000, status: "active" },
    { name: "Завод по переработке масличных культур", org: kaf.id, city: "petropavlovsk", region: "Северо-Казахстанская область", industry: "Пищевая промышленность", amount: 4600000000, status: "planned" },
    { name: "Логистический хаб экспорта зерна", org: kazakhexport.id, city: "atyrau", region: "Атырауская область", industry: "Логистика", amount: 6100000000, status: "financing" },
    { name: "Птицефабрика полного цикла", org: acc.id, city: "shymkent", region: "г. Шымкент", industry: "Животноводство", amount: 1800000000, status: "active" },
    { name: "Текстильная фабрика", org: damu.id, city: "turkistan", region: "Туркестанская область", industry: "Легкая промышленность", amount: 950000000, status: "completed" },
    { name: "Тепличный кластер овощеводства", org: kaf.id, city: "taraz", region: "Жамбылская область", industry: "Сельское хозяйство", amount: 1250000000, status: "active" },
    { name: "Расширение угольного логистического парка", org: kdb.id, city: "pavlodar", region: "Павлодарская область", industry: "Логистика", amount: 3900000000, status: "financing" },
    { name: "Мясокомбинат мощностью 40 тыс. тонн", org: acc.id, city: "kyzylorda", region: "Кызылординская область", industry: "Пищевая промышленность", amount: 2700000000, status: "planned" },
    { name: "Производство молочной продукции", org: kaf.id, city: "ust_kamenogorsk", region: "Восточно-Казахстанская область", industry: "Пищевая промышленность", amount: 1600000000, status: "active" },
    { name: "Экспортный терминал плодоовощной продукции", org: kazakhexport.id, city: "semey", region: "Восточно-Казахстанская область", industry: "Логистика", amount: 2200000000, status: "completed" },
    { name: "Индустриальный парк для МСБ", org: damu.id, city: "astana", region: "г. Астана", industry: "Промышленность", amount: 7300000000, status: "financing" },
    { name: "Овцеводческий комплекс", org: acc.id, city: "aktobe", region: "Актюбинская область", industry: "Животноводство", amount: 890000000, status: "active" },
  ];

  for (const p of projectSeeds) {
    const [lat, lng] = cityCoords[p.city];
    await prisma.project.create({
      data: {
        name: p.name,
        organizationId: p.org,
        region: p.region,
        locality: p.city,
        lat,
        lng,
        industry: p.industry,
        amount: p.amount,
        status: p.status,
        periodStart: "2024",
        periodEnd: "2027",
        description: `Проект реализован при финансовой поддержке группы компаний Холдинга «Байтерек» в рамках программ развития региона (${p.region}).`,
      },
    });
  }

  // ---------------- Useful materials & tools for entrepreneurs ----------------
  await prisma.resourceItem.createMany({
    data: [
      {
        title: "Как выбрать меру поддержки: пошаговая инструкция",
        description: "База знаний: с чего начать поиск подходящей меры поддержки бизнеса",
        category: "knowledge_base",
        linkUrl: "/tools/guide-choose-service",
      },
      {
        title: "Шаблон бизнес-плана",
        description: "Универсальный шаблон для подготовки бизнес-плана при подаче заявки на финансирование",
        category: "template",
        linkUrl: "#template-business-plan",
      },
      {
        title: "Чек-лист документов для лизинга оборудования",
        description: "Полный перечень документов, которые потребуются при подаче заявки на лизинг",
        category: "checklist",
        linkUrl: "#checklist-leasing-docs",
      },
      {
        title: "Калькулятор лизинговых платежей",
        description: "Интерактивный калькулятор для предварительного расчета ежемесячного платежа",
        category: "calculator",
        linkUrl: "/tools/calculator",
      },
      {
        title: "Обзор мер господдержки АПК на 2026 год",
        description: "Аналитический обзор действующих программ субсидирования сельского хозяйства",
        category: "knowledge_base",
        linkUrl: "https://bgov.kz/",
      },
      {
        title: "Чек-лист готовности компании к экспорту",
        description: "Самопроверка перед подачей заявки на страхование экспортных операций",
        category: "checklist",
        linkUrl: "#checklist-export-ready",
      },
      {
        title: "Видео-инструкция: подача заявки через ЕППБ",
        description: "Короткое обучающее видео о работе с личным кабинетом и подаче заявки",
        category: "guide",
        linkUrl: "#video-guide",
      },
      {
        title: "Калькулятор субсидии на животноводство",
        description: "Быстрая оценка суммы субсидии в зависимости от вида и поголовья скота",
        category: "calculator",
        linkUrl: "/tools/calculator?type=subsidy",
      },
    ],
  });

  console.log("Seed complete:", { wagonService: wagonService.slug, livestockService: livestockService.slug });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
