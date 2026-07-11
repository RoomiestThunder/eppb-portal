export type Locale = "ru" | "kk";

// Picks the Kazakh translation when present and the locale is kk, otherwise falls back to Russian.
export function pickLocalized(ru: string, kk: string | null | undefined, locale: Locale): string {
  if (locale === "kk" && kk && kk.trim().length > 0) return kk;
  return ru;
}

const UI_STRINGS = {
  ru: {
    // header / nav
    home: "Главная",
    catalog: "Каталог услуг",
    tools: "Инструменты бизнеса",
    analytics: "Аналитика",
    map: "Карта проектов",
    cabinet: "Личный кабинет",
    admin: "Администрирование",
    login: "Войти",
    logout: "Выйти",
    heroTitle: "Единый портал поддержки бизнеса",
    heroSubtitle: "Все меры поддержки АО «НУХ «Байтерек» и дочерних организаций — в одном месте",
    footerRights: "Все права защищены",
    brandAbbr: "ЕППБ",

    // AI assistant widget
    aiGreeting:
      "Здравствуйте! Я AI-помощник ЕППБ. Опишите, какая поддержка вам нужна — например, «хочу купить вагоны в лизинг» или «субсидия на животноводство» — и я подберу подходящую услугу.",
    aiError: "Произошла ошибка. Попробуйте ещё раз.",
    aiWidgetTitle: "AI-помощник ЕППБ",
    aiTyping: "печатает…",
    aiInputPlaceholder: "Опишите вашу задачу…",
    pageTitle: "ЕППБ — Единый портал поддержки бизнеса",
    pageDescription: "MVP цифровой платформы «Единый портал поддержки бизнеса» на базе универсального конструктора. АО «НУХ «Байтерек».",
    loginPromptLoading: "Вход…",
    footerMvpNote: "MVP для конкурса AstanaHub",
    loginPromptButton: "Войти через eGov IDP (демо)",

    // application wizard
    wizardStepOf: "Шаг",
    wizardStepOfSeparator: "из",
    wizardDraftSaved: "Черновик сохранён в",
    wizardBack: "Назад",
    wizardNext: "Далее",
    wizardSubmit: "Отправить заявку",
    wizardSubmitting: "Отправка…",
    wizardCheckFields: "Проверьте, пожалуйста:",
    wizardFieldRequired: "обязательное поле",
    wizardFieldMustBeNumber: "должно быть числом",
    wizardFieldMin: "минимум",
    wizardFieldMax: "максимум",
    wizardAiCheck: "Проверить заявку с помощью AI",
    wizardAiCheckOk: "AI-проверка: заявка выглядит полной и готова к отправке.",
    wizardSubmitError: "Не удалось отправить заявку. Попробуйте ещё раз.",
    wizardResultTitle: "Заявка отправлена",
    wizardResultNumber: "Номер заявки:",
    wizardResultBodySubmitted: "Заявка передана на рассмотрение и подписана ЭЦП (mock). Статус и уведомления доступны в личном кабинете.",
    wizardResultBodyContinued: "Заявка передана на рассмотрение. Статус и уведомления доступны в личном кабинете.",
    wizardGoToCabinet: "Перейти в личный кабинет",
    wizardGoToService: "К услуге",
    wizardSelectPlaceholder: "Выберите…",
    wizardYes: "Да",

    // home page
    homeHeroTag: "АО «НУХ «Байтерек» и дочерние организации",
    homeHeroTitle: "Все меры поддержки бизнеса — в одном окне",
    homeHeroBody:
      "Найдите подходящую меру поддержки, подайте заявку понятным пошаговым сценарием и отслеживайте статус — без блуждания по разным сайтам дочерних организаций Холдинга.",
    homeSearchPlaceholder: "Например: лизинг вагонов, субсидия животноводство…",
    homeSearchButton: "Найти услугу",
    homeOpenCatalog: "Открыть каталог услуг",
    homeMyApplications: "Мои заявки",
    homeAskAi: "Спросите AI-помощника (справа внизу)",
    statServices: "Услуг на портале",
    statOrgs: "Организаций Холдинга",
    statProjects: "Проектов на карте",
    statRegions: "Регионов охвата",
    howItWorksTitle: "Как это работает",
    howStep1Title: "Найдите услугу",
    howStep1Body: "Через поиск, каталог, категории или AI-помощника",
    howStep2Title: "Подайте заявку",
    howStep2Body: "Понятный пошаговый сценарий вместо длинной анкеты",
    howStep3Title: "Отслеживайте статус",
    howStep3Body: "В личном кабинете — статусы, документы, уведомления",
    howStep4Title: "Получите результат",
    howStep4Body: "Решение и сопровождение до полного завершения услуги",
    directionsTitle: "Направления поддержки",
    popularTitle: "Популярные услуги",
    allServices: "Все услуги",
    applyNow: "Подать заявку",
    analyticsCardTitle: "Аналитическая отчетность",
    analyticsCardBody: "Дашборды и отчеты дочерних организаций Холдинга",
    mapCardTitle: "Карта проектов",
    mapCardBody: "Проекты, профинансированные группой Холдинга, на карте Казахстана",
    toolsCardTitle: "Инструменты для бизнеса",
    toolsCardBody: "База знаний, шаблоны, чек-листы и калькуляторы",

    // catalog
    catalogTitle: "Каталог мер поддержки",
    catalogCount: (total: number, found: number) => `${total} услуг доступно на портале. Найдено по вашему запросу: ${found}.`,
    catalogSearchPlaceholder: "Поиск по названию, отрасли, задаче…",
    catalogSearchButton: "Найти",
    allCategories: "Все категории",
    multiStage: "многоэтапная",
    catalogEmptyTitle: "По вашему запросу ничего не найдено",
    catalogEmptyBody: "Попробуйте изменить формулировку, снять фильтры или спросите AI-помощника внизу справа.",

    // service card
    breadcrumbCatalog: "Каталог услуг",
    multiStageService: "многоэтапная услуга",
    stepsOf: "шагов в",
    stepsOfStagesOne: "этапе",
    stepsOfStagesMany: "этапах",
    stepOne: "шаг",
    documentsCount: "Документов",
    howApplyGoes: "Как проходит подача заявки",
    stageWord: "Этап",
    fieldsCount: "полей",

    // cabinet
    cabinetTitle: "Личный кабинет",
    myApplications: "Мои заявки",
    notifications: "Уведомления",
    noNotifications: "Уведомлений нет",
    noApplicationsTitle: "Заявок пока нет",
    noApplicationsBody: "Найдите подходящую меру поддержки в каталоге и подайте первую заявку.",
    goToCatalog: "Перейти в каталог услуг",
    details: "Подробнее",
    continueDraft: "Продолжить заполнение",
    submitExtra: "Предоставить расширенные данные",
    createdOn: "создана",
    submittedOn: "подана",
    documentsWord: "документов",

    // application detail
    backToCabinet: "Личный кабинет",
    reviewHistory: "История рассмотрения",
    documentsSection: "Документы",
    noDocuments: "Документов не приложено.",
    signedEsign: "подписан ЭЦП",
    applicationData: "Данные заявки",

    // analytics
    analyticsTitle: "Аналитическая отчетность дочерних организаций",
    analyticsSubtitle: "Единый каталог готовых аналитических материалов, отчетов и дашбордов Холдинга и дочерних организаций.",
    allOrganizations: "Все организации",
    sourceLabel: "Источник",
    periodLabel: "Период",
    openSource: "Открыть источник",
    embedPreview: "Встроенный просмотр",
    hidePreview: "Скрыть предпросмотр",
    previewCaption: "Демо-превью — в продуктиве здесь встраивается живой дашборд источника",

    // map
    mapTitle: "Интерактивная карта проектов",
    mapSubtitle: "Проекты, профинансированные группой компаний Холдинга «Байтерек», с привязкой к региону и статусом реализации.",
    allRegions: "Все регионы",
    allIndustries: "Все отрасли",
    allStatuses: "Все статусы",
    foundCount: "Найдено",
    projectsByRegion: "Проекты по регионам",
    moreRegions: (n: number) => `и ещё ${n} ${n === 1 ? "регион" : n < 5 ? "региона" : "регионов"}`,
    loadingMap: "Загрузка карты…",
    noDataWord: "Нет данных",
    regionWord: "Регион",
    industryWord: "Отрасль",
    amountWord: "Сумма",
    periodWord: "Период",
    statusWord: "Статус",
    statusPlanned: "Планируется",
    statusFinancing: "Финансируется",
    statusActive: "Реализуется",
    statusCompleted: "Завершен",

    // tools
    toolsTitle: "Инструменты и материалы для развития бизнеса",
    toolsSubtitle: "База знаний, шаблоны, чек-листы и калькуляторы, сопровождающие предпринимателя на разных этапах развития бизнеса.",
    materialInDevelopment: "Материал в разработке.",
    categoryKnowledgeBase: "База знаний",
    categoryTemplate: "Шаблоны документов",
    categoryChecklist: "Чек-листы",
    categoryCalculator: "Калькуляторы",
    categoryGuide: "Обучающие материалы",

    // calculator page
    calcBackToTools: "Инструменты для бизнеса",
    calcTitle: "Калькуляторы",
    calcSubtitle: "Предварительный расчет — использует ту же логику, что и конструктор форм при подаче заявки.",
    calcTabLeasing: "Лизинг вагонов",
    calcTabSubsidy: "Субсидия на животноводство",
    calcUnitPrice: "Стоимость 1 вагона, тенге",
    calcCount: "Количество вагонов",
    calcDownPct: "Авансовый платеж, %",
    calcTermMonths: "Срок лизинга, мес.",
    calcTotalPrice: "Итоговая стоимость",
    calcDownAmount: "Сумма аванса",
    calcMonthly: "Ежемесячный платеж",
    calcGoToLeasingApply: "Перейти к подаче заявки на лизинг вагонов",
    calcHeadCount: "Поголовье, голов",
    calcRatePerHead: "Ставка на 1 голову, тенге",
    calcSubsidyAmount: "Расчетная сумма субсидии",
    calcGoToSubsidyApply: "Перейти к подаче заявки на субсидию",

    // apply / login-required
    loginRequiredTitle: "Нужно войти как предприниматель",
    backToService: "Назад к услуге",
    stage1Prefix: "Этап 1.",
    noExtraDataTitle: "Дополнительные данные не требуются",
    noExtraDataBody: "По этой заявке больше нет этапов, ожидающих ввода данных.",
    backToApplication: "К заявке",
    cabinetLoginTitle: "Личный кабинет предпринимателя",
    cabinetLoginBody: "Войдите, чтобы увидеть свои заявки, документы и уведомления.",
    mapLoginTitle: "Карта проектов",
    mapLoginBody: "Войдите, чтобы увидеть карту проектов, профинансированных группой компаний Холдинга «Байтерек».",
    typePortal: "Портал",
    typeReport: "Отчет",
    typeFinancial: "Финансовая отчетность",
    typeResearch: "Исследование",
    typeDashboard: "Дашборд",

    // roles
    roleClient: "Предприниматель",
    roleSuperadmin: "Суперадминистратор",
    roleOrgAdmin: "Администратор ДО",
    roleAuthor: "Автор услуг",
    roleAnalyst: "Аналитик",
  },
  kk: {
    home: "Басты бет",
    catalog: "Қызметтер каталогы",
    tools: "Бизнес құралдары",
    analytics: "Аналитика",
    map: "Жобалар картасы",
    cabinet: "Жеке кабинет",
    admin: "Әкімшілендіру",
    login: "Кіру",
    logout: "Шығу",
    heroTitle: "Бизнесті қолдаудың бірыңғай порталы",
    heroSubtitle: "«Байтерек» ҰБХ АҚ және еншілес ұйымдардың барлық қолдау шаралары — бір жерде",
    footerRights: "Барлық құқықтар қорғалған",
    brandAbbr: "БҚБП",

    aiGreeting:
      "Сәлеметсіз бе! Мен БҚБП AI-көмекшісімін. Қандай қолдау қажет екенін сипаттаңыз — мысалы, «вагондарды лизингке алғым келеді» немесе «мал шаруашылығына субсидия» — мен қолайлы қызметті таңдап беремін.",
    aiError: "Қате орын алды. Қайталап көріңіз.",
    aiWidgetTitle: "БҚБП AI-көмекшісі",
    aiTyping: "теруде…",
    aiInputPlaceholder: "Міндетіңізді сипаттаңыз…",
    pageTitle: "БҚБП — Бизнесті қолдаудың бірыңғай порталы",
    pageDescription: "Әмбебап конструктор негізіндегі «Бизнесті қолдаудың бірыңғай порталы» цифрлық платформасының MVP нұсқасы. «Байтерек» ҰБХ АҚ.",
    loginPromptLoading: "Кіру…",
    footerMvpNote: "AstanaHub конкурсына арналған MVP",
    loginPromptButton: "eGov IDP арқылы кіру (демо)",

    wizardStepOf: "Қадам",
    wizardStepOfSeparator: "/",
    wizardDraftSaved: "Жоба сақталды",
    wizardBack: "Артқа",
    wizardNext: "Келесі",
    wizardSubmit: "Өтінімді жіберу",
    wizardSubmitting: "Жіберілуде…",
    wizardCheckFields: "Тексеріңіз:",
    wizardFieldRequired: "міндетті өріс",
    wizardFieldMustBeNumber: "сан болуы керек",
    wizardFieldMin: "минимум",
    wizardFieldMax: "максимум",
    wizardAiCheck: "Өтінімді AI көмегімен тексеру",
    wizardAiCheckOk: "AI тексеруі: өтінім толық көрінеді және жіберуге дайын.",
    wizardSubmitError: "Өтінімді жіберу мүмкін болмады. Қайталап көріңіз.",
    wizardResultTitle: "Өтінім жіберілді",
    wizardResultNumber: "Өтінім нөмірі:",
    wizardResultBodySubmitted: "Өтінім қарауға жіберілді және ЭЦҚ-мен қол қойылды (mock). Мәртебе мен хабарламалар жеке кабинетте қолжетімді.",
    wizardResultBodyContinued: "Өтінім қарауға жіберілді. Мәртебе мен хабарламалар жеке кабинетте қолжетімді.",
    wizardGoToCabinet: "Жеке кабинетке өту",
    wizardGoToService: "Қызметке",
    wizardSelectPlaceholder: "Таңдаңыз…",
    wizardYes: "Иә",

    homeHeroTag: "«Байтерек» ҰБХ АҚ және еншілес ұйымдар",
    homeHeroTitle: "Бизнесті қолдаудың барлық шаралары — бір терезеде",
    homeHeroBody:
      "Қолайлы қолдау шарасын табыңыз, түсінікті қадамдық сценарий бойынша өтінім беріңіз және мәртебені қадағалаңыз — Холдингтің әртүрлі сайттарын аралаудың қажеті жоқ.",
    homeSearchPlaceholder: "Мысалы: вагон лизингі, мал шаруашылығына субсидия…",
    homeSearchButton: "Қызмет табу",
    homeOpenCatalog: "Қызметтер каталогын ашу",
    homeMyApplications: "Менің өтінімдерім",
    homeAskAi: "AI-көмекшіден сұраңыз (оң жақ төменде)",
    statServices: "Порталдағы қызметтер",
    statOrgs: "Холдинг ұйымдары",
    statProjects: "Картадағы жобалар",
    statRegions: "Қамтылған өңірлер",
    howItWorksTitle: "Бұл қалай жұмыс істейді",
    howStep1Title: "Қызметті табыңыз",
    howStep1Body: "Іздеу, каталог, санаттар немесе AI-көмекші арқылы",
    howStep2Title: "Өтінім беріңіз",
    howStep2Body: "Ұзақ анкетаның орнына түсінікті қадамдық сценарий",
    howStep3Title: "Мәртебені қадағалаңыз",
    howStep3Body: "Жеке кабинетте — мәртебелер, құжаттар, хабарламалар",
    howStep4Title: "Нәтиже алыңыз",
    howStep4Body: "Қызмет толық аяқталғанға дейін шешім және сүйемелдеу",
    directionsTitle: "Қолдау бағыттары",
    popularTitle: "Танымал қызметтер",
    allServices: "Барлық қызметтер",
    applyNow: "Өтінім беру",
    analyticsCardTitle: "Аналитикалық есептілік",
    analyticsCardBody: "Холдинг еншілес ұйымдарының дашбордтары мен есептері",
    mapCardTitle: "Жобалар картасы",
    mapCardBody: "Қазақстан картасында Холдинг тобы қаржыландырған жобалар",
    toolsCardTitle: "Бизнеске арналған құралдар",
    toolsCardBody: "Білім базасы, үлгілер, чек-парақтар және калькуляторлар",

    catalogTitle: "Қолдау шаралары каталогы",
    catalogCount: (total: number, found: number) => `Порталда ${total} қызмет қолжетімді. Сұрауыңыз бойынша табылды: ${found}.`,
    catalogSearchPlaceholder: "Атауы, саласы, міндеті бойынша іздеу…",
    catalogSearchButton: "Табу",
    allCategories: "Барлық санаттар",
    multiStage: "көпкезеңді",
    catalogEmptyTitle: "Сұрауыңыз бойынша ештеңе табылмады",
    catalogEmptyBody: "Тұжырымды өзгертіп көріңіз, сүзгілерді алып тастаңыз немесе оң жақ төмендегі AI-көмекшіден сұраңыз.",

    breadcrumbCatalog: "Қызметтер каталогы",
    multiStageService: "көпкезеңді қызмет",
    stepsOf: "қадам,",
    stepsOfStagesOne: "кезеңде",
    stepsOfStagesMany: "кезеңдерде",
    stepOne: "қадам",
    documentsCount: "Құжаттар саны",
    howApplyGoes: "Өтінім беру қалай өтеді",
    stageWord: "Кезең",
    fieldsCount: "өріс",

    cabinetTitle: "Жеке кабинет",
    myApplications: "Менің өтінімдерім",
    notifications: "Хабарламалар",
    noNotifications: "Хабарламалар жоқ",
    noApplicationsTitle: "Өтінімдер әлі жоқ",
    noApplicationsBody: "Каталогтан қолайлы қолдау шарасын тауып, алғашқы өтінімді беріңіз.",
    goToCatalog: "Қызметтер каталогына өту",
    details: "Толығырақ",
    continueDraft: "Толтыруды жалғастыру",
    submitExtra: "Кеңейтілген деректерді ұсыну",
    createdOn: "құрылды",
    submittedOn: "берілді",
    documentsWord: "құжат",

    backToCabinet: "Жеке кабинет",
    reviewHistory: "Қарау тарихы",
    documentsSection: "Құжаттар",
    noDocuments: "Құжат тіркелмеген.",
    signedEsign: "ЭЦҚ қойылған",
    applicationData: "Өтінім деректері",

    analyticsTitle: "Еншілес ұйымдардың аналитикалық есептілігі",
    analyticsSubtitle: "Холдинг пен еншілес ұйымдардың дайын аналитикалық материалдарының, есептерінің және дашбордтарының бірыңғай каталогы.",
    allOrganizations: "Барлық ұйымдар",
    sourceLabel: "Дереккөз",
    periodLabel: "Кезең",
    openSource: "Дереккөзді ашу",
    embedPreview: "Кірістірілген көрініс",
    hidePreview: "Алдын ала қарауды жасыру",
    previewCaption: "Демо-алдын ала қарау — өндірісте мұнда дереккөздің тірі дашборды кірістіріледі:",

    mapTitle: "Жобалардың интерактивті картасы",
    mapSubtitle: "«Байтерек» Холдинг тобы қаржыландырған жобалар, өңірге және іске асыру мәртебесіне байланысты.",
    allRegions: "Барлық өңірлер",
    allIndustries: "Барлық салалар",
    allStatuses: "Барлық мәртебелер",
    foundCount: "Табылды",
    projectsByRegion: "Өңірлер бойынша жобалар",
    moreRegions: (n: number) => `тағы ${n} өңір`,
    loadingMap: "Карта жүктелуде…",
    noDataWord: "Деректер жоқ",
    regionWord: "Өңір",
    industryWord: "Сала",
    amountWord: "Сома",
    periodWord: "Кезең",
    statusWord: "Мәртебе",
    statusPlanned: "Жоспарлануда",
    statusFinancing: "Қаржыландырылуда",
    statusActive: "Іске асырылуда",
    statusCompleted: "Аяқталды",

    toolsTitle: "Бизнесті дамытуға арналған құралдар мен материалдар",
    toolsSubtitle: "Кәсіпкерді бизнесті дамытудың әртүрлі кезеңдерінде сүйемелдейтін білім базасы, үлгілер, чек-парақтар және калькуляторлар.",
    materialInDevelopment: "Материал әзірленуде.",
    categoryKnowledgeBase: "Білім базасы",
    categoryTemplate: "Құжат үлгілері",
    categoryChecklist: "Чек-парақтар",
    categoryCalculator: "Калькуляторлар",
    categoryGuide: "Оқыту материалдары",

    calcBackToTools: "Бизнес құралдары",
    calcTitle: "Калькуляторлар",
    calcSubtitle: "Алдын ала есептеу — өтінім берген кезде форма конструкторымен бірдей логиканы қолданады.",
    calcTabLeasing: "Вагон лизингі",
    calcTabSubsidy: "Мал шаруашылығына субсидия",
    calcUnitPrice: "1 вагонның құны, теңге",
    calcCount: "Вагондар саны",
    calcDownPct: "Авансылық төлем, %",
    calcTermMonths: "Лизинг мерзімі, ай",
    calcTotalPrice: "Жалпы құны",
    calcDownAmount: "Аванс сомасы",
    calcMonthly: "Ай сайынғы төлем",
    calcGoToLeasingApply: "Вагон лизингіне өтінім беруге өту",
    calcHeadCount: "Мал басы, бас",
    calcRatePerHead: "1 басқа арналған мөлшерлеме, теңге",
    calcSubsidyAmount: "Есептелген субсидия сомасы",
    calcGoToSubsidyApply: "Субсидияға өтінім беруге өту",

    loginRequiredTitle: "Кәсіпкер ретінде кіру қажет",
    backToService: "Қызметке оралу",
    stage1Prefix: "Кезең 1.",
    noExtraDataTitle: "Қосымша деректер қажет емес",
    noExtraDataBody: "Бұл өтінім бойынша деректер енгізуді күтетін кезеңдер жоқ.",
    backToApplication: "Өтінімге оралу",
    cabinetLoginTitle: "Кәсіпкердің жеке кабинеті",
    cabinetLoginBody: "Өтінімдеріңізді, құжаттарыңызды және хабарламаларыңызды көру үшін кіріңіз.",
    mapLoginTitle: "Жобалар картасы",
    mapLoginBody: "«Байтерек» Холдинг тобы қаржыландырған жобалар картасын көру үшін кіріңіз.",
    typePortal: "Портал",
    typeReport: "Есеп",
    typeFinancial: "Қаржылық есептілік",
    typeResearch: "Зерттеу",
    typeDashboard: "Дашборд",

    roleClient: "Кәсіпкер",
    roleSuperadmin: "Супер әкімші",
    roleOrgAdmin: "ЕҰ әкімшісі",
    roleAuthor: "Қызмет авторы",
    roleAnalyst: "Аналитик",
  },
} as const;

