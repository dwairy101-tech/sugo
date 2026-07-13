(() => {
  "use strict";

  window.SUGO = window.SUGO || {};

  const VERSION = "6.0-mode-aware-precision-routing";
  const ACCURACY_SYNONYMS = Object.freeze({"ban":["حظر","محظور","باند","موقوف","ايقاف","إيقاف","تقييد","مقيد","مقيّد","مقيده","مقيّدة","تقييد الحساب","account restricted","account restriction","ban","banned","blocked","restriction","restricted","suspend","suspended"],"unban":["فك حظر","رفع الحظر","الغاء الحظر","إلغاء الحظر","استئناف","مراجعة","اعتذار","appeal","unban","review","restore","apology"],"reason":["سبب","بسبب","ليش","لماذا","reason","because","due"],"message":["رساله","رسالة","رسائل","محادثه","محادثة","دردشه","دردشة","شات","خاص","chat","message","messages","conversation","dm","inbox"],"sexual":["جنسي","جنسية","كلام جنسي","رسائل جنسية","محتوى جنسي","الفاظ جنسية","إيحاء","ايحاء","إباحي","اباحي","عري","تعري","عضو","sexual","sex","explicit","sexually","porn","nudity","nude","private part"],"picture":["صوره","صورة","صور","لقطه","لقطة","سكرين","photo","picture","image","screenshot"],"video":["فيديو","مقطع","تسجيل","video","recording","clip"],"moments":["لحظات","منشور","بوست","moment","moments","post","feed"],"live":["لايف","بث","الغرفه","الغرفة","غرفه","غرفة","live","room","broadcast"],"telegram":["تليجرام","تلجرام","تيليجرام","telegram","tg"],"phone":["رقم هاتف","رقم الهاتف","هاتف","جوال","موبايل","phone","phone number","mobile"],"underage":["قاصر","تحت السن","اقل من 18","أقل من 18","طفل","اطفال","أطفال","minor","underage","under age","child","children"],"maleFemale":["ذكر بحساب انثى","ذكر بحساب أنثى","ولد بحساب بنت","شاب بحساب بنت","male using female","female account","wrong gender"],"smoking":["تدخين","يدخن","سيجار","سيجاره","سيجارة","smoking","smoke","cigarette"],"drug":["مخدر","مخدرات","حشيش","تعاطي","drug","drugs","narcotic","weed"],"weapon":["سلاح","اسلحه","أسلحة","مسدس","سكين","weapon","gun","knife"],"insult":["سب","شتم","اساءه","إساءة","اهانه","إهانة","insult","abuse","curse","swear"],"management":["اداره","إدارة","الادارة","الإدارة","مشرف","مسؤول","admin","management","moderator","official"],"coinSeller":["بائع كوينز","بائع كوين","بيع كوينز","coin seller","sell coins","seller"],"promote":["ترويج","اعلان","إعلان","منصه اخرى","منصة أخرى","تطبيق اخر","تطبيق آخر","promote","promotion","advertise","other app","platform"],"vpn":["vpn","في بي ان","فى بى ان","محاكي","محاكى","simulator","region","منطقه","منطقة"],"refund":["استرداد","رد المبلغ","ترجيع","refund","chargeback"],"rejected":["رفض","مرفوض","تم رفض","reject","rejected","declined"],"abnormalDevice":["جهاز غير طبيعي","جهاز غير طبيعى","abnormal device","device abnormal"],"country":["دوله","دولة","بلد","country"],"religion":["دين","اديان","أديان","religion","religions"],"childPorn":["استغلال اطفال","استغلال أطفال","اباحيه اطفال","إباحية أطفال","child porn","csam"],"recharge":["شحن","رصيد","كوينز","كوين","ذهب","شراء","دفع","recharge","charge","coins","coin","gold","payment","purchase"],"invoice":["فاتوره","فاتورة","ايصال","إيصال","وصل","رقم العمليه","رقم العملية","invoice","receipt","transaction"],"visa":["فيزا","visa","card","بطاقه","بطاقة"],"agency":["وكاله","وكالة","اجنسي","agency","agent"],"host":["مضيف","مضيفه","مذيع","مذيعه","host","anchor"],"withdrawal":["سحب","السحب","طلب سحب","طلب السحب","راتب","مستحقات","ماسات","تحويل","withdraw","withdrawal","salary","payout","diamonds"],"cancel":["الغاء","إلغاء","cancel"],"add":["اضافه","إضافة","اضف","add"],"remove":["حذف","ازاله","إزالة","remove","delete"],"game":["لعبه","لعبة","العاب","ألعاب","game","games"],"info":["معلومات","تفاصيل","شرح","info","information","details"],"crash":["تعطل التطبيق","التطبيق لا يعمل","كراش","مشكله تطبيق","مشكلة تطبيق","crash","app crash","app not working"],"microphone":["ميكروفون","المايك","مايك","الميكروفون","microphone","mic"],"audio":["لا يوجد صوت","ما في صوت","الصوت لا يعمل","لا اسمع","لا أسمع","no sound","cannot hear","cant hear","audio"],"deleteAccount":["حذف حسابي","حذف الحساب","اغلاق الحساب","إغلاق الحساب","delete account","account deletion","close account"],"location":["موقع","مسافه","مسافة","اخفاء المسافة","إخفاء المسافة","location","distance"],"disappear":["اختفي","اختفى","مختفي","اختفاء","disappear","missing"],"task":["مهمه","مهمة","مهام","تاسك","task","tasks","daily","family"],"match":["تطابق","مطابقه","مطابقة","match","matching"],"password":["باسورد","كلمة السر","كلمة السر","كلمه مرور","كلمة مرور","password","reset password"],"binding":["ربط","توثيق","تحقق","ملكيه","ملكية","binding","bind","verification","verify","ownership"],"change":["تغيير","تعديل","نقل","change","transfer"],"whatsapp":["واتساب","واتس","whatsapp","wa"],"create":["انشاء","إنشاء","فتح","create","open"],"notReceived":["ما وصل","ما وصلت","لم يصل","لم تصل","لم استلم","لم يستلم","not received","missing"],"account":["حساب","حسابي","حسابك","الحساب","اكونت","account","profile"]});
  const ACCURACY_ROUTES = Object.freeze([{"name":"ban-sexual-messages","all":[["ban"],["sexual"],["message"]],"any":[],"ticketTopicIds":["sv-tickets-ban-sexual-messages"],"topicIds":["sv-refined-ban-sexual-messages","sv-refined-ban-sexual-content-in-messages"]},{"name":"ban-sexual-picture","all":[["ban"],["sexual"],["picture"]],"any":[],"ticketTopicIds":["sv-tickets-ban-sexual-picture"],"topicIds":["sv-refined-ban-sexual-picture"]},{"name":"ban-sexual-video","all":[["ban"],["sexual"],["video"]],"any":[],"ticketTopicIds":["sv-tickets-ban-sexual-video"],"topicIds":["sv-refined-ban-sexual-video"]},{"name":"ban-sexual-moments","all":[["ban"],["sexual"],["moments"]],"any":[],"ticketTopicIds":["sv-tickets-ban-sexual-moments"],"topicIds":["sv-refined-ban-sexual-moments"]},{"name":"ban-sexual-commerce","all":[["ban"],["sexual"]],"any":[["coinSeller"],["recharge"]],"ticketTopicIds":["sv-tickets-ban-sexual-commerce"],"topicIds":["sv-refined-ban-sexual-commerce"]},{"name":"ban-sexual-offer","all":[["ban"],["sexual"]],"any":[["عرض","طلب علاقه","طلب علاقة","offer"]],"ticketTopicIds":["sv-tickets-ban-sexual-offer"],"topicIds":["sv-refined-ban-sexual-offer"]},{"name":"ban-private-part-lr","all":[["ban"],["sexual"]],"any":[["private part","عضو"]],"ticketTopicIds":["sv-tickets-ban-private-part-lr"],"topicIds":[]},{"name":"ban-telegram","all":[["ban"],["telegram"]],"any":[],"ticketTopicIds":["sv-tickets-ban-telegram"],"topicIds":["sv-refined-ban-external-contact-telegram"]},{"name":"ban-phone-number","all":[["ban"],["phone"]],"any":[],"ticketTopicIds":["sv-tickets-ban-ph-num"],"topicIds":["sv-refined-ban-external-contact-phone-number"]},{"name":"ban-underage","all":[["ban"],["underage"]],"any":[],"ticketTopicIds":["sv-tickets-ban-underage-video","sv-tickets-ban-underage"],"topicIds":["sv-refined-unban-review-underage-verification-video-sent","sv-refined-ban-underage-suspicion"]},{"name":"ban-male-female","all":[["ban"],["maleFemale"]],"any":[],"ticketTopicIds":["sv-tickets-ban-male-female-unban-video","sv-tickets-ban-male-female-reason"],"topicIds":["sv-refined-unban-review-male-using-female-account-video-sent","sv-refined-ban-male-using-female-account"]},{"name":"ban-smoking-live","all":[["ban"],["smoking"],["live"]],"any":[],"ticketTopicIds":["sv-tickets-ban-smoking-live"],"topicIds":["sv-refined-ban-smoking-during-live"]},{"name":"ban-smoking-image","all":[["ban"],["smoking"],["picture"]],"any":[],"ticketTopicIds":["sv-tickets-ban-smoking-image"],"topicIds":["sv-refined-ban-smoking-image"]},{"name":"ban-drug-live","all":[["ban"],["drug"],["live"]],"any":[],"ticketTopicIds":["sv-tickets-ban-drug-live"],"topicIds":["sv-refined-ban-drug-use-during-live"]},{"name":"ban-drug-image","all":[["ban"],["drug"],["picture"]],"any":[],"ticketTopicIds":["sv-tickets-ban-drug-image"],"topicIds":["sv-refined-ban-drug-use-image"]},{"name":"ban-weapon-live","all":[["ban"],["weapon"],["live"]],"any":[],"ticketTopicIds":["sv-tickets-ban-weapon-live"],"topicIds":["sv-refined-ban-weapon-during-live"]},{"name":"ban-weapon-image","all":[["ban"],["weapon"],["picture"]],"any":[],"ticketTopicIds":["sv-tickets-ban-weapon-image"],"topicIds":["sv-refined-ban-weapon-image"]},{"name":"ban-insulting","all":[["ban"],["insult"]],"any":[],"ticketTopicIds":["sv-tickets-ban-insulting"],"topicIds":["sv-refined-ban-insulting-another-user"]},{"name":"ban-pretend-management","all":[["ban"],["management"]],"any":[["انتحال","يدعي","يتظاهر","pretend"]],"ticketTopicIds":["sv-tickets-ban-pretend-management"],"topicIds":["sv-refined-ban-pretending-to-be-management"]},{"name":"ban-pretend-coin-seller","all":[["ban"],["coinSeller"]],"any":[["انتحال","يدعي","يتظاهر","pretend"]],"ticketTopicIds":["sv-tickets-ban-pretend-coin-seller"],"topicIds":["sv-refined-ban-pretending-to-be-a-coin-seller"]},{"name":"ban-promoting-app","all":[["ban"],["promote"]],"any":[],"ticketTopicIds":["sv-tickets-ban-promoting-app"],"topicIds":["sv-refined-ban-promoting-other-platforms"]},{"name":"ban-vpn-simulator","all":[["ban"],["vpn"]],"any":[],"ticketTopicIds":["sv-tickets-ban-simulator-vpn"],"topicIds":["sv-refined-ban-vpn-region-violation"]},{"name":"ban-refund","all":[["ban"],["refund"]],"any":[],"ticketTopicIds":["sv-tickets-ban-refund"],"topicIds":[]},{"name":"ban-rejected-unban","all":[["ban"],["rejected"],["unban"]],"any":[],"ticketTopicIds":["sv-tickets-ban-rejected-unban"],"topicIds":[]},{"name":"ban-abnormal-device","all":[["ban"],["abnormalDevice"]],"any":[],"ticketTopicIds":["sv-tickets-ban-abnormal-device"],"topicIds":[]},{"name":"ban-insulted-country","all":[["ban"],["country"],["insult"]],"any":[],"ticketTopicIds":["sv-tickets-ban-insulted-country"],"topicIds":[]},{"name":"ban-insulted-religions","all":[["ban"],["religion"],["insult"]],"any":[],"ticketTopicIds":["sv-tickets-ban-insulted-religions"],"topicIds":[]},{"name":"ban-child-porn","all":[["ban"],["childPorn"]],"any":[],"ticketTopicIds":["sv-tickets-ban-child-porn"],"topicIds":[]},{"name":"ban-request-unban","all":[["ban"],["unban"]],"any":[],"ticketTopicIds":["sv-tickets-ban-request-unban"],"topicIds":["sv-refined-request-unban-apology","account-ban-unban"]},{"name":"coins-not-received","all":[["recharge"],["notReceived"]],"any":[],"ticketTopicIds":["sv-tickets-coins-not-received"],"topicIds":["sv-refined-coins-not-received","payment-recharge-missing-coins"]},{"name":"recharge-invoice","all":[["recharge"],["invoice"]],"any":[],"ticketTopicIds":["sv-tickets-recharge-ticket-1","sv-tickets-recharge-ticket-2"],"topicIds":["sv-refined-request-recharge-invoice"]},{"name":"recharge-link","all":[["recharge"],["رابط","link"]],"any":[],"ticketTopicIds":["sv-tickets-recharge-link"],"topicIds":["sv-refined-recharge-link"]},{"name":"recharge-first-charge","all":[["recharge"],["اول","أول","first"]],"any":[],"ticketTopicIds":["sv-tickets-recharge-first-charge"],"topicIds":["sv-refined-first-recharge-requirement"]},{"name":"recharge-visa","all":[["recharge"],["visa"]],"any":[],"ticketTopicIds":["sv-tickets-recharge-visa"],"topicIds":["sv-refined-recharge-through-visa"]},{"name":"recharge-agency","all":[["recharge"],["agency"]],"any":[],"ticketTopicIds":["sv-tickets-recharge-agency-eg","sv-tickets-recharge-agency-sa","sv-tickets-recharge-agency-sy","sv-tickets-recharge-agency-iq","sv-tickets-recharge-agency-ae"],"topicIds":["sv-refined-recharge-through-agency-egypt","sv-refined-recharge-through-agency-saudi-arabia","sv-refined-recharge-through-agency-syria","sv-refined-recharge-through-agency-iraq","sv-refined-recharge-through-agency-uae"]},{"name":"withdrawal-success-not-received","all":[["withdrawal"],["notReceived"]],"any":[],"ticketTopicIds":["sv-tickets-withdrawal-success-not-received"],"topicIds":["sv-refined-withdrawal-successful-but-not-received"]},{"name":"withdrawal-cancel","all":[["withdrawal"],["cancel"]],"any":[],"ticketTopicIds":["sv-tickets-withdrawal-cancel"],"topicIds":["sv-refined-cancel-withdrawal-request"]},{"name":"withdrawal-add-remove","all":[["withdrawal"]],"any":[["add"],["remove"]],"ticketTopicIds":["sv-tickets-withdrawal-add-remove"],"topicIds":["sv-refined-add-remove-withdrawal-option"]},{"name":"binding-verification","all":[["binding"]],"any":[["account"],["verification"]],"ticketTopicIds":["sv-tickets-binding-verification"],"topicIds":["sv-refined-account-ownership-verification"]},{"name":"password-reset","all":[["password"]],"any":[],"ticketTopicIds":["sv-tickets-binding-request-reset-password"],"topicIds":["sv-refined-password-reset-request-submitted","account-security-reset"]},{"name":"phone-change","all":[["phone"],["change"]],"any":[],"ticketTopicIds":["sv-tickets-binding-request-change-ph"],"topicIds":["sv-refined-phone-binding-request-submitted","account-login-phone"]},{"name":"agency-create","all":[["agency"],["create"]],"any":[],"ticketTopicIds":["sv-tickets-agency-create"],"topicIds":["sv-refined-create-host-agency","sv-refined-apply-to-open-host-agency"]},{"name":"agency-change-anchor","all":[["agency"],["host"],["change"]],"any":[],"ticketTopicIds":["sv-tickets-agency-change-anchor"],"topicIds":["sv-refined-change-agency-for-anchor"]},{"name":"agency-sub-create","all":[["agency"],["sub","فرعيه","فرعية"],["create"]],"any":[],"ticketTopicIds":["sv-tickets-agency-create-sub"],"topicIds":["sv-refined-create-sub-agency"]},{"name":"agency-admin-whatsapp","all":[["agency"],["whatsapp"]],"any":[],"ticketTopicIds":["sv-tickets-agency-admin-whatsapp-group"],"topicIds":["sv-refined-agency-admin-whatsapp-group-requirements"]},{"name":"games-add","all":[["game"],["add"]],"any":[],"ticketTopicIds":["sv-tickets-games-add"],"topicIds":["sv-refined-add-game-request","sv-refined-add-games-request"]},{"name":"games-remove","all":[["game"],["remove"]],"any":[],"ticketTopicIds":["sv-tickets-games-remove"],"topicIds":["sv-refined-remove-game-request","sv-refined-remove-games-request"]},{"name":"games-info","all":[["game"],["info"]],"any":[],"ticketTopicIds":["sv-tickets-games-info","sv-tickets-games-info-3"],"topicIds":["sv-refined-game-access-information","sv-refined-games-access-conditions"]},{"name":"app-crash","all":[["crash"]],"any":[],"ticketTopicIds":["sv-tickets-crash-1","sv-tickets-crash-2"],"topicIds":["sv-refined-app-crash-refresh-steps","sv-refined-app-crash-upload-log","function-games-crashing"]},{"name":"country-change","all":[["country"],["change"]],"any":[],"ticketTopicIds":["sv-tickets-country-1","sv-tickets-country-2"],"topicIds":["sv-refined-change-country","sv-refined-change-country-follow-up"]},{"name":"location-disappear","all":[["location"],["disappear"]],"any":[],"ticketTopicIds":["sv-tickets-location-disappear"],"topicIds":["sv-refined-location-disappeared"]},{"name":"location-close-distance","all":[["location"]],"any":[["اخفاء","إخفاء","close"],["distance","مسافه","مسافة"]],"ticketTopicIds":["sv-tickets-location-close"],"topicIds":["sv-refined-close-location-hide-distance"]},{"name":"tasks-daily-family","all":[["task"]],"any":[["daily","يومي"],["family","عائله","عائلة"]],"ticketTopicIds":["sv-tickets-tasks-daily-family"],"topicIds":["sv-refined-daily-and-family-tasks"]},{"name":"tasks-match","all":[["match"]],"any":[],"ticketTopicIds":["sv-tickets-tasks-match1","sv-tickets-tasks-match2","sv-tickets-tasks-match3"],"topicIds":["sv-refined-matching-issue-1","sv-refined-matching-issue-2","sv-refined-matching-issue-3"]}]);

  const EXTRA_ACCURACY_ROUTES = Object.freeze([
    { name:"sexual-picture-in-messages", all:[["sexual"],["picture"],["message"]], any:[], ticketTopicIds:["sv-tickets-ban-sexual-picture"], topicIds:["sv-refined-ban-sexual-content-in-messages","sv-refined-ban-sexual-picture"] },
    { name:"sexual-messages-context", all:[["sexual"],["message"]], any:[], ticketTopicIds:["sv-tickets-ban-sexual-messages"], topicIds:["sv-refined-ban-sexual-content-in-messages","sv-refined-ban-sexual-messages"] },
    { name:"login-issue-general", all:[["login","دخول","لا يدخل","تسجيل دخول","افوت","ادخل"],["account"]], any:[], ticketTopicIds:[], topicIds:["account-login-issues","account-support-optimized"] },
    { name:"delete-account", all:[["deleteAccount"]], any:[], ticketTopicIds:[], topicIds:["account-ban-deletion"] },
    { name:"account-restriction-general", all:[["ban"],["account"]], any:[], ticketTopicIds:[], topicIds:["account-ban-reasons","account-ban-unban","account-login-issues"] },
    { name:"microphone-not-heard", all:[["microphone"]], any:[["لا يسمع","لا يسمعوني","لا يسمعني","cannot hear","cant hear","not heard","room","غرفة","الغرفه"]], ticketTopicIds:[], topicIds:["function-room-mic-on-not-heard"] },
    { name:"room-no-sound", all:[["audio"]], any:[], ticketTopicIds:[], topicIds:["function-room-no-sound"] },
    { name:"withdrawal-rejected", all:[["withdrawal"],["rejected"]], any:[], ticketTopicIds:[], topicIds:["withdrawal-exchange-support-optimized","sv-refined-request-withdrawal-screenshot"] }
  ]);

  const STOP = new Set(("the is a an to of and or for in on how what do does did i my it this that with can are be please explain whole process from you need customer client issue problem case help me" +
    " من في على عن هل كيف ما ماذا الى إلى او أو مع هذا هذه لو اذا إذا بدي اريد أريد شو ليش العميل المستخدم مشكله مشكلة موضوع حاله حالة بسبب عند عندي انا انت هو هي").split(/\s+/).filter(Boolean));

  const GROUPS = Object.freeze({
    password: ["password","pass","باسورد","باسوورد","كلمة السر","كلمه مرور","كلمة مرور","نسيت الباسورد","استرجاع كلمة السر","reset password","password reset","recovery","recover"],
    login: ["login","sign in","signin","تسجيل دخول","دخول","لا يدخل","ما بيفتح","ما بقدر افوت","مش قادر ادخل","افوت حسابي","ادخل حسابي","لا استطيع الدخول","cannot access account","cant access account","account login","login issue"],
    phone: ["phone","mobile","number","رقم","هاتف","موبايل","رقم الهاتف","ربط رقم","تغيير رقم","linked phone","binding phone","bind phone","unbind phone"],
    sms: ["sms","otp","code","verification code","رساله تحقق","رسالة تحقق","كود","رمز","رمز التحقق","كود التحقق","ما وصلني الكود"],
    binding: ["binding","bind","linked","unlink","ربط","فك ربط","تغيير الربط","ربط الحساب","phone binding"],
    ban: ["ban","banned","blocked","restriction","restricted","suspended","حظر","محظور","انحظر","انحظرت","حسابي محظور","باند","موقوف","ايقاف","إيقاف","تقييد"],
    unban: ["unban","appeal","review ban","restore account","فك حظر","رفع الحظر","الغاء الحظر","إلغاء الحظر","استئناف","مراجعه الحظر","مراجعة الحظر"],
    report: ["report","abuse","complaint","violator","evidence","بلاغ","ابلاغ","شكوى","اساءه","إساءة","مخالف","دليل","سكرين","لقطه","لقطة","فيديو"],
    sexual: ["sexual","sex","porn","nudity","nude","explicit","جنسي","جنسية","إباحي","اباحي","عري","تعري","ايحاء","إيحاء"],
    recharge: ["recharge","topup","charge","payment","pay","coins","coin","purchase","order","transaction","invoice","receipt","شحن","دفع","كوين","كوينز","عملات","فاتوره","فاتورة","ايصال","إيصال","شراء","عملية","عمليه"],
    refund: ["refund","استرداد","ارجاع مبلغ","رجع الفلوس","reversal","rejected payment"],
    withdrawal: ["withdraw","withdrawal","cashout","salary","payout","diamonds","exchange","سحب","راتب","تحويل","استبدال","ماسات","الماس","مستحقات"],
    agency: ["agency","agent","agm","bcm","subagency","mainagency","وكاله","وكالة","وكيل","وكيلة","وكاله فرعيه","وكالة فرعية","وكاله رئيسيه","وكالة رئيسية"],
    host: ["host","anchor","hostess","مضيف","مضيفه","مذيع","مذيعه","مذيعة","انضمام مضيفه","join agency"],
    vip: ["vip","svip","charm","level","في اي بي","الجاذبيه","الجاذبية","شارم","مستوى"],
    game: ["game","games","لعبه","لعبة","العاب","ألعاب","روم العاب","room game","pk"],
    location: ["location","gps","nearby","distance","country","region","موقع","دوله","دولة","بلد","منطقه","منطقة","مسافه","مسافة","قريب"],
    country: ["change country","country change","تغيير الدوله","تغيير الدولة","تغيير بلد","الدوله الحاليه","الدولة الحالية"],
    gender: ["gender","sex change","تغيير الجنس","جنس الحساب","ذكر","انثى","أنثى"],
    room: ["room","live","broadcast","لايف","بث","غرفه","غرفة","روم"],
    message: ["message","messages","chat","dm","inbox","رساله","رسالة","رسائل","شات","دردشه","دردشة","خاص"],
    moment: ["moment","moments","post","feed","لحظات","منشور","بوست"],
    task: ["task","tasks","daily task","family task","مهمه","مهمة","مهام","يوميه","يومية","عائله","عائلة"],
    crash: ["crash","bug","freeze","app not working","technical issue","كراش","تعطل التطبيق","التطبيق لا يعمل","يعلق التطبيق","مشكله تقنيه بالتطبيق","مشكلة تقنية بالتطبيق"],
    microphone: ["microphone","mic","ميكروفون","الميكروفون","المايك","مايك"],
    audio: ["audio","sound","no sound","cannot hear","cant hear","صوت","لا يوجد صوت","ما في صوت","لا اسمع","لا أسمع"],
    deleteAccount: ["delete account","account deletion","close account","حذف حسابي","حذف الحساب","اغلاق الحساب","إغلاق الحساب"],
    family: ["family","families","عائلة","عائله","فاميلي"],
    gift: ["gift","gifts","send gift","receive gift","هدية","هديه","هدايا"]
  });

  const GROUP_WEIGHTS = Object.freeze({
    password:26, login:20, phone:24, sms:24, binding:24,
    ban:28, unban:36, report:28, sexual:32,
    recharge:30, refund:26, withdrawal:30,
    agency:24, host:22, vip:18, game:20,
    location:18, country:24, gender:18, room:15,
    message:18, moment:18, task:18, crash:20, microphone:30, audio:28, deleteAccount:30,
    family:14, gift:12
  });

  const SENTENCE_STOP = new Set("the is a an to of and or for in on with from please customer client issue problem case request reply ticket details profile professional tone dear hello hi we need additional information complete review provide following information first second third fourth fifth sixth seventh account id شكرا شكراً مرحبا مرحباً عزيزي العميل خدمة عملاء سوجو يرجى الرجاء نعتذر المشكلة الحالية التي تواجهك من في على عن الى إلى او أو مع هذا هذه لو اذا إذا بدي اريد أريد شو ليش العميل المستخدم مشكلة مشكله موضوع حالة حاله طلب رد تذكرة تذكره انشاء انشا فتح".split(/\s+/));

  let topicCache = null;
  let sentenceLexiconCache = null;
  let normalizedGroupTermsCache = null;
  const normalizedAccuracyTermsCache = Object.create(null);

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[إأآٱا]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/گ/g, "ك")
      .replace(/پ/g, "ب")
      .replace(/چ/g, "ج")
      .replace(/ڤ/g, "ف")
      .replace(/ـ/g, "")
      .replace(/\b(ما|مش) بقدر (افوت|ادخل|دخل)\b/g, "لا يدخل")
      .replace(/\b(مش قادر|مو قادر) (افوت|ادخل|دخل)\b/g, "لا يدخل")
      .replace(/\b(افتح|افتحلي|افتحها)\b/g, "فتح")
      .replace(/\b(انحظر|انحظرت|انحظرلي)\b/g, "حظر")
      .replace(/\b(افوت|ادخل)\b/g, "دخول")
      .replace(/\bما وصلني\b/g, "ما وصل")
      .replace(/\bpass\s*word\b/g, "password")
      .replace(/\bsign\s*in\b/g, "login")
      .replace(/\blog\s*in\b/g, "login")
      .replace(/\bphone\s*number\b/g, "phone")
      .replace(/\bmobile\s*number\b/g, "phone")
      .replace(/\buser\s*id\b/g, "id")
      .replace(/\baccount\s*id\b/g, "id")
      .replace(/\bsub\s*agency\b/g, "subagency")
      .replace(/\bmain\s*agency\b/g, "mainagency")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .replace(/(^|\s)(ما|مش) بقدر (افوت|ادخل|دخل)(?=\s|$)/g, "$1لا يدخل")
      .replace(/(^|\s)(مش قادر|مو قادر) (افوت|ادخل|دخل)(?=\s|$)/g, "$1لا يدخل")
      .replace(/(^|\s)(افتح|افتحلي|افتحها)(?=\s|$)/g, "$1فتح")
      .replace(/(^|\s)(انحظر|انحظرت|انحظرلي)(?=\s|$)/g, "$1حظر")
      .replace(/(^|\s)(افوت|ادخل)(?=\s|$)/g, "$1دخول")
      .replace(/(^|\s)ما وصلني(?=\s|$)/g, "$1ما وصل")
      .replace(/\s+/g, " ")
      .trim();
  }

  function containsNormalized(haystack, phrase) {
    const hay = String(haystack || "");
    const needle = String(phrase || "");
    if (!needle) return false;
    return needle.length <= 3 ? (` ${hay} `).includes(` ${needle} `) : hay.includes(needle);
  }

  function stableNormalize(value) {
    const first = normalize(value);
    return normalize(first);
  }

  function stripArabicArticle(token) {
    const value = String(token || "");
    return value.length > 4 && value.indexOf("ال") === 0 ? value.slice(2) : value;
  }

  function stripArabicArticlesInPhrase(value) {
    return normalize(value).split(/\s+/).map(stripArabicArticle).filter(Boolean).join(" ");
  }

  function phraseVariants(value) {
    const normalized = normalize(value);
    if (!normalized) return [];
    const values = new Set([normalized, stripArabicArticle(normalized)]);
    normalized.split(/\s+/).forEach((token) => token && values.add(stripArabicArticle(token)));
    return [...values].filter(Boolean);
  }

  function groupTerms(group) {
    if (!normalizedGroupTermsCache) {
      normalizedGroupTermsCache = Object.fromEntries(
        Object.entries(GROUPS).map(([key, values]) => [key, [...new Set(values.flatMap(phraseVariants))]])
      );
    }
    return normalizedGroupTermsCache[group] || [];
  }

  function tokenList(value, keepStop = false, stopSet = STOP) {
    let values = normalize(value).split(/\s+/).map(stripArabicArticle).filter((token) => token && token.length > 1);
    if (!keepStop) values = values.filter((token) => !stopSet.has(token));
    return [...new Set(values)];
  }

  function hasPhrase(haystack, phrase) {
    return containsNormalized(normalize(haystack), normalize(phrase));
  }

  function matchedGroups(query) {
    const normalized = normalize(query);
    return Object.keys(GROUPS).filter((group) => groupTerms(group).some((term) => containsNormalized(normalized, term)));
  }

  function expandQuery(query) {
    const original = tokenList(query);
    const groups = matchedGroups(query);
    const expanded = new Set(original);
    groups.forEach((group) => {
      groupTerms(group).forEach((term) => {
        tokenList(term, true).forEach((token) => !STOP.has(token) && expanded.add(token));
        expanded.add(group);
      });
    });
    return { raw: normalize(query), original, expanded: [...expanded], groups };
  }

  function accTerms(keysOrTerms) {
    const cacheKey = JSON.stringify(keysOrTerms || []);
    if (normalizedAccuracyTermsCache[cacheKey]) return normalizedAccuracyTermsCache[cacheKey];
    const values = [];
    (keysOrTerms || []).forEach((item) => {
      const key = String(item || "").trim();
      if (!key) return;
      if (ACCURACY_SYNONYMS[key]) values.push(key, ...ACCURACY_SYNONYMS[key]);
      else values.push(key);
    });
    normalizedAccuracyTermsCache[cacheKey] = [...new Set(values.flatMap((value) => {
      const normalized = normalize(value);
      const articleSafe = stripArabicArticlesInPhrase(value);
      return [normalized, articleSafe].filter(Boolean);
    }))];
    return normalizedAccuracyTermsCache[cacheKey];
  }

  function accHasAny(text, keysOrTerms) {
    const hay = normalize(text);
    const articleSafeHay = stripArabicArticlesInPhrase(text);
    return accTerms(keysOrTerms).some((term) =>
      containsNormalized(hay, term) || containsNormalized(articleSafeHay, term)
    );
  }

  function detectAccuracyRoutes(query) {
    const raw = normalize(query);
    const explicit = [];
    if (/(^|\s)(سحب|السحب|withdraw|withdrawal|payout)(\s|$)/.test(raw) && /(^|\s)(رفض|مرفوض|reject|rejected|declined)(\s|$)/.test(raw)) {
      const route = EXTRA_ACCURACY_ROUTES.find((item) => item.name === "withdrawal-rejected");
      if (route) explicit.push(route);
    }
    const detected = [...EXTRA_ACCURACY_ROUTES, ...ACCURACY_ROUTES]
      .map((route, index) => ({ route, index }))
      .filter(({ route }) => {
        if (route.all && !route.all.every((group) => accHasAny(raw, group))) return false;
        if (route.any && route.any.length && !route.any.some((group) => accHasAny(raw, group))) return false;
        return true;
      })
      .sort((a, b) => {
        const aSpecificity = (a.route.all?.length || 0) * 10 + (a.route.any?.length ? 1 : 0);
        const bSpecificity = (b.route.all?.length || 0) * 10 + (b.route.any?.length ? 1 : 0);
        return bSpecificity - aSpecificity || a.index - b.index;
      })
      .map(({ route }) => route);

    return [...explicit, ...detected]
      .filter((route, index, rows) => rows.findIndex((item) => item.name === route.name) === index)
      .map((route) => ({
        ...route,
        ticketTopicIds: [...new Set(route.ticketTopicIds || [])],
        topicIds: [...new Set(route.topicIds || [])],
        topicIdsFromRule: [...new Set(route.topicIdsFromRule || [])]
      }));
  }

  function routeFamily(route) {
    const name = String(route?.name || "");
    if (/^(ban-|sexual-|account-restriction)/.test(name)) return "moderation";
    if (/^(login-|password-|phone-|binding-)/.test(name)) return "account-access";
    if (/^(coins-|recharge-)/.test(name)) return "recharge";
    if (/^withdrawal-/.test(name)) return "withdrawal";
    if (/^agency-/.test(name)) return "agency";
    if (/^games-/.test(name)) return "games";
    if (/^(app-|microphone-|room-)/.test(name)) return "technical";
    if (/^(country-|location-)/.test(name)) return "location";
    if (/^tasks-/.test(name)) return "tasks";
    if (/^delete-account/.test(name)) return "account-deletion";
    return name.split("-")[0] || "other";
  }

  function hasConflictingRoutes(routes) {
    if (!Array.isArray(routes) || routes.length < 2) return false;
    const firstFamily = routeFamily(routes[0]);
    return routes.slice(1, 3).some((route) => routeFamily(route) !== firstFamily);
  }

  function inferTags(topic) {
    const text = stableNormalize([topic.title, topic.category, topic.section, topic.path, topic.enText, topic.arText].join(" "));
    return Object.keys(GROUPS).filter((group) => groupTerms(group).some((term) => containsNormalized(text, term))).slice(0, 10);
  }


  function fieldEntries(block) {
    if (!block || typeof block !== "object") return [];
    if (Array.isArray(block.fields)) return block.fields;
    return [
      { label: "Answer", text: block.answer },
      { label: "Mention", text: block.mention },
      { label: "Ticket", text: block.ticket }
    ].filter((field) => String(field.text || "").trim());
  }

  function isAnswerField(label) {
    const value = normalize(label);
    return value === "answer" || value === "الاجابه" || value === "اجابه";
  }

  function stripSearchBoilerplate(text) {
    return String(text || "")
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .filter((line) => {
        const value = normalize(line);
        if (!value) return true;
        if (/^(welcome to (the )?sugo(?: family)?|hello dear customer|dear customer|we are very happy|we are happy|how can (we|i) (assist|help) you|this is sugo customer service)/.test(value)) return false;
        if (/^(مرحبا بك في عايله سوجو|مرحبا عزيزي العميل|عزيزي العميل|يسعدنا|يشرفنا|كيف يمكننا مساعدتك|كيف يمكنني مساعدتك|انت تتواصل مع خدمه عملاء سوجو)/.test(value)) return false;
        if (/^(thank you for contacting sugo|thank you for contacting us|sugo customer service team|sugo customer support team)/.test(value)) return false;
        if (/^(شكرا لتواصلك مع سوجو|شكرا علي تواصلك معنا|فريق خدمه عملاء سوجو)/.test(value)) return false;
        if (/\b(apolog|apology|apologies|sorry|regret|inconvenience)\b/.test(value)) return false;
        if (/(نعتذر|اعتذار|نأسف|ناسف|آسف|اسف|الازعاج)/.test(value)) return false;
        return true;
      })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const EXACT_TOPIC_ALIASES = Object.freeze({
    "sv-refined-customer-service-greeting": [
      "Welcome to the SUGO family",
      "Welcome to SUGO",
      "This is SUGO Customer Service",
      "مرحبًا بك في عائلة سوجو",
      "مرحبا بك في عائلة سوجو",
      "أنت تتواصل مع خدمة عملاء سوجو"
    ],
    "sv-refined-welcome-how-can-we-help": [
      "How can we assist you today",
      "How can we help you today",
      "كيف يمكننا مساعدتك اليوم",
      "كيف يمكننا مساعدتك"
    ]
  });

  function localizedTitlesForPane(pane) {
    const values = [pane?.title, pane?.english?.title, pane?.arabic?.title, String(pane?.id || "").replace(/-/g, " "), ...(EXACT_TOPIC_ALIASES[pane?.id] || [])];
    const aliases = [];
    values.forEach((value) => {
      const text = String(value || "").trim();
      if (!text) return;
      aliases.push(text);
      if (/ترحيب/.test(text)) aliases.push(text.replace(/ترحيب/g, "تحية"));
      if (/تحية/.test(text)) aliases.push(text.replace(/تحية/g, "ترحيب"));
    });
    return [...new Set(aliases.filter(Boolean))];
  }

  function searchablePaneText(pane, language, fallbackText) {
    if (pane?.format !== "support_macro") return String(fallbackText || "");
    const block = pane?.[language];
    const answers = fieldEntries(block)
      .filter((field) => isAnswerField(field.label))
      .map((field) => stripSearchBoilerplate(field.text))
      .filter(Boolean);
    if (answers.length) return answers.join("\n\n");
    return stripSearchBoilerplate(fallbackText);
  }

  function buildTopics() {
    if (topicCache) return topicCache;
    const contentSource = window.SUGO?.Admin?.listPanes ? window.SUGO.Admin : window.SUGO?.KnowledgeBaseContent;
    const macroSource = window.SUGO?.TicketMacros;
    if (!contentSource?.listPanes) return [];
    const rows = [];
    const seen = new Set();
    const appendSource = (source, isTicketMacro = false) => {
      if (!source?.listPanes || !source?.getPaneText) return;
      source.listPanes().forEach((pane) => {
        if (!pane?.id || seen.has(pane.id)) return;
        seen.add(pane.id);
        rows.push({ pane, source, isTicketMacro });
      });
    };
    appendSource(contentSource, false);
    appendSource(macroSource, true);
    topicCache = rows.map(({ pane, source, isTicketMacro }) => {
      const pathParts = Array.isArray(pane.path) ? pane.path.slice(0, -1) : [];
      const path = pathParts.join(" › ") || (isTicketMacro ? "Hidden ticket macro index" : "");
      const enText = source.getPaneText(pane.id, "english");
      const arText = source.getPaneText(pane.id, "arabic");
      const localizedTitles = localizedTitlesForPane(pane);
      const enSearchText = searchablePaneText(pane, "english", enText);
      const arSearchText = searchablePaneText(pane, "arabic", arText);
      const record = {
        id: pane.id,
        title: pane.title || pane.id.replace(/-/g, " "),
        label: pane.title || pane.id.replace(/-/g, " "),
        category: pane.category || "",
        section: pane.section || "",
        library: pane.rootTitle || pane.library || "",
        path,
        enText,
        arText,
        enSearchText,
        arSearchText,
        localizedTitles,
        format: pane.format || "",
        visible: pane.visible !== false,
        isTicketMacro
      };
      const combined = [record.id, ...localizedTitles, record.category, record.section, record.path, enSearchText, arSearchText].join("\n");
      record.allText = normalize(combined);
      record.allPhraseText = stableNormalize(combined);
      record.idNorm = normalize(record.id.replace(/-/g, " "));
      record.titleNorm = normalize(record.title);
      record.titlePhraseNorm = stableNormalize(record.title);
      record.titleAliasesNorm = [...new Set(localizedTitles.map((value) => normalize(value)).filter(Boolean))];
      record.pathNorm = normalize([record.library, record.category, record.section].join(" "));
      record.pathPhraseNorm = stableNormalize([record.library, record.category, record.section].join(" "));
      record.bodyNorm = normalize([enSearchText, arSearchText].join(" "));
      record.bodyPhraseNorm = stableNormalize([enSearchText, arSearchText].join(" "));
      record.tags = inferTags(record);
      return record;
    });
    return topicCache;
  }

  function isTicketMode(options = {}) {
    return Boolean(options.outputType === "ticket" || options.preferTicketTopics || options.smartTicket);
  }

  function topicAllowedForOutput(topic, options = {}) {
    if (!topic) return false;
    if (!isTicketMode(options) && (topic.isTicketMacro || String(topic.id || "").startsWith("sv-tickets-"))) return false;
    return true;
  }

  function routeTopicIds(route, options = {}) {
    if (!route) return [];
    const visibleIds = [...(route.topicIds || []), ...(route.topicIdsFromRule || [])];
    const ids = isTicketMode(options) ? [...(route.ticketTopicIds || []), ...visibleIds] : visibleIds;
    return [...new Set(ids.filter(Boolean))];
  }

  function findExactTitleTopic(query, options = {}) {
    const wanted = normalize(query);
    if (!wanted) return null;
    return buildTopics()
      .filter((topic) => topicAllowedForOutput(topic, options))
      .filter((topic) => topic.idNorm === wanted || (topic.titleAliasesNorm || []).includes(wanted))
      .sort((a, b) => {
        if (Boolean(a.visible) !== Boolean(b.visible)) return a.visible ? -1 : 1;
        if (Boolean(a.isTicketMacro) !== Boolean(b.isTicketMacro)) return a.isTicketMacro ? 1 : -1;
        return String(a.id).localeCompare(String(b.id));
      })[0] || null;
  }

  function coverage(queryOriginal, topic) {
    if (!queryOriginal.length) return 0;
    const hay = [topic.titlePhraseNorm, topic.pathPhraseNorm, topic.bodyPhraseNorm].join(" ");
    return queryOriginal.filter((token) => containsNormalized(hay, token)).length / queryOriginal.length;
  }

  function categoryPenalty(queryGroups, topic, primaryTopicIds, wantsUnban) {
    const id = String(topic.id || "").toLowerCase();
    const text = topic.allPhraseText || topic.allText || "";
    let penalty = 0;
    const topicHasAny = (groups) => groups.some((group) => (topic.tags || []).includes(group) || groupTerms(group).some((term) => containsNormalized(text, term)));
    if (queryGroups.includes("password") && !topicHasAny(["password","login","phone","sms","binding"])) penalty += 18;
    if (queryGroups.includes("recharge") && !topicHasAny(["recharge","refund"])) penalty += 16;
    if (queryGroups.includes("withdrawal") && !topicHasAny(["withdrawal"])) penalty += 16;
    if (queryGroups.includes("agency") && !topicHasAny(["agency","host"])) penalty += 10;
    if (queryGroups.includes("ban") && !wantsUnban && /unban|appeal|request-unban|rejected-unban|refund/.test(id) && !primaryTopicIds.includes(id)) penalty += 32;
    if (!queryGroups.includes("unban") && /unban|appeal|request-unban|rejected-unban/.test(id) && !primaryTopicIds.includes(id) && queryGroups.includes("ban")) penalty += 24;
    if (/overview|general|placeholder|alternative|optimized/.test(id) && !primaryTopicIds.includes(id)) penalty += 8;
    return penalty;
  }

  function scoreTopic(topic, queryInfo, options, routes, selectedPaneId) {
    if (!topicAllowedForOutput(topic, options)) {
      return { ...topic, score:0, hits:[], reasons:["excluded-for-output"], coverage:0, primary:false, selected:false };
    }

    let score = 0;
    const hits = [];
    const reasons = [];
    const id = String(topic.id || "");
    const query = queryInfo.raw;
    const words = queryInfo.expanded;
    const original = queryInfo.original;
    const groups = queryInfo.groups;
    const title = topic.titleNorm || "";
    const path = topic.pathNorm || "";
    const body = topic.bodyNorm || "";
    const titlePhrase = topic.titlePhraseNorm || stableNormalize(title);
    const pathPhrase = topic.pathPhraseNorm || stableNormalize(path);
    const bodyPhrase = topic.bodyPhraseNorm || stableNormalize(body);
    const hay = [title, path, body].join(" ");
    const selected = Boolean(selectedPaneId && id === selectedPaneId);
    const exactTitle = (topic.titleAliasesNorm || []).includes(query) || topic.idNorm === query;
    let primary = exactTitle;
    const preferTicket = isTicketMode(options);
    const primaryTopicIds = [];

    routes.forEach((route, index) => {
      const ids = routeTopicIds(route, options);
      ids.forEach((value) => !primaryTopicIds.includes(value) && primaryTopicIds.push(value));
      if (!ids.includes(id)) return;
      const ticketHit = preferTicket && (route.ticketTopicIds || []).includes(id);
      primary = index === 0 || primary;
      const base = index === 0 ? 170 : 90;
      score += ticketHit ? base + 70 : base;
      hits.push(route.name || "route");
      reasons.push("exact-route");
    });

    if (exactTitle) { score += 620; hits.push("exact-title"); reasons.push("exact-title"); }
    if (selected) { score += 220; hits.push("selected-option"); reasons.push("selected"); }
    if (preferTicket && !exactTitle && /optimized/.test(id)) score -= 10;

    if (query && query.length >= 4) {
      if (containsNormalized(titlePhrase, query)) { score += 72; hits.push(query); reasons.push("title-phrase"); }
      else if (containsNormalized(pathPhrase, query)) { score += 42; hits.push(query); reasons.push("path-phrase"); }
      else if (containsNormalized(bodyPhrase, query)) { score += 18; hits.push(query); reasons.push("body-phrase"); }
    }

    groups.forEach((group) => {
      const terms = groupTerms(group);
      const titleHit = terms.some((term) => containsNormalized(titlePhrase, term));
      const pathHit = terms.some((term) => containsNormalized(pathPhrase, term));
      const bodyHit = terms.some((term) => containsNormalized(bodyPhrase, term));
      if (titleHit || pathHit || bodyHit) {
        let add = GROUP_WEIGHTS[group] || 16;
        if (titleHit) add += 12;
        if (pathHit) add += 7;
        if (bodyHit) add += 2;
        score += add;
        hits.push(group);
        reasons.push(`intent-${group}`);
      }
    });

    words.forEach((word) => {
      if (!word || word.length < 2 || STOP.has(word)) return;
      if (containsNormalized(titlePhrase, word)) { score += 16; hits.push(word); }
      else if (title.includes(word)) { score += 10; hits.push(word); }
      if (containsNormalized(pathPhrase, word)) { score += 8; hits.push(word); }
      else if (path.includes(word)) { score += 5; hits.push(word); }
      if (containsNormalized(bodyPhrase, word)) { score += 2.4; hits.push(word); }
      else if (word.length >= 4 && body.includes(word)) { score += 1.1; hits.push(word); }
      if (word.length >= 5) {
        const stem = word.replace(/(ات|ين|ون|ه|ها|هم|ing|ed|s)$/, "");
        if (stem.length >= 4 && hay.includes(stem)) score += 0.8;
      }
    });

    original.forEach((word) => {
      if (containsNormalized(titlePhrase, word)) score += 5;
      else if (containsNormalized(pathPhrase, word)) score += 2.5;
    });

    const cov = coverage(original, topic);
    if (cov >= 0.8) score += 12;
    else if (cov >= 0.55) score += 7;
    else if (original.length >= 3 && cov < 0.34 && !primary && !selected) score -= 10;

    if (preferTicket && score > 0 && id.startsWith("sv-tickets-") && (primary || exactTitle || cov >= 0.45)) score += 8;
    else if (preferTicket && score > 0 && (id.startsWith("sv-clean-") || id.startsWith("sv-refined-"))) score += 3;
    score -= categoryPenalty(groups, topic, primaryTopicIds, groups.includes("unban"));
    score = Math.max(0, score);

    return {
      ...topic,
      score,
      hits: [...new Set(hits)].slice(0, 14),
      reasons: [...new Set(reasons)].slice(0, 10),
      coverage: Math.round(cov * 100) / 100,
      primary,
      selected
    };
  }

  function confidenceFor(ranked, info, selectedPaneId, primaryRoute) {
    const best = ranked[0] || null;
    const second = ranked[1] || null;
    if (!best) return { confidence:"low", label:"Low", score:0, gap:0, ambiguous:false, reason:"no-match" };
    const score = best.score || 0;
    const gap = second ? score - (second.score || 0) : score;
    const routeResolved = Boolean(primaryRoute && best.primary);
    const ambiguous = Boolean(second && gap <= Math.max(10, score * 0.14) && score >= 28 && !selectedPaneId && !routeResolved);
    let confidence = "low";
    if (selectedPaneId || routeResolved) confidence = "high";
    else if (!ambiguous && score >= 70 && best.coverage >= 0.45 && gap >= 12) confidence = "high";
    else if (!ambiguous && score >= 28 && best.coverage >= 0.25) confidence = "medium";
    else if (!ambiguous && score >= 18 && info.groups.length) confidence = "medium";
    return {
      confidence,
      label: confidence === "high" ? "High" : confidence === "medium" ? "Medium" : "Low",
      score: Math.round(score * 10) / 10,
      gap: Math.round(gap * 10) / 10,
      ambiguous,
      reason: ambiguous ? "close-results" : ""
    };
  }

  function smartClip(text, limit) {
    const value = String(text || "");
    if (value.length <= limit) return value;
    let cut = value.slice(0, limit);
    const stop = Math.max(cut.lastIndexOf("\n\n"), cut.lastIndexOf(". "), cut.lastIndexOf("۔"), cut.lastIndexOf("؟"));
    if (stop > limit * 0.72) cut = cut.slice(0, stop + 1);
    else cut = cut.replace(/\s+\S*$/, "");
    return cut + "\n[Content continues in the selected SOP article; answer must not stop mid-sentence. Ask a follow-up or open the SOP if the remaining article is needed.]";
  }

  function precisionMatch(query, maxTopics, maxCharsPerTopic, preferredPaneId, options) {
    const resolvedOptions = options || {};
    const queryInfo = expandQuery(query);
    const exactTitleTopic = findExactTitleTopic(query, resolvedOptions);
    const routes = exactTitleTopic ? [] : detectAccuracyRoutes(query);
    const routeConflict = hasConflictingRoutes(routes);
    const scoringRoutes = routeConflict ? [] : routes;
    const selectedPaneId = String(preferredPaneId || resolvedOptions.preferredPaneId || exactTitleTopic?.id || "").trim();
    const eligibleTopics = buildTopics().filter((topic) => topicAllowedForOutput(topic, resolvedOptions));
    const ranked = eligibleTopics.map((topic) => scoreTopic(topic, queryInfo, resolvedOptions, scoringRoutes, selectedPaneId))
      .filter((topic) => topic.score > 0)
      .sort((a, b) => {
        if (Boolean(a.primary) !== Boolean(b.primary)) return a.primary ? -1 : 1;
        if (Boolean(a.selected) !== Boolean(b.selected)) return a.selected ? -1 : 1;
        return b.score - a.score || (a.title || "").length - (b.title || "").length || String(a.id).localeCompare(String(b.id));
      });

    const conflictRoute = routeConflict
      ? (routes.find((route) => route.name === "account-restriction-general") || routes[0] || null)
      : null;
    const primaryRoute = conflictRoute || (routes.find((route) => routeTopicIds(route, resolvedOptions).some((id) => ranked.some((topic) => topic.id === id))) || null);
    const primaryIds = exactTitleTopic
      ? [exactTitleTopic.id]
      : (!routeConflict && primaryRoute ? routeTopicIds(primaryRoute, resolvedOptions) : []);
    let top = ranked.slice(0, maxTopics);
    if (routeConflict && primaryRoute) {
      const preferred = routeTopicIds(primaryRoute, resolvedOptions).map((id) => ranked.find((topic) => topic.id === id)).filter(Boolean);
      top = [...preferred, ...top.filter((topic) => !preferred.some((candidate) => candidate.id === topic.id))].slice(0, maxTopics);
    }
    if (primaryIds.length) {
      const forced = primaryIds.map((id) => ranked.find((topic) => topic.id === id)).filter(Boolean);
      forced.forEach((topic) => { topic.primary = true; if (!topic.hits.includes("primary-route")) topic.hits.unshift("primary-route"); });
      top = [...forced, ...top.filter((topic) => !forced.some((forcedTopic) => forcedTopic.id === topic.id))].slice(0, maxTopics);
    }
    const confidence = confidenceFor(top, queryInfo, selectedPaneId, primaryRoute);
    top = top.map((topic) => ({ ...topic, confidence: confidence.confidence }));

    return {
      text: "",
      topicIds: top.map((topic) => topic.id),
      topics: top,
      bestTopic: top[0] || null,
      primaryRoute,
      primaryTopicIds: primaryIds,
      exactTitleMatch: Boolean(exactTitleTopic),
      exactTitleTopicId: exactTitleTopic?.id || null,
      confidence: confidence.confidence,
      confidenceLabel: confidence.label,
      confidenceScore: confidence.score,
      confidenceGap: confidence.gap,
      ambiguous: routeConflict || confidence.ambiguous,
      routeConflict,
      detectedRoutes: routes.map((route) => route.name),
      queryIntents: queryInfo.groups,
      outputType: isTicketMode(resolvedOptions) ? "ticket" : "answer",
      hasMeaningfulMatch: top.length > 0 && (confidence.score >= 12 || Boolean(primaryRoute) || Boolean(selectedPaneId))
    };
  }

  function cleanSentence(value) {
    return String(value || "").replace(/\s+/g, " ").replace(/^[\-–—•*\d\s.)]+/, "").replace(/[\s:;،؛.؟?!]+$/, "").trim();
  }

  function splitSentences(text) {
    const raw = String(text || "").replace(/\r/g, "\n").replace(/([.؟?!])\s+/g, "$1\n").replace(/\n{2,}/g, "\n").split(/\n|[؛;]/g);
    const seen = new Set();
    const output = [];
    raw.forEach((part) => {
      const sentence = cleanSentence(part);
      const normalized = normalize(sentence);
      if (normalized.length < 3 || normalized.length > 260) return;
      if (/^(welcome to|thank you for contacting|sugo customer service team|مرحبا بك|مرحباً بك|شكرا لتواصلك|فريق خدمة عملاء)/i.test(sentence)) return;
      if (seen.has(normalized)) return;
      seen.add(normalized);
      output.push({ raw: sentence, norm: normalized });
    });
    return output;
  }

  function sentenceTokens(value) {
    return normalize(value).split(/\s+/).filter((token) => token && token.length > 1 && !SENTENCE_STOP.has(token));
  }

  function ngrams(tokens, min, max) {
    const output = [];
    for (let size = min; size <= max; size += 1) {
      if (tokens.length < size) continue;
      for (let index = 0; index <= tokens.length - size; index += 1) output.push(tokens.slice(index, index + size).join(" "));
    }
    return output;
  }

  function buildSentenceLexicon() {
    if (sentenceLexiconCache) return sentenceLexiconCache;
    const entries = buildTopics().map((topic) => {
      const combined = [topic.id, ...(topic.localizedTitles || [topic.title]), topic.category, topic.section, topic.path, topic.enSearchText, topic.arSearchText].join("\n");
      const sentences = splitSentences(combined);
      const terms = new Set();
      const addTerm = (value) => { const normalized = normalize(value); if (normalized.length >= 3 && normalized.length <= 170) terms.add(normalized); };
      [topic.id.replace(/-/g, " "), ...(topic.localizedTitles || [topic.title]), topic.category, topic.section, topic.path].forEach(addTerm);
      sentences.slice(0, 180).forEach((sentence) => {
        addTerm(sentence.raw);
        ngrams(sentenceTokens(sentence.raw).slice(0, 16), 2, 5).forEach(addTerm);
      });
      ngrams(sentenceTokens([topic.id.replace(/-/g, " "), ...(topic.localizedTitles || [topic.title]), topic.path].join(" ")), 1, 5).forEach(addTerm);
      return {
        ...topic,
        allNorm: normalize(combined),
        allPhraseNorm: stableNormalize(combined),
        sentences,
        terms: [...terms].slice(0, 260),
        termSet: new Set([...terms].slice(0, 260))
      };
    });
    const byId = Object.create(null);
    entries.forEach((entry) => { byId[entry.id] = entry; });
    sentenceLexiconCache = { entries, byId };
    return sentenceLexiconCache;
  }

  function queryAliases(query) {
    const aliases = new Set();
    const value = normalize(query);
    aliases.add(value);
    [
      [/\bوكاله\b/g, "وكالة"], [/\bوكالة\b/g, "وكاله"],
      [/\bانشا\b/g, "انشاء"], [/\bإنشاء\b/g, "انشاء"],
      [/\bفتح\b/g, "انشاء"], [/\bopen\b/g, "create"], [/\bapply\b/g, "create"],
      [/\bمضيفات\b/g, "host"], [/\bمضيفه\b/g, "host"], [/\bمذيعه\b/g, "anchor"],
      [/\bحظر حسابي\b/g, "account ban"], [/\bلا يدخل حسابي\b/g, "account login issue"],
      [/\bما وصل\b/g, "not received"]
    ].forEach(([pattern, replacement]) => aliases.add(value.replace(pattern, replacement)));
    return [...aliases].filter(Boolean);
  }

  function directSentenceRoute(query, options = {}) {
    const value = normalize(query);
    if (!value) return null;
    const ticketMode = isTicketMode(options);
    const choose = (ticketId, articleId, reason) => ({ id: ticketMode ? ticketId : articleId, reason });
    const hasAgency = /(وكاله|وكالة|agency|agent|host|anchor|مضيف|مضيفه|مذيع|مذيعه)/.test(value);
    if (!hasAgency) return null;
    if (/(شحن|recharge|top up|topup|coins|كوين|دفع|payment)/.test(value)) return choose("sv-tickets-agency-create-recharge", "sv-refined-create-recharge-agency", "direct: recharge agency");
    if (/(فرعي|فرعيه|فرعية|sub agency|subagency)/.test(value) && /(تحويل|ترقيه|ترقية|main|اساسي|اساسية)/.test(value)) return choose("sv-tickets-agency-change-sub-to-main", "sv-refined-change-sub-agency-to-main-agency", "direct: sub to main agency");
    if (/(فرعي|فرعيه|فرعية|sub agency|subagency)/.test(value)) return choose("sv-tickets-agency-create-sub", "sv-refined-create-sub-agency", "direct: sub agency");
    if (/(واتساب|whatsapp|جروب|قروب|اداري|ادارة|management group)/.test(value)) return choose("sv-tickets-agency-admin-whatsapp-group", "sv-refined-agency-admin-whatsapp-group-requirements", "direct: agency whatsapp group");
    if (/(نقل|تحويل|تغيير|change|transfer)/.test(value) && /(مضيف|مضيفه|anchor|host|وكاله|وكالة|agency)/.test(value)) return choose("sv-tickets-agency-change-anchor", "sv-refined-change-agency-for-anchor", "direct: change agency anchor");
    if (/(انشاء|انشا|فتح|تقديم|طلب|create|open|apply|new)/.test(value)) return choose("sv-tickets-agency-create", "sv-refined-create-host-agency", "direct: create agency");
    return null;
  }

  function scoreSentenceEntry(entry, query, options = {}) {
    if (!topicAllowedForOutput(entry, options)) return null;
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return null;
    const aliases = queryAliases(query);
    const queryTokens = sentenceTokens(query);
    const queryNgrams = ngrams(queryTokens, 2, Math.min(5, queryTokens.length));
    let score = 0;
    const hits = [];

    aliases.forEach((alias) => {
      if (!alias) return;
      if ((entry.titleAliasesNorm || [entry.titleNorm]).includes(alias) || entry.idNorm === alias) { score += 520; hits.push("exact-title"); }
      else if (containsNormalized(entry.titlePhraseNorm || stableNormalize(entry.titleNorm), alias)) { score += 95; hits.push(alias); }
      if (containsNormalized(entry.pathPhraseNorm || stableNormalize(entry.pathNorm), alias)) { score += 45; hits.push(`path:${alias}`); }
      if (containsNormalized(entry.allPhraseNorm || stableNormalize(entry.allNorm), alias)) { score += 18; hits.push(alias); }
    });

    let tokenHits = 0;
    queryTokens.forEach((token) => {
      if (containsNormalized(entry.titlePhraseNorm || stableNormalize(entry.titleNorm), token)) { score += 14; tokenHits += 1; hits.push(token); }
      else if (containsNormalized(entry.pathPhraseNorm || stableNormalize(entry.pathNorm), token)) { score += 8; tokenHits += 1; hits.push(token); }
      else if (containsNormalized(entry.allPhraseNorm || stableNormalize(entry.allNorm), token)) { score += 1.8; tokenHits += 1; hits.push(token); }
    });
    if (queryTokens.length) {
      const coverageValue = tokenHits / queryTokens.length;
      if (coverageValue >= 1) score += 26;
      else if (coverageValue >= 0.66) score += 14;
      else if (queryTokens.length >= 2 && coverageValue < 0.5) score -= 14;
    }

    entry.terms.forEach((term) => {
      if (!term) return;
      if (term === normalizedQuery) { score += 110; hits.push("sentence-exact"); }
      else if (normalizedQuery.length >= 5 && term.includes(normalizedQuery)) { score += 46; hits.push("sentence-contains-query"); }
      else if (term.length >= 6 && normalizedQuery.includes(term)) { score += 18; hits.push("query-contains-term"); }
    });
    queryNgrams.forEach((gram) => {
      if (entry.termSet.has(gram)) { score += 22; hits.push(gram); }
      else if (containsNormalized(entry.titlePhraseNorm || stableNormalize(entry.titleNorm), gram)) { score += 16; hits.push(gram); }
      else if (containsNormalized(entry.allPhraseNorm || stableNormalize(entry.allNorm), gram)) { score += 4; hits.push(gram); }
    });

    const id = String(entry.id || "").toLowerCase();
    if (/(agency|وكاله|وكالة)/.test(normalizedQuery) && !/(agency|وكاله|وكالة|host|anchor)/.test(`${entry.allNorm} ${id}`)) score -= 30;
    if (isTicketMode(options) && score >= 24 && id.startsWith("sv-tickets-") && !hits.includes("exact-title")) score += 5;
    score = Math.max(0, score);
    return score > 0 ? { id:entry.id, entry, score:Math.round(score * 10) / 10, hits:[...new Set(hits)].slice(0, 12), primary:false } : null;
  }

  function rankSentence(query, limit = 12, options = {}) {
    const lexicon = buildSentenceLexicon();
    const exact = findExactTitleTopic(query, options);
    const direct = exact ? { id: exact.id, reason: "direct: exact title" } : directSentenceRoute(query, options);
    let ranked = lexicon.entries
      .filter((entry) => topicAllowedForOutput(entry, options))
      .map((entry) => scoreSentenceEntry(entry, query, options)).filter(Boolean)
      .sort((a, b) => {
        const scoreGap = b.score - a.score;
        if (scoreGap) return scoreGap;
        if (isTicketMode(options) && a.id.startsWith("sv-tickets-") !== b.id.startsWith("sv-tickets-")) return a.id.startsWith("sv-tickets-") ? -1 : 1;
        return String(a.id).localeCompare(String(b.id));
      });
    if (direct && lexicon.byId[direct.id] && topicAllowedForOutput(lexicon.byId[direct.id], options)) {
      const existing = ranked.find((item) => item.id === direct.id);
      if (existing) { existing.score = Math.max(existing.score, 999); existing.primary = true; existing.hits.unshift(direct.reason); }
      else ranked.unshift({ id:direct.id, entry:lexicon.byId[direct.id], score:999, hits:[direct.reason], primary:true });
      ranked = ranked.filter((item, index, values) => values.findIndex((candidate) => candidate.id === item.id) === index);
    }
    return ranked.slice(0, limit);
  }

  function sentenceTopic(result) {
    const entry = result.entry;
    return {
      id: entry.id,
      title: entry.title,
      label: entry.title || entry.id.replace(/-/g, " "),
      category: entry.category,
      section: entry.section,
      library: entry.library,
      path: entry.path,
      enText: entry.enText,
      arText: entry.arText,
      enSearchText: entry.enSearchText,
      arSearchText: entry.arSearchText,
      localizedTitles: entry.localizedTitles,
      titleAliasesNorm: entry.titleAliasesNorm,
      idNorm: entry.idNorm,
      format: entry.format,
      visible: entry.visible,
      isTicketMacro: entry.isTicketMacro,
      allText: entry.allNorm,
      score: result.score,
      hits: result.hits || [],
      tags: [],
      primary: Boolean(result.primary),
      selected: false,
      confidence: result.primary || result.score >= 70 ? "high" : result.score >= 28 ? "medium" : "low"
    };
  }

  function packetClip(text, limit) {
    const value = String(text || "");
    if (value.length <= limit) return value;
    let cut = value.slice(0, limit);
    const stop = Math.max(cut.lastIndexOf("\n\n"), cut.lastIndexOf(". "), cut.lastIndexOf("؟"), cut.lastIndexOf("!"));
    if (stop > limit * 0.65) cut = cut.slice(0, stop + 1);
    else cut = cut.replace(/\s+\S*$/, "");
    return `${cut} …`;
  }

  function rebuildSentencePacket(result, topics, maxCharsPerTopic) {
    const resolvedLimit = Math.max(Number(maxCharsPerTopic || 0), 2200);
    const audit = topics.slice(0, 8).map((topic, index) => `${index + 1}. ${topic.id} | title: ${topic.title || topic.label || ""} | score: ${Math.round((topic.score || 0) * 10) / 10} | hits: ${(topic.hits || []).slice(0, 8).join(", ") || "sentence-lexicon"}`).join("\n");
    const routeLine = result?.primaryRoute ? `Primary route: ${result.primaryRoute.name}\nPrimary topic IDs: ${(result.primaryTopicIds || []).join(", ")}` : "Primary route: none";
    const searchPolicy = result?.outputType === "ticket"
      ? "Ticket search: hidden ticket macros are eligible only for exact, direct, or strong route matches."
      : "Ask AI search: hidden ticket macros are excluded; visible SOP articles are authoritative.";
    result.text = `${routeLine}\n${searchPolicy}\nMatch audit:\n${audit}\n\n` + topics.map((topic, index) => {
      const priority = topic.primary || index < 3;
      const enLimit = priority ? Math.max(resolvedLimit, 7600) : resolvedLimit;
      const arLimit = priority ? Math.max(Math.floor(resolvedLimit * 0.92), 6800) : Math.floor(resolvedLimit * 0.85);
      return [
        `### Topic: ${topic.id}`,
        `Title: ${topic.title || topic.label || topic.id}`,
        `Path: ${topic.path || ""}`,
        `Match score: ${Math.round((topic.score || 0) * 10) / 10}`,
        topic.primary ? "Primary route match: yes" : "Primary route match: no",
        topic.selected ? "Selected by user: yes" : "Selected by user: no",
        "English SOP:", packetClip(topic.enText || "", enLimit),
        "", "Arabic SOP:", packetClip(topic.arText || "", arLimit)
      ].join("\n");
    }).join("\n\n");
    result.topics = topics;
    result.topicIds = topics.map((topic) => topic.id);
    result.bestTopic = topics[0] || null;
    const bestScore = topics[0] ? Number(topics[0].score || 0) : 0;
    const secondScore = topics[1] ? Number(topics[1].score || 0) : 0;
    const gap = topics[1] ? bestScore - secondScore : bestScore;
    const routeResolved = Boolean(result.primaryRoute && topics[0]?.primary);
    const exactResolved = Boolean(result.exactTitleMatch && topics[0]?.id === result.exactTitleTopicId);
    const finalAmbiguous = Boolean(
      result.routeConflict
      || (topics[1]
      && !routeResolved
      && !exactResolved
      && gap <= Math.max(10, bestScore * 0.14)
      && bestScore >= 28)
    );
    let finalConfidence = "low";
    if (routeResolved || exactResolved || topics[0]?.primary) finalConfidence = "high";
    else if (!finalAmbiguous && bestScore >= 78 && gap >= 14) finalConfidence = "high";
    else if (!finalAmbiguous && bestScore >= 30 && gap >= 8) finalConfidence = "medium";
    result.ambiguous = finalAmbiguous;
    result.confidence = finalConfidence;
    result.confidenceLabel = finalConfidence === "high" ? "High" : finalConfidence === "medium" ? "Medium" : "Low";
    result.confidenceScore = Math.round(bestScore * 10) / 10;
    result.confidenceGap = Math.round(gap * 10) / 10;
    result.hasMeaningfulMatch = Boolean(topics.length && (topics[0]?.primary || bestScore >= 24));
    result.sentenceLexiconEnabled = true;
    return result;
  }

  function match(query, maxTopics = 8, maxCharsPerTopic = 1400, preferredPaneId = null, options = {}) {
    const resolvedOptions = options && typeof options === "object" ? options : {};
    const resolvedMaxTopics = Math.max(Number(maxTopics || 0), resolvedOptions.completeAnswer ? 12 : 8);
    const resolvedChars = Math.max(Number(maxCharsPerTopic || 0), resolvedOptions.completeAnswer ? 3200 : 1800);
    const base = precisionMatch(query, resolvedMaxTopics, resolvedChars, preferredPaneId, resolvedOptions);
    const baseTopics = Array.isArray(base.topics) ? base.topics.filter((topic) => topicAllowedForOutput(topic, resolvedOptions)).slice(0, resolvedMaxTopics) : [];
    const lexRank = rankSentence(query, Math.max(resolvedMaxTopics, 12), resolvedOptions);
    if (!lexRank.length) return rebuildSentencePacket(base, baseTopics, resolvedChars);
    const lexTopics = lexRank.map(sentenceTopic).filter((topic) => topicAllowedForOutput(topic, resolvedOptions));
    const best = lexTopics[0];
    const second = lexTopics[1];
    const lexGap = best ? Number(best.score || 0) - Number(second?.score || 0) : 0;
    const lexStrong = Boolean(best && best.score >= 82 && lexGap >= 14);
    const shouldForce = Boolean(best && (best.primary || !baseTopics.length || (!base.primaryRoute && !base.exactTitleMatch && lexStrong)));
    const exactTitleTopicId = base.exactTitleTopicId || null;
    const merged = (shouldForce
      ? [...lexTopics, ...baseTopics.filter((topic) => !lexTopics.some((lexTopic) => lexTopic.id === topic.id))]
      : [...baseTopics, ...lexTopics.filter((topic) => !baseTopics.some((baseTopic) => baseTopic.id === topic.id))]
    ).filter((topic) => topicAllowedForOutput(topic, resolvedOptions)).map((topic) => {
      const routePrimary = (base.primaryTopicIds || []).includes(topic.id);
      return routePrimary ? { ...topic, primary: true, score: Math.max(Number(topic.score || 0), 900) } : topic;
    }).sort((a, b) => {
      if (exactTitleTopicId && (a.id === exactTitleTopicId || b.id === exactTitleTopicId)) return a.id === exactTitleTopicId ? -1 : 1;
      if (Boolean(a.primary) !== Boolean(b.primary)) return a.primary ? -1 : 1;
      if (base.routeConflict) {
        const aBaseIndex = (base.topicIds || []).indexOf(a.id);
        const bBaseIndex = (base.topicIds || []).indexOf(b.id);
        if (aBaseIndex >= 0 || bBaseIndex >= 0) {
          if (aBaseIndex < 0) return 1;
          if (bBaseIndex < 0) return -1;
          if (aBaseIndex !== bBaseIndex) return aBaseIndex - bBaseIndex;
        }
      }
      const aPrimaryIndex = (base.primaryTopicIds || []).indexOf(a.id);
      const bPrimaryIndex = (base.primaryTopicIds || []).indexOf(b.id);
      if (aPrimaryIndex >= 0 || bPrimaryIndex >= 0) {
        if (aPrimaryIndex < 0) return 1;
        if (bPrimaryIndex < 0) return -1;
        if (aPrimaryIndex !== bPrimaryIndex) return aPrimaryIndex - bPrimaryIndex;
      }
      return Number(b.score || 0) - Number(a.score || 0) || String(a.id).localeCompare(String(b.id));
    }).slice(0, resolvedMaxTopics);
    return rebuildSentencePacket(base, merged, resolvedChars);
  }

  function toRequestMatches(result) {
    return (result?.topics || []).slice(0, 12).map((topic) => ({
      paneId: topic.id,
      title: topic.title || topic.label || topic.id,
      category: topic.category || "",
      section: topic.section || "",
      path: topic.path || "",
      score: Math.round((topic.score || 0) * 10) / 10,
      confidence: topic.confidence || result.confidence || "low",
      hits: (topic.hits || []).slice(0, 12),
      tags: (topic.tags || []).slice(0, 8),
      primary: Boolean(topic.primary),
      selected: Boolean(topic.selected),
      ticketMacro: Boolean(topic.isTicketMacro || String(topic.id || "").startsWith("sv-tickets-"))
    }));
  }

  function invalidate() {
    topicCache = null;
    sentenceLexiconCache = null;
  }

  window.SUGO.KnowledgeBaseMatcher = Object.freeze({
    version: VERSION,
    normalize,
    match,
    toRequestMatches,
    detectAccuracyRoutes,
    findExactTitleTopic,
    invalidate,
    get topicCount() { return buildTopics().length; }
  });
})();