export type UiStringKey = {
  [K in keyof (typeof UI_STRINGS)["ru"]]: (typeof UI_STRINGS)["ru"][K] extends string ? K : never;
}[keyof (typeof UI_STRINGS)["ru"]];

export function t(locale: Locale, key: UiStringKey): string {
  return UI_STRINGS[locale][key] as string;
}

export function tCatalogCount(locale: Locale, total: number, found: number): string {
  return UI_STRINGS[locale].catalogCount(total, found);
}

export function tMoreRegions(locale: Locale, n: number): string {
  return UI_STRINGS[locale].moreRegions(n);
}

// Service.category is free-text in the DB (no categoryKk column) — the seed data only ever
// uses a fixed handful of Russian category names, so a static dictionary covers the catalog
// without a schema change. Falls back to the original string for anything unmapped.
const CATEGORY_KK: Record<string, string> = {
  "Лизинг": "Лизинг",
  "Кредитование": "Кредиттеу",
  "Субсидирование": "Субсидиялау",
  "Гарантирование": "Кепілдік беру",
  "Страхование": "Сақтандыру",
  "Инвестирование": "Инвестициялау",
};

export function pickCategory(category: string, locale: Locale): string {
  if (locale === "kk") return CATEGORY_KK[category] ?? category;
  return category;
}

// Project.region / Project.industry are also free-text (no *Kk columns) — same fixed-set
// static-dictionary approach as categories above.
const REGION_KK: Record<string, string> = {
  "Актюбинская область": "Ақтөбе облысы",
  "Алматинская область": "Алматы облысы",
  "Атырауская область": "Атырау облысы",
  "Восточно-Казахстанская область": "Шығыс Қазақстан облысы",
  "Жамбылская область": "Жамбыл облысы",
  "Карагандинская область": "Қарағанды облысы",
  "Костанайская область": "Қостанай облысы",
  "Кызылординская область": "Қызылорда облысы",
  "Мангистауская область": "Маңғыстау облысы",
  "Павлодарская область": "Павлодар облысы",
  "Северо-Казахстанская область": "Солтүстік Қазақстан облысы",
  "Туркестанская область": "Түркістан облысы",
  "г. Астана": "Астана қ.",
  "г. Алматы": "Алматы қ.",
  "г. Шымкент": "Шымкент қ.",
};

const INDUSTRY_KK: Record<string, string> = {
  "Животноводство": "Мал шаруашылығы",
  "Легкая промышленность": "Жеңіл өнеркәсіп",
  "Логистика": "Логистика",
  "Пищевая промышленность": "Тамақ өнеркәсібі",
  "Промышленность": "Өнеркәсіп",
  "Сельское хозяйство": "Ауыл шаруашылығы",
  "Транспорт": "Көлік",
};

export function pickRegion(region: string, locale: Locale): string {
  if (locale === "kk") return REGION_KK[region] ?? region;
  return region;
}

export function pickIndustry(industry: string, locale: Locale): string {
  if (locale === "kk") return INDUSTRY_KK[industry] ?? industry;
  return industry;
}
