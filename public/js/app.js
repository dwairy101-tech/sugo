/* ===========================================================================
   SUGO SOP — Final JavaScript Foundation
   =========================================================================== */
(function () {
  'use strict';

  const SUGO = (window.SUGO = window.SUGO || {});

  const CONFIG = Object.freeze({
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'ar'],
    theme: 'dark',
    workerUrl: 'https://sugo.dwairy101.workers.dev',
    aiRequestTimeoutMs: 90000,
    aiCooldownMs: 1000,
    storageKeys: Object.freeze({
      language: 'sugo:sop:language',
      workspace: 'sugo:sop:workspace',
      favorites: 'sugo:sop:favorites',
      recent: 'sugo:sop:recent',
      sidebarMenu: 'sugo:sop:sidebar-menu',
      kbSource: 'sugo:sop:kb-source',
      kbOpenGroups: 'sugo:sop:kb-open-groups',
      kbActivePane: 'sugo:sop:kb-active-pane',
      ticketType: 'sugo:sop:ticket-type',
      ticketDetails: 'sugo:sop:ticket-details',
      ticketAttachments: 'sugo:sop:ticket-attachments',
      lastTicketAiDraft: 'sugo:sop:last-ticket-ai-draft',
      askAiState: 'sugo:sop:ask-ai-state',
      lastAskAiAnswer: 'sugo:sop:last-ask-ai-answer',
      uploadImageState: 'sugo:sop:upload-image-state',
      lastImageAnalysisAnswer: 'sugo:sop:last-image-analysis-answer'
    })
  });

  const DEFAULT_SHORTCUTS = Object.freeze({
    favorites: Object.freeze([
      Object.freeze({ id: 'fav-internet-connectivity', title: 'Internet Connectivity Issues', titleAr: 'مشاكل اتصال الإنترنت', icon: 'star' }),
      Object.freeze({ id: 'fav-sugo-access-guide', title: 'SUGO SOP Access Guide', titleAr: 'دليل الوصول إلى SUGO SOP', icon: 'star' }),
      Object.freeze({ id: 'fav-outlook-config', title: 'Email Configuration – Outlook', titleAr: 'إعداد البريد الإلكتروني – Outlook', icon: 'star' }),
      Object.freeze({ id: 'fav-password-reset', title: 'Password Reset – SUGO SOP', titleAr: 'إعادة تعيين كلمة المرور – SUGO SOP', icon: 'star' })
    ]),
    recent: Object.freeze([
      Object.freeze({ id: 'recent-vpn-access', title: 'VPN Access Request', titleAr: 'طلب وصول VPN', icon: 'document' }),
      Object.freeze({ id: 'recent-application-issue', title: 'Report an Application Issue', titleAr: 'الإبلاغ عن مشكلة في تطبيق', icon: 'document' }),
      Object.freeze({ id: 'recent-printer-access', title: 'Printer Access – Head Office', titleAr: 'وصول الطابعة – المكتب الرئيسي', icon: 'document' }),
      Object.freeze({ id: 'recent-sync-error', title: 'Error: Unable to Sync Data', titleAr: 'خطأ: تعذّر مزامنة البيانات', icon: 'document' }),
      Object.freeze({ id: 'recent-microsoft-365', title: 'Microsoft 365 Activation', titleAr: 'تفعيل Microsoft 365', icon: 'document' })
    ])
  });

  const I18N = Object.freeze({
    en: Object.freeze({
      'header.languageToggle': 'Switch language',
      'header.languageLabel.en': 'AR',
      'header.languageLabel.ar': 'EN',
      'header.breadcrumb': 'Breadcrumb',
      'header.home': 'Home',
      'header.notifications': 'Notifications',
      'header.notificationBadge': '3 notifications',
      'header.userMenu': 'Open user menu',
      'workspace.header.askParent': 'AI',
      'workspace.header.uploadParent': 'Vision',
      'sidebar.searchLabel': 'Search knowledge',
      'sidebar.searchPlaceholder': 'Search knowledge...',
      'sidebar.workspaceActions': 'Workspace actions',
      'sidebar.askAi': 'Ask AI',
      'sidebar.createTicket': 'Create Ticket',
      'sidebar.uploadImage': 'Upload Image',
      'sidebar.knowledgeShortcuts': 'Knowledge shortcuts',
      'sidebar.favorites': 'FAVORITES',
      'sidebar.recent': 'RECENT',
      'sidebar.viewAll': 'View all',
      'sidebar.emptyFavorites': 'No favorites yet',
      'sidebar.emptyRecent': 'No recent items yet',
      'sidebar.removeFavorite': 'Remove favorite',
      'sidebar.removeRecent': 'Remove recent item',
      'sidebar.menuLabel': 'Menu',
      'sidebar.menu': 'MENU',
      'sidebar.knowledgebase': 'Knowledgebase',
      'sidebar.serviceCatalog': 'Service Catalog',
      'sidebar.myTickets': 'My Tickets',
      'sidebar.approvals': 'Approvals',
      'sidebar.announcements': 'Announcements',
      'sidebar.helpSupport': 'Help & Support',
      'placeholder.kicker': 'Awaiting scope',
      'placeholder.statusTitle': 'Implementation status',
      'placeholder.statusBody': 'This screen is a non-functional placeholder. It does not call the worker, create records, approve requests, publish announcements, or load external data.',
      'placeholder.badge.visual': 'Visual shell ready',
      'placeholder.badge.noBackend': 'No backend contract confirmed',
      'placeholder.badge.noData': 'No legacy data source found',
      'placeholder.sideTitle': 'Placeholder Notes',
      'placeholder.sideSubtitle': 'These sidebar routes are visible in the target design but have no confirmed legacy implementation.',
      'placeholder.meta.route': 'Route',
      'placeholder.meta.status': 'Status',
      'placeholder.meta.statusValue': 'Placeholder only',
      'placeholder.meta.worker': 'Worker calls',
      'placeholder.meta.workerValue': 'None',
      'placeholder.meta.next': 'Next required input',
      'placeholder.meta.nextValue': 'Product scope and backend contract',
      'placeholder.sideNote': 'The screen is intentionally read-only so the rebuild does not invent ticket databases, approval workflows, or announcement feeds.',
      'placeholder.card.status': 'Current status',
      'placeholder.card.data': 'Legacy data',
      'placeholder.card.action': 'Available action',
      'placeholder.status.placeholder': 'Placeholder screen only',
      'placeholder.data.none': 'No verified data source in the legacy file',
      'placeholder.action.return': 'Use Ask AI, Create Ticket, Upload Image, or Knowledgebase until scope is approved.',
      'placeholder.serviceCatalog.title': 'Service Catalog',
      'placeholder.serviceCatalog.subtitle': 'No service-catalog workflow or backend endpoint was confirmed in the legacy SUGO portal.',
      'placeholder.serviceCatalog.card1': 'Service request catalog is awaiting approved categories and fulfillment rules.',
      'placeholder.serviceCatalog.card2': 'Only the visible menu item is carried forward from the design reference.',
      'placeholder.myTickets.title': 'My Tickets',
      'placeholder.myTickets.subtitle': 'No ticket database, ticket list endpoint, or status-history contract was confirmed in the legacy frontend.',
      'placeholder.myTickets.card1': 'Saved draft creation remains inside the Create Ticket workspace.',
      'placeholder.myTickets.card2': 'Ticket history is awaiting a confirmed source of truth.',
      'placeholder.approvals.title': 'Approvals',
      'placeholder.approvals.subtitle': 'No approval queue, reviewer roles, or decision API was confirmed in the legacy portal.',
      'placeholder.approvals.card1': 'Approval workflow is intentionally not simulated.',
      'placeholder.approvals.card2': 'This route is ready for future scoped implementation.',
      'placeholder.announcements.title': 'Announcements',
      'placeholder.announcements.subtitle': 'No announcement feed, publishing tool, or content endpoint was confirmed for this route.',
      'placeholder.announcements.card1': 'Broadcast content must come from an approved CMS or Worker contract later.',
      'placeholder.announcements.card2': 'The current screen prevents invented announcements.',
      'placeholder.helpSupport.title': 'Help & Support',
      'placeholder.helpSupport.subtitle': 'No separate help-center workflow beyond Knowledgebase and Ask AI was confirmed in the legacy app.',
      'placeholder.helpSupport.card1': 'Use Knowledgebase articles or Ask AI for confirmed support content.',
      'placeholder.helpSupport.card2': 'Future contact options require approved routing and text.',
      'sidebar.sourceSwitcherLabel': 'Knowledgebase source',
      'sidebar.knowledgebaseUpper': 'KNOWLEDGEBASE',
      'sidebar.sourceMena': 'SUGO Knowledgebase — MENA',
      'sidebar.sourceSv': 'SUGO SV',
      'sidebar.collapseSidebar': 'Collapse sidebar',
      'search.title': 'Search knowledge',
      'search.subtitle': 'Find SOP articles, hidden panes, and saved shortcuts across the SUGO knowledgebase.',
      'search.close': 'Close search',
      'search.placeholder': 'Search by article, SOP keyword, ticket case, or pane ID',
      'search.filtersLabel': 'Search filters',
      'search.filter.all': 'All',
      'search.filter.articles': 'Articles',
      'search.filter.hidden': 'Hidden panes',
      'search.filter.shortcuts': 'Shortcuts',
      'search.ready': 'Type to search the full SUGO knowledgebase.',
      'search.initialTitle': 'Start with a keyword or pane ID',
      'search.initialBody': 'Search ranks visible articles, hidden panes, and saved sidebar shortcuts together.',
      'search.noResults': 'No matching knowledge items were found.',
      'search.count.one': '1 result found.',
      'search.count.many': '{count} results found.',
      'search.group.top': 'Top matches',
      'search.group.articles': 'Knowledgebase articles',
      'search.group.hidden': 'Hidden panes',
      'search.group.shortcuts': 'Saved shortcuts',
      'search.badge.article': 'Article',
      'search.badge.hidden': 'Hidden',
      'search.badge.shortcut': 'Shortcut',
      'search.badge.score': 'Score {score}',
      'search.openArticle': 'Open article',
      'search.openShortcut': 'Open shortcut',
      'search.footerNavigate': 'Navigate',
      'search.footerOpen': 'Open',
      'search.footerClose': 'Close',
      'ticket.typeHeading': 'Select Ticket Type',
      'ticket.type.itSupport.title': 'IT Support',
      'ticket.type.itSupport.description': 'Report an issue or request assistance with IT services.',
      'ticket.type.accessRequest.title': 'Access Request',
      'ticket.type.accessRequest.description': 'Request access to systems, applications or resources.',
      'ticket.type.serviceRequest.title': 'Service Request',
      'ticket.type.serviceRequest.description': 'Request a new service or standard IT item.',
      'ticket.type.information.title': 'Information',
      'ticket.type.information.description': 'General questions or information requests.',
      'ticket.detailsHeading': 'Ticket Details',
      'ticket.subject': 'Subject',
      'ticket.subjectPlaceholder': 'Briefly describe your issue or request',
      'ticket.urgency': 'Urgency',
      'ticket.urgency.high': 'High',
      'ticket.urgency.medium': 'Medium',
      'ticket.urgency.low': 'Low',
      'ticket.category': 'Category',
      'ticket.categoryPlaceholder': 'Select a category',
      'ticket.category.networkConnectivity': 'Network & Connectivity',
      'ticket.category.accountAccess': 'Account & Access',
      'ticket.category.emailCollaboration': 'Email & Collaboration',
      'ticket.category.hardwareDevices': 'Hardware & Devices',
      'ticket.category.softwareApplications': 'Software & Applications',
      'ticket.category.other': 'Other',
      'ticket.affects': 'Affects',
      'ticket.affectsPlaceholder': 'Select who is affected',
      'ticket.affects.meOnly': 'Me only',
      'ticket.affects.myTeam': 'My team',
      'ticket.affects.multipleUsers': 'Multiple users',
      'ticket.affects.entireOffice': 'Entire office',
      'ticket.location': 'Location',
      'ticket.locationPlaceholder': 'Select location',
      'ticket.location.headOfficeRiyadh': 'Head Office – Riyadh',
      'ticket.location.remote': 'Remote',
      'ticket.location.branchOffice': 'Branch Office',
      'ticket.preferredContact': 'Preferred Contact Method',
      'ticket.contact.email': 'Email',
      'ticket.contact.phone': 'Phone',
      'ticket.contact.teams': 'Microsoft Teams',
      'ticket.description': 'Description',
      'ticket.descriptionPlaceholder': 'Provide as much detail as possible to help us understand and resolve your issue faster...',
      'ticket.descriptionHelper': 'Include impact, timing, error messages, and any troubleshooting already tried.',
      'ticket.descriptionToolbar': 'Description formatting',
      'ticket.toolbar.bold': 'Bold',
      'ticket.toolbar.italic': 'Italic',
      'ticket.toolbar.underline': 'Underline',
      'ticket.toolbar.bulletList': 'Bulleted list',
      'ticket.toolbar.numberedList': 'Numbered list',
      'ticket.toolbar.link': 'Insert link',
      'ticket.toolbar.image': 'Insert image reference',
      'ticket.toolbar.code': 'Code',
      'ticket.attachments': 'Attachments',
      'ticket.attachmentsDropText': 'Drag and drop files here or click to browse',
      'ticket.attachmentsHelp': 'Max file size 25MB. Supported: JPG, PNG, PDF, DOCX, XLSX, TXT',
      'ticket.browseFiles': 'Browse Files',
      'ticket.attachmentListLabel': 'Attached files',
      'ticket.attachmentRemove': 'Remove attachment',
      'ticket.attachmentAdded': 'Attachment added.',
      'ticket.attachmentsAdded': 'Attachments added.',
      'ticket.attachmentRemoved': 'Attachment removed.',
      'ticket.attachmentInvalidType': 'Unsupported file type. Supported: JPG, PNG, PDF, DOCX, XLSX, TXT.',
      'ticket.attachmentTooLarge': 'File is larger than 25MB.',
      'ticket.attachmentDuplicate': 'This file is already attached.',
      'ticket.actionsLabel': 'Ticket actions',
      'ticket.requiredFields': 'Required fields',
      'ticket.actionCancel': 'Cancel',
      'ticket.actionCreate': 'Create Ticket',
      'ticket.previewHeading': 'Preview',
      'ticket.previewSubtitle': 'Review your ticket before submission',
      'ticket.previewBadgeDraft': 'DRAFT',
      'ticket.preview.ticketType': 'Ticket Type',
      'ticket.preview.subject': 'Subject',
      'ticket.preview.category': 'Category',
      'ticket.preview.urgency': 'Urgency',
      'ticket.preview.affects': 'Affects',
      'ticket.preview.location': 'Location',
      'ticket.preview.preferredContact': 'Preferred Contact',
      'ticket.preview.description': 'Description',
      'ticket.preview.attachments': 'Attachments',
      'ticket.preview.noAttachments': '0 files attached',
      'ticket.preview.oneAttachment': '1 file attached',
      'ticket.preview.manyAttachments': '{count} files attached',
      'ticket.preview.termsPrefix': 'By submitting this ticket, you agree to our',
      'ticket.preview.termsService': 'Terms of Service',
      'ticket.preview.termsAnd': 'and',
      'ticket.preview.privacyPolicy': 'Privacy Policy',
      'ticket.preview.helpButton': 'Help & Support',
      'ticket.workflow.validationError': 'Please complete the required fields before creating the ticket.',
      'ticket.workflow.ready': 'Ticket form is ready.',
      'ticket.workflow.cancelled': 'Ticket draft cleared.',
      'ticket.workflow.generating': 'Building AI ticket draft from the current form...',
      'ticket.workflow.applied': 'AI ticket draft applied to the form and preview.',
      'ticket.workflow.failed': 'The AI could not generate a ticket. Please try again.',
      'ticket.workflow.timeout': 'Request timed out. Please try again with a shorter description.',
      'ticket.workflow.kbLow': 'No strong SOP match was found; the request was still sent in SOP-only ticket mode.',
      'ask.kicker': 'Dedicated AI Workspace',
      'ask.title': 'Ask AI Console',
      'ask.subtitle': 'Ask SUGO policy, troubleshooting, account, payment, agency, host, game, or escalation questions. This workspace creates an agent answer only.',
      'ask.inputLabel': 'Question / Case details',
      'ask.inputPlaceholder': 'Example: user cannot receive recharge coins, what should the agent check and what should we reply?',
      'ask.hint.agent': 'Agent guidance mode: correct action, policy conditions, missing info, and safe support guidance.',
      'ask.hint.sop_check': 'SOP check mode: verifies the strongest KB match, confidence, and missing details before answering.',
      'ask.hint.troubleshoot': 'Troubleshooting mode: returns ordered actions, evidence needed, and escalation trigger.',
      'ask.hint.escalation': 'Escalation mode: checks whether escalation is needed and what information must be attached.',
      'ask.quickPromptsLabel': 'Ask AI quick prompts',
      'ask.chip.agentAction': 'Agent action',
      'ask.chip.missingInfo': 'Missing info',
      'ask.chip.escalation': 'Escalation',
      'ask.chip.shortReplyDraft': 'Short reply draft',
      'ask.generate': 'Generate AI Answer',
      'ask.clear': 'Clear',
      'ask.answerTitle': 'AI answer',
      'ask.answerSubtitle': 'Rendered answer appears here after the worker response is received.',
      'ask.copy': 'Copy',
      'ask.statusReady': 'Ready for an agent-facing SOP answer.',
      'ask.statusMissing': 'Please enter a question or case details first.',
      'ask.statusGenerating': 'Generating the AI answer from the worker...',
      'ask.statusStreaming': 'Streaming answer from the worker...',
      'ask.statusApplied': 'AI answer generated.',
      'ask.statusCopied': 'Answer copied.',
      'ask.statusFailed': 'The AI could not generate an answer. Please try again.',
      'ask.statusTimeout': 'Request timed out. Please try again with a shorter question.',
      'ask.emptyAnswer': 'Ask a question or paste a customer case to generate an answer.',
      'ask.optionsTitle': 'Ask AI Options',
      'ask.optionsSubtitle': 'Tune language, depth, knowledge scope, and answer focus before sending.',
      'ask.language': 'Language',
      'ask.answerLanguageLabel': 'Answer language',
      'ask.language.english': 'English',
      'ask.language.arabic': 'Arabic',
      'ask.answerDepth': 'Answer depth',
      'ask.answerDepthLabel': 'Answer depth',
      'ask.response.brief': 'Brief',
      'ask.response.detailed': 'Detailed',
      'ask.response.steps': 'Steps',
      'ask.knowledgeMode': 'Knowledge mode',
      'ask.knowledgeModeLabel': 'Knowledge mode',
      'ask.sop.hybrid': 'Hybrid',
      'ask.sop.sopOnly': 'SOP Only',
      'ask.focus': 'Ask AI focus',
      'ask.focusLabel': 'Ask AI focus',
      'ask.focus.agent': 'Agent guidance',
      'ask.focus.sopCheck': 'SOP check + confidence',
      'ask.focus.troubleshoot': 'Troubleshooting steps',
      'ask.focus.escalation': 'Escalation review',
      'ask.optionsNote': 'This is locked to Answer output. Ticket creation and image analysis have their own specialized workspaces.',
      'ask.outputLabel': 'Output',
      'ask.outputAnswer': 'Answer',
      'ask.workerLabel': 'Worker route',
      'ask.workerRoute': 'Base URL POST',
      'ask.streamLabel': 'Stream',
      'ask.streamValue': 'false, SSE parser preserved',
      'upload.kicker': 'Dedicated Vision Workspace',
      'upload.title': 'Upload Image Console',
      'upload.subtitle': 'Upload a screenshot or image, add case context, and generate an image-aware SUGO support answer or vision ticket.',
      'upload.dropLabel': 'Image evidence',
      'upload.dropTitle': 'Drag and drop an image here or click to browse',
      'upload.dropHelp': 'Supported: JPG, PNG, WebP. Max 8MB before compression. Images are compressed to JPEG at max 1600px edge.',
      'upload.browseImage': 'Browse Image',
      'upload.removeImage': 'Remove image',
      'upload.previewAlt': 'Attached image preview',
      'upload.noImage': 'No image attached yet.',
      'upload.contextLabel': 'Case notes / requested check',
      'upload.contextPlaceholder': 'Example: customer shared this screenshot after a failed recharge. Please identify visible issue, missing info, and escalation path.',
      'upload.hint.screenshot_case': 'Screenshot reading mode: visible text, UI state, likely support category, missing info, and safe next action.',
      'upload.hint.ban_moderation': 'Ban / moderation mode: visible evidence only, safe policy wording, and escalation when the screenshot is not conclusive.',
      'upload.hint.payment_evidence': 'Payment evidence mode: extract visible amounts, order IDs, status, dates, and missing details before escalation.',
      'upload.hint.account_identity': 'Account / identity mode: extract visible IDs, profile, agency, host, or ownership clues without assuming identity.',
      'upload.hint.app_error': 'App error mode: identify visible error/crash state and return practical troubleshooting plus escalation trigger.',
      'upload.quickPromptsLabel': 'Upload Image quick prompts',
      'upload.chip.screenshot': 'Read screenshot',
      'upload.chip.payment': 'Payment evidence',
      'upload.chip.appError': 'App error',
      'upload.chip.ticketDraft': 'Vision ticket draft',
      'upload.analyze': 'Analyze Image',
      'upload.clear': 'Clear',
      'upload.answerTitle': 'Image analysis',
      'upload.answerSubtitle': 'Rendered image-aware answer appears here after the worker response is received.',
      'upload.copy': 'Copy',
      'upload.statusReady': 'Upload an image to start vision analysis.',
      'upload.statusMissingImage': 'Please upload an image first.',
      'upload.statusPreparing': 'Preparing image for AI analysis...',
      'upload.statusReadyImage': 'Image is ready. Add notes if needed, then click Analyze Image.',
      'upload.statusGenerating': 'Sending image to the worker for analysis...',
      'upload.statusStreaming': 'Streaming image analysis from the worker...',
      'upload.statusApplied': 'Image analysis generated.',
      'upload.statusCopied': 'Image analysis copied.',
      'upload.statusFailed': 'The AI could not analyze the image. Please try again.',
      'upload.statusTimeout': 'Request timed out. Please try again with shorter notes or a smaller image.',
      'upload.emptyAnswer': 'Upload a screenshot and add case notes to generate an image-aware support answer.',
      'upload.invalidType': 'Supported image types: JPG, PNG, or WebP only.',
      'upload.tooLarge': 'Image is too large. Max 8MB before compression.',
      'upload.dimensionsFailed': 'Image dimensions could not be detected.',
      'upload.openFailed': 'The selected file could not be opened as an image.',
      'upload.readFailed': 'Could not read the selected image.',
      'upload.compressedTooLarge': 'Image is still too large after compression. Please choose a clearer or smaller screenshot.',
      'upload.optionsTitle': 'Image Analysis Options',
      'upload.optionsSubtitle': 'Tune output, language, depth, SOP scope, and image-reading focus before sending.',
      'upload.output': 'Output',
      'upload.outputLabel': 'Output type',
      'upload.output.answer': 'Answer',
      'upload.output.ticket': 'Vision ticket',
      'upload.language': 'Language',
      'upload.answerLanguageLabel': 'Image analysis language',
      'upload.answerDepth': 'Answer depth',
      'upload.answerDepthLabel': 'Image analysis depth',
      'upload.knowledgeMode': 'Knowledge mode',
      'upload.knowledgeModeLabel': 'Image analysis knowledge mode',
      'upload.focus': 'Image focus',
      'upload.focusLabel': 'Image analysis focus',
      'upload.focus.screenshot': 'Screenshot reading',
      'upload.focus.ban': 'Ban / moderation',
      'upload.focus.payment': 'Payment evidence',
      'upload.focus.account': 'Account / identity',
      'upload.focus.appError': 'App error',
      'upload.optionsNote': 'This workspace sends task_type image_analysis with the compressed image payload. Ticket and Ask AI workspaces stay separate.',
      'upload.taskLabel': 'Task',
      'upload.taskValue': 'image_analysis',
      'upload.workspaceLabel': 'Workspace',
      'upload.workspaceValue': 'upload_image',
      'upload.imagePayloadLabel': 'Image fields',
      'upload.imagePayloadValue': 'mimeType, data, name, width, height',
      'kb.kicker': 'Knowledgebase Article',
      'kb.emptyTitle': 'Select an article',
      'kb.emptySubtitle': 'Choose a knowledgebase topic from the left navigation to review its SOP content.',
      'kb.copy': 'Copy Article',
      'kb.statusReady': 'Ready to review SOP content.',
      'kb.statusLoaded': 'Article loaded from the local SOP content store.',
      'kb.statusCopied': 'Article copied.',
      'kb.statusNoBody': 'This pane has a title but no article body was found in the extracted content.',
      'kb.toolsTitle': 'Article Tools',
      'kb.toolsSubtitle': 'Review metadata, copy content, and open related SOP topics.',
      'kb.meta.source': 'Source',
      'kb.meta.category': 'Category',
      'kb.meta.section': 'Section',
      'kb.meta.paneId': 'Pane ID',
      'kb.meta.blocks': 'Field blocks',
      'kb.relatedTitle': 'Related Articles',
      'kb.relatedSubtitle': 'Topics from the same section or closest SOP match.',
      'kb.relatedEmpty': 'No related articles found for this pane.',
      'workspace.header.kbTitle': 'Knowledgebase',
      'workspace.header.kbCrumbParent': 'Knowledgebase',
      'workspace.header.kbCrumb': 'Article',
      'workspace.header.serviceCatalogTitle': 'Service Catalog',
      'workspace.header.myTicketsTitle': 'My Tickets',
      'workspace.header.approvalsTitle': 'Approvals',
      'workspace.header.announcementsTitle': 'Announcements',
      'workspace.header.helpSupportTitle': 'Help & Support',
      'workspace.header.placeholderParent': 'Menu',
      'workspace.header.askTitle': 'Ask AI',
      'workspace.header.askCrumb': 'Ask AI',
      'workspace.header.ticketTitle': 'Create Ticket',
      'workspace.header.ticketCrumbParent': 'Tickets',
      'workspace.header.ticketCrumb': 'Create Ticket',
      'workspace.header.uploadTitle': 'Upload Image',
      'workspace.header.uploadCrumb': 'Upload Image'
    }),
    ar: Object.freeze({
      'header.languageToggle': 'تبديل اللغة',
      'header.languageLabel.en': 'AR',
      'header.languageLabel.ar': 'EN',
      'header.breadcrumb': 'مسار الصفحة',
      'header.home': 'الرئيسية',
      'header.notifications': 'الإشعارات',
      'header.notificationBadge': '3 إشعارات',
      'header.userMenu': 'فتح قائمة المستخدم',
      'workspace.header.askParent': 'الذكاء الاصطناعي',
      'workspace.header.uploadParent': 'الرؤية',
      'sidebar.searchLabel': 'ابحث في المعرفة',
      'sidebar.searchPlaceholder': 'ابحث في المعرفة...',
      'sidebar.workspaceActions': 'إجراءات مساحة العمل',
      'sidebar.askAi': 'اسأل الذكاء الاصطناعي',
      'sidebar.createTicket': 'إنشاء تذكرة',
      'sidebar.uploadImage': 'رفع صورة',
      'sidebar.knowledgeShortcuts': 'اختصارات المعرفة',
      'sidebar.favorites': 'المفضلة',
      'sidebar.recent': 'الأحدث',
      'sidebar.viewAll': 'عرض الكل',
      'sidebar.emptyFavorites': 'لا توجد عناصر مفضلة بعد',
      'sidebar.emptyRecent': 'لا توجد عناصر حديثة بعد',
      'sidebar.removeFavorite': 'إزالة من المفضلة',
      'sidebar.removeRecent': 'إزالة من الأحدث',
      'sidebar.menuLabel': 'القائمة',
      'sidebar.menu': 'القائمة',
      'sidebar.knowledgebase': 'قاعدة المعرفة',
      'sidebar.serviceCatalog': 'كتالوج الخدمات',
      'sidebar.myTickets': 'تذاكري',
      'sidebar.approvals': 'الموافقات',
      'sidebar.announcements': 'الإعلانات',
      'sidebar.helpSupport': 'المساعدة والدعم',
      'placeholder.kicker': 'بانتظار تحديد النطاق',
      'placeholder.statusTitle': 'حالة التنفيذ',
      'placeholder.statusBody': 'هذه الشاشة المؤقتة غير وظيفية. لا تستدعي الـ worker ولا تنشئ سجلات ولا تعتمد طلبات ولا تنشر إعلانات ولا تحمل بيانات خارجية.',
      'placeholder.badge.visual': 'الهيكل البصري جاهز',
      'placeholder.badge.noBackend': 'لا يوجد عقد Backend مؤكد',
      'placeholder.badge.noData': 'لا يوجد مصدر بيانات مؤكد في الملف القديم',
      'placeholder.sideTitle': 'ملاحظات Placeholder',
      'placeholder.sideSubtitle': 'هذه المسارات ظاهرة في التصميم المرجعي لكنها لا تملك تنفيذ Legacy مؤكد.',
      'placeholder.meta.route': 'المسار',
      'placeholder.meta.status': 'الحالة',
      'placeholder.meta.statusValue': 'شاشة مؤقتة فقط',
      'placeholder.meta.worker': 'استدعاءات Worker',
      'placeholder.meta.workerValue': 'لا يوجد',
      'placeholder.meta.next': 'المطلوب لاحقاً',
      'placeholder.meta.nextValue': 'تحديد النطاق وعقد Backend',
      'placeholder.sideNote': 'الشاشة للقراءة فقط عمداً حتى لا يخترع الريبلد قاعدة تذاكر أو سير موافقات أو موجز إعلانات.',
      'placeholder.card.status': 'الحالة الحالية',
      'placeholder.card.data': 'بيانات Legacy',
      'placeholder.card.action': 'الإجراء المتاح',
      'placeholder.status.placeholder': 'شاشة مؤقتة فقط',
      'placeholder.data.none': 'لا يوجد مصدر بيانات موثق داخل الملف القديم',
      'placeholder.action.return': 'استخدم Ask AI أو Create Ticket أو Upload Image أو Knowledgebase إلى أن يتم اعتماد النطاق.',
      'placeholder.serviceCatalog.title': 'كتالوج الخدمات',
      'placeholder.serviceCatalog.subtitle': 'لم يتم تأكيد سير عمل أو endpoint خاص بكتالوج الخدمات داخل بوابة SUGO القديمة.',
      'placeholder.serviceCatalog.card1': 'كتالوج طلبات الخدمات بانتظار التصنيفات وقواعد التنفيذ المعتمدة.',
      'placeholder.serviceCatalog.card2': 'تم نقل عنصر القائمة الظاهر فقط من التصميم المرجعي.',
      'placeholder.myTickets.title': 'تذاكري',
      'placeholder.myTickets.subtitle': 'لم يتم تأكيد قاعدة بيانات تذاكر أو endpoint لقائمة التذاكر أو سجل الحالات في الواجهة القديمة.',
      'placeholder.myTickets.card1': 'إنشاء المسودات يبقى داخل شاشة Create Ticket.',
      'placeholder.myTickets.card2': 'سجل التذاكر بانتظار مصدر بيانات معتمد.',
      'placeholder.approvals.title': 'الموافقات',
      'placeholder.approvals.subtitle': 'لم يتم تأكيد قائمة موافقات أو أدوار مراجعين أو API قرار داخل البوابة القديمة.',
      'placeholder.approvals.card1': 'لم يتم محاكاة سير الموافقات عمداً.',
      'placeholder.approvals.card2': 'المسار جاهز للتنفيذ لاحقاً بعد اعتماد النطاق.',
      'placeholder.announcements.title': 'الإعلانات',
      'placeholder.announcements.subtitle': 'لم يتم تأكيد موجز إعلانات أو أداة نشر أو endpoint محتوى لهذا المسار.',
      'placeholder.announcements.card1': 'محتوى الإعلانات يجب أن يأتي لاحقاً من CMS أو Worker contract معتمد.',
      'placeholder.announcements.card2': 'الشاشة الحالية تمنع اختراع إعلانات غير موجودة.',
      'placeholder.helpSupport.title': 'المساعدة والدعم',
      'placeholder.helpSupport.subtitle': 'لم يتم تأكيد سير Help Center منفصل عن Knowledgebase و Ask AI في التطبيق القديم.',
      'placeholder.helpSupport.card1': 'استخدم مقالات Knowledgebase أو Ask AI للمحتوى المؤكد.',
      'placeholder.helpSupport.card2': 'خيارات التواصل المستقبلية تحتاج Routing ونصوص معتمدة.',
      'sidebar.sourceSwitcherLabel': 'مصدر قاعدة المعرفة',
      'sidebar.knowledgebaseUpper': 'قاعدة المعرفة',
      'sidebar.sourceMena': 'SUGO Knowledgebase — MENA',
      'sidebar.sourceSv': 'SUGO SV',
      'sidebar.collapseSidebar': 'طي الشريط الجانبي',
      'search.title': 'ابحث في المعرفة',
      'search.subtitle': 'اعثر على مقالات SOP والصفحات المخفية والاختصارات المحفوظة داخل قاعدة معرفة SUGO.',
      'search.close': 'إغلاق البحث',
      'search.placeholder': 'ابحث باسم المقال أو كلمة SOP أو حالة التذكرة أو رقم Pane',
      'search.filtersLabel': 'مرشحات البحث',
      'search.filter.all': 'الكل',
      'search.filter.articles': 'المقالات',
      'search.filter.hidden': 'الصفحات المخفية',
      'search.filter.shortcuts': 'الاختصارات',
      'search.ready': 'اكتب للبحث داخل قاعدة معرفة SUGO كاملة.',
      'search.initialTitle': 'ابدأ بكلمة مفتاحية أو رقم Pane',
      'search.initialBody': 'البحث يرتب المقالات الظاهرة والصفحات المخفية واختصارات الشريط الجانبي معاً.',
      'search.noResults': 'لم يتم العثور على عناصر معرفة مطابقة.',
      'search.count.one': 'تم العثور على نتيجة واحدة.',
      'search.count.many': 'تم العثور على {count} نتائج.',
      'search.group.top': 'أفضل النتائج',
      'search.group.articles': 'مقالات قاعدة المعرفة',
      'search.group.hidden': 'الصفحات المخفية',
      'search.group.shortcuts': 'الاختصارات المحفوظة',
      'search.badge.article': 'مقال',
      'search.badge.hidden': 'مخفي',
      'search.badge.shortcut': 'اختصار',
      'search.badge.score': 'الدرجة {score}',
      'search.openArticle': 'فتح المقال',
      'search.openShortcut': 'فتح الاختصار',
      'search.footerNavigate': 'تنقل',
      'search.footerOpen': 'فتح',
      'search.footerClose': 'إغلاق',
      'ticket.typeHeading': 'اختر نوع التذكرة',
      'ticket.type.itSupport.title': 'دعم تقنية المعلومات',
      'ticket.type.itSupport.description': 'الإبلاغ عن مشكلة أو طلب مساعدة في خدمات تقنية المعلومات.',
      'ticket.type.accessRequest.title': 'طلب وصول',
      'ticket.type.accessRequest.description': 'طلب وصول إلى الأنظمة أو التطبيقات أو الموارد.',
      'ticket.type.serviceRequest.title': 'طلب خدمة',
      'ticket.type.serviceRequest.description': 'طلب خدمة جديدة أو عنصر تقنية معلومات قياسي.',
      'ticket.type.information.title': 'معلومات',
      'ticket.type.information.description': 'أسئلة عامة أو طلبات معلومات.',
      'ticket.detailsHeading': 'تفاصيل التذكرة',
      'ticket.subject': 'الموضوع',
      'ticket.subjectPlaceholder': 'اكتب وصفاً مختصراً للمشكلة أو الطلب',
      'ticket.urgency': 'الأولوية',
      'ticket.urgency.high': 'عالية',
      'ticket.urgency.medium': 'متوسطة',
      'ticket.urgency.low': 'منخفضة',
      'ticket.category': 'الفئة',
      'ticket.categoryPlaceholder': 'اختر فئة',
      'ticket.category.networkConnectivity': 'الشبكة والاتصال',
      'ticket.category.accountAccess': 'الحساب والوصول',
      'ticket.category.emailCollaboration': 'البريد والتعاون',
      'ticket.category.hardwareDevices': 'الأجهزة والمعدات',
      'ticket.category.softwareApplications': 'البرامج والتطبيقات',
      'ticket.category.other': 'أخرى',
      'ticket.affects': 'المتأثرون',
      'ticket.affectsPlaceholder': 'اختر من المتأثر',
      'ticket.affects.meOnly': 'أنا فقط',
      'ticket.affects.myTeam': 'فريقي',
      'ticket.affects.multipleUsers': 'عدة مستخدمين',
      'ticket.affects.entireOffice': 'المكتب بالكامل',
      'ticket.location': 'الموقع',
      'ticket.locationPlaceholder': 'اختر الموقع',
      'ticket.location.headOfficeRiyadh': 'المكتب الرئيسي – الرياض',
      'ticket.location.remote': 'عن بُعد',
      'ticket.location.branchOffice': 'فرع',
      'ticket.preferredContact': 'طريقة التواصل المفضلة',
      'ticket.contact.email': 'البريد الإلكتروني',
      'ticket.contact.phone': 'الهاتف',
      'ticket.contact.teams': 'Microsoft Teams',
      'ticket.description': 'الوصف',
      'ticket.descriptionPlaceholder': 'اكتب أكبر قدر ممكن من التفاصيل حتى نتمكن من فهم المشكلة وحلها بشكل أسرع...',
      'ticket.descriptionHelper': 'اذكر التأثير، التوقيت، رسائل الخطأ، وأي خطوات جرّبتها لحل المشكلة.',
      'ticket.descriptionToolbar': 'تنسيق الوصف',
      'ticket.toolbar.bold': 'غامق',
      'ticket.toolbar.italic': 'مائل',
      'ticket.toolbar.underline': 'تحته خط',
      'ticket.toolbar.bulletList': 'قائمة نقطية',
      'ticket.toolbar.numberedList': 'قائمة مرقمة',
      'ticket.toolbar.link': 'إدراج رابط',
      'ticket.toolbar.image': 'إدراج مرجع صورة',
      'ticket.toolbar.code': 'كود',
      'ticket.attachments': 'المرفقات',
      'ticket.attachmentsDropText': 'اسحب الملفات هنا أو اضغط للاستعراض',
      'ticket.attachmentsHelp': 'الحد الأقصى 25MB. المدعوم: JPG, PNG, PDF, DOCX, XLSX, TXT',
      'ticket.browseFiles': 'استعراض الملفات',
      'ticket.attachmentListLabel': 'الملفات المرفقة',
      'ticket.attachmentRemove': 'إزالة المرفق',
      'ticket.attachmentAdded': 'تمت إضافة المرفق.',
      'ticket.attachmentsAdded': 'تمت إضافة المرفقات.',
      'ticket.attachmentRemoved': 'تمت إزالة المرفق.',
      'ticket.attachmentInvalidType': 'نوع الملف غير مدعوم. المدعوم: JPG, PNG, PDF, DOCX, XLSX, TXT.',
      'ticket.attachmentTooLarge': 'حجم الملف أكبر من 25MB.',
      'ticket.attachmentDuplicate': 'هذا الملف مرفق مسبقاً.',
      'ticket.actionsLabel': 'إجراءات التذكرة',
      'ticket.requiredFields': 'حقول مطلوبة',
      'ticket.actionCancel': 'إلغاء',
      'ticket.actionCreate': 'إنشاء تذكرة',
      'ticket.previewHeading': 'المعاينة',
      'ticket.previewSubtitle': 'راجع التذكرة قبل الإرسال',
      'ticket.previewBadgeDraft': 'مسودة',
      'ticket.preview.ticketType': 'نوع التذكرة',
      'ticket.preview.subject': 'الموضوع',
      'ticket.preview.category': 'الفئة',
      'ticket.preview.urgency': 'الأولوية',
      'ticket.preview.affects': 'المتأثرون',
      'ticket.preview.location': 'الموقع',
      'ticket.preview.preferredContact': 'طريقة التواصل',
      'ticket.preview.description': 'الوصف',
      'ticket.preview.attachments': 'المرفقات',
      'ticket.preview.noAttachments': '0 ملفات مرفقة',
      'ticket.preview.oneAttachment': 'ملف واحد مرفق',
      'ticket.preview.manyAttachments': '{count} ملفات مرفقة',
      'ticket.preview.termsPrefix': 'بإرسال هذه التذكرة، فإنك توافق على',
      'ticket.preview.termsService': 'شروط الخدمة',
      'ticket.preview.termsAnd': 'و',
      'ticket.preview.privacyPolicy': 'سياسة الخصوصية',
      'ticket.preview.helpButton': 'المساعدة والدعم',
      'ticket.workflow.validationError': 'يرجى إكمال الحقول المطلوبة قبل إنشاء التذكرة.',
      'ticket.workflow.ready': 'نموذج التذكرة جاهز.',
      'ticket.workflow.cancelled': 'تم مسح مسودة التذكرة.',
      'ticket.workflow.generating': 'جاري بناء مسودة تذكرة بالذكاء الاصطناعي من النموذج الحالي...',
      'ticket.workflow.applied': 'تم تطبيق مسودة الذكاء الاصطناعي على النموذج والمعاينة.',
      'ticket.workflow.failed': 'تعذر على الذكاء الاصطناعي إنشاء تذكرة. يرجى المحاولة مرة أخرى.',
      'ticket.workflow.timeout': 'انتهت مهلة الطلب. يرجى المحاولة بوصف أقصر.',
      'ticket.workflow.kbLow': 'لم يتم العثور على تطابق SOP قوي؛ تم إرسال الطلب مع ذلك في وضع تذكرة SOP-only.',
      'ask.kicker': 'مساحة عمل مخصصة للذكاء الاصطناعي',
      'ask.title': 'وحدة اسأل الذكاء الاصطناعي',
      'ask.subtitle': 'اسأل عن سياسات SUGO أو استكشاف الأخطاء أو الحسابات أو الدفع أو الوكالات أو المضيفين أو الألعاب أو التصعيد. هذه المساحة تنشئ إجابة للموظف فقط.',
      'ask.inputLabel': 'السؤال / تفاصيل الحالة',
      'ask.inputPlaceholder': 'مثال: المستخدم لا يستلم عملات الشحن، ما الذي يجب على الموظف فحصه وماذا نرد؟',
      'ask.hint.agent': 'وضع إرشاد الموظف: الإجراء الصحيح، شروط السياسة، المعلومات الناقصة، وتوجيه دعم آمن.',
      'ask.hint.sop_check': 'وضع فحص SOP: يتحقق من أقوى تطابق، مستوى الثقة، والتفاصيل الناقصة قبل الإجابة.',
      'ask.hint.troubleshoot': 'وضع استكشاف الأخطاء: يعرض إجراءات مرتبة، الأدلة المطلوبة، ومتى يتم التصعيد.',
      'ask.hint.escalation': 'وضع مراجعة التصعيد: يحدد هل التصعيد مطلوب وما المعلومات التي يجب إرفاقها.',
      'ask.quickPromptsLabel': 'مطالبات سريعة لاسأل AI',
      'ask.chip.agentAction': 'إجراء الموظف',
      'ask.chip.missingInfo': 'معلومات ناقصة',
      'ask.chip.escalation': 'تصعيد',
      'ask.chip.shortReplyDraft': 'مسودة رد قصيرة',
      'ask.generate': 'توليد إجابة AI',
      'ask.clear': 'مسح',
      'ask.answerTitle': 'إجابة AI',
      'ask.answerSubtitle': 'تظهر الإجابة المنسقة هنا بعد استلام رد الـ Worker.',
      'ask.copy': 'نسخ',
      'ask.statusReady': 'جاهز لإجابة SOP موجهة للموظف.',
      'ask.statusMissing': 'يرجى إدخال السؤال أو تفاصيل الحالة أولاً.',
      'ask.statusGenerating': 'جاري توليد الإجابة من الـ Worker...',
      'ask.statusStreaming': 'جاري بث الإجابة من الـ Worker...',
      'ask.statusApplied': 'تم توليد إجابة AI.',
      'ask.statusCopied': 'تم نسخ الإجابة.',
      'ask.statusFailed': 'تعذر على AI توليد إجابة. يرجى المحاولة مرة أخرى.',
      'ask.statusTimeout': 'انتهت مهلة الطلب. يرجى المحاولة بسؤال أقصر.',
      'ask.emptyAnswer': 'اكتب سؤالاً أو الصق حالة عميل لتوليد الإجابة.',
      'ask.optionsTitle': 'خيارات اسأل AI',
      'ask.optionsSubtitle': 'اضبط اللغة، العمق، نطاق المعرفة، وتركيز الإجابة قبل الإرسال.',
      'ask.language': 'اللغة',
      'ask.answerLanguageLabel': 'لغة الإجابة',
      'ask.language.english': 'English',
      'ask.language.arabic': 'Arabic',
      'ask.answerDepth': 'عمق الإجابة',
      'ask.answerDepthLabel': 'عمق الإجابة',
      'ask.response.brief': 'مختصر',
      'ask.response.detailed': 'مفصل',
      'ask.response.steps': 'خطوات',
      'ask.knowledgeMode': 'وضع المعرفة',
      'ask.knowledgeModeLabel': 'وضع المعرفة',
      'ask.sop.hybrid': 'Hybrid',
      'ask.sop.sopOnly': 'SOP Only',
      'ask.focus': 'تركيز اسأل AI',
      'ask.focusLabel': 'تركيز اسأل AI',
      'ask.focus.agent': 'إرشاد الموظف',
      'ask.focus.sopCheck': 'فحص SOP + الثقة',
      'ask.focus.troubleshoot': 'خطوات استكشاف الأخطاء',
      'ask.focus.escalation': 'مراجعة التصعيد',
      'ask.optionsNote': 'هذا القسم مقفل على Output من نوع Answer. إنشاء التذاكر وتحليل الصور لهما مساحات عمل مخصصة.',
      'ask.outputLabel': 'المخرج',
      'ask.outputAnswer': 'إجابة',
      'ask.workerLabel': 'مسار الـ Worker',
      'ask.workerRoute': 'POST على الرابط الأساسي',
      'ask.streamLabel': 'البث',
      'ask.streamValue': 'false مع الحفاظ على قارئ SSE',
      'upload.kicker': 'مساحة مخصصة لتحليل الصور',
      'upload.title': 'وحدة رفع الصور',
      'upload.subtitle': 'ارفع لقطة شاشة أو صورة، أضف سياق الحالة، ثم أنشئ إجابة دعم أو تذكرة رؤية مرتبطة بالصورة.',
      'upload.dropLabel': 'دليل الصورة',
      'upload.dropTitle': 'اسحب الصورة هنا أو اضغط للاستعراض',
      'upload.dropHelp': 'المدعوم: JPG, PNG, WebP. الحد 8MB قبل الضغط. يتم ضغط الصور إلى JPEG بأكبر ضلع 1600px.',
      'upload.browseImage': 'استعراض صورة',
      'upload.removeImage': 'إزالة الصورة',
      'upload.previewAlt': 'معاينة الصورة المرفقة',
      'upload.noImage': 'لا توجد صورة مرفقة بعد.',
      'upload.contextLabel': 'ملاحظات الحالة / المطلوب فحصه',
      'upload.contextPlaceholder': 'مثال: العميل أرسل هذه اللقطة بعد فشل الشحن. حدّد المشكلة الظاهرة، المعلومات الناقصة، ومسار التصعيد.',
      'upload.hint.screenshot_case': 'وضع قراءة اللقطة: النص الظاهر، حالة الواجهة، فئة الدعم المحتملة، المعلومات الناقصة، والإجراء الآمن التالي.',
      'upload.hint.ban_moderation': 'وضع الحظر/الإشراف: أدلة مرئية فقط، صياغة سياسة آمنة، وتصعيد عندما لا تكون اللقطة حاسمة.',
      'upload.hint.payment_evidence': 'وضع دليل الدفع: استخراج المبالغ الظاهرة، أرقام الطلبات، الحالة، التواريخ، والمعلومات الناقصة قبل التصعيد.',
      'upload.hint.account_identity': 'وضع الحساب/الهوية: استخراج IDs أو الملف أو الوكالة أو المضيف دون افتراض الملكية.',
      'upload.hint.app_error': 'وضع خطأ التطبيق: تحديد الخطأ أو الانهيار الظاهر وإرجاع خطوات معالجة عملية مع متى يتم التصعيد.',
      'upload.quickPromptsLabel': 'مطالبات سريعة لرفع الصور',
      'upload.chip.screenshot': 'قراءة اللقطة',
      'upload.chip.payment': 'دليل دفع',
      'upload.chip.appError': 'خطأ تطبيق',
      'upload.chip.ticketDraft': 'مسودة تذكرة رؤية',
      'upload.analyze': 'تحليل الصورة',
      'upload.clear': 'مسح',
      'upload.answerTitle': 'تحليل الصورة',
      'upload.answerSubtitle': 'تظهر الإجابة المرتبطة بالصورة هنا بعد استلام رد الـ Worker.',
      'upload.copy': 'نسخ',
      'upload.statusReady': 'ارفع صورة لبدء تحليل الرؤية.',
      'upload.statusMissingImage': 'يرجى رفع صورة أولاً.',
      'upload.statusPreparing': 'جاري تجهيز الصورة لتحليل AI...',
      'upload.statusReadyImage': 'الصورة جاهزة. أضف ملاحظات عند الحاجة، ثم اضغط تحليل الصورة.',
      'upload.statusGenerating': 'جاري إرسال الصورة إلى الـ Worker للتحليل...',
      'upload.statusStreaming': 'جاري بث تحليل الصورة من الـ Worker...',
      'upload.statusApplied': 'تم توليد تحليل الصورة.',
      'upload.statusCopied': 'تم نسخ تحليل الصورة.',
      'upload.statusFailed': 'تعذر على AI تحليل الصورة. يرجى المحاولة مرة أخرى.',
      'upload.statusTimeout': 'انتهت مهلة الطلب. يرجى المحاولة بملاحظات أقصر أو صورة أصغر.',
      'upload.emptyAnswer': 'ارفع لقطة شاشة وأضف ملاحظات الحالة لتوليد إجابة دعم مرتبطة بالصورة.',
      'upload.invalidType': 'أنواع الصور المدعومة: JPG أو PNG أو WebP فقط.',
      'upload.tooLarge': 'الصورة كبيرة جداً. الحد الأقصى 8MB قبل الضغط.',
      'upload.dimensionsFailed': 'تعذر اكتشاف أبعاد الصورة.',
      'upload.openFailed': 'تعذر فتح الملف المحدد كصورة.',
      'upload.readFailed': 'تعذر قراءة الصورة المحددة.',
      'upload.compressedTooLarge': 'الصورة ما زالت كبيرة بعد الضغط. اختر لقطة أوضح أو أصغر.',
      'upload.optionsTitle': 'خيارات تحليل الصورة',
      'upload.optionsSubtitle': 'اضبط المخرج، اللغة، العمق، نطاق SOP، وتركيز قراءة الصورة قبل الإرسال.',
      'upload.output': 'المخرج',
      'upload.outputLabel': 'نوع المخرج',
      'upload.output.answer': 'إجابة',
      'upload.output.ticket': 'تذكرة رؤية',
      'upload.language': 'اللغة',
      'upload.answerLanguageLabel': 'لغة تحليل الصورة',
      'upload.answerDepth': 'عمق الإجابة',
      'upload.answerDepthLabel': 'عمق تحليل الصورة',
      'upload.knowledgeMode': 'وضع المعرفة',
      'upload.knowledgeModeLabel': 'وضع معرفة تحليل الصورة',
      'upload.focus': 'تركيز الصورة',
      'upload.focusLabel': 'تركيز تحليل الصورة',
      'upload.focus.screenshot': 'قراءة لقطة الشاشة',
      'upload.focus.ban': 'حظر / إشراف',
      'upload.focus.payment': 'دليل دفع',
      'upload.focus.account': 'حساب / هوية',
      'upload.focus.appError': 'خطأ تطبيق',
      'upload.optionsNote': 'هذه المساحة ترسل task_type image_analysis مع حمولة الصورة المضغوطة. مساحات التذاكر واسأل AI تبقى منفصلة.',
      'upload.taskLabel': 'المهمة',
      'upload.taskValue': 'image_analysis',
      'upload.workspaceLabel': 'المساحة',
      'upload.workspaceValue': 'upload_image',
      'upload.imagePayloadLabel': 'حقول الصورة',
      'upload.imagePayloadValue': 'mimeType, data, name, width, height',
      'kb.kicker': 'مقال قاعدة المعرفة',
      'kb.emptyTitle': 'اختر مقالاً',
      'kb.emptySubtitle': 'اختر موضوعاً من قاعدة المعرفة في القائمة الجانبية لمراجعة محتوى SOP الخاص به.',
      'kb.copy': 'نسخ المقال',
      'kb.statusReady': 'جاهز لمراجعة محتوى SOP.',
      'kb.statusLoaded': 'تم تحميل المقال من مخزن محتوى SOP المحلي.',
      'kb.statusCopied': 'تم نسخ المقال.',
      'kb.statusNoBody': 'هذه الصفحة لها عنوان لكن لم يتم العثور على نص المقال داخل المحتوى المستخرج.',
      'kb.toolsTitle': 'أدوات المقال',
      'kb.toolsSubtitle': 'راجع البيانات الوصفية، انسخ المحتوى، وافتح مواضيع SOP ذات صلة.',
      'kb.meta.source': 'المصدر',
      'kb.meta.category': 'الفئة',
      'kb.meta.section': 'القسم',
      'kb.meta.paneId': 'معرّف الصفحة',
      'kb.meta.blocks': 'حقول المحتوى',
      'kb.relatedTitle': 'مقالات ذات صلة',
      'kb.relatedSubtitle': 'مواضيع من نفس القسم أو أقرب تطابق SOP.',
      'kb.relatedEmpty': 'لم يتم العثور على مقالات مرتبطة بهذه الصفحة.',
      'workspace.header.kbTitle': 'قاعدة المعرفة',
      'workspace.header.kbCrumbParent': 'قاعدة المعرفة',
      'workspace.header.kbCrumb': 'مقال',
      'workspace.header.serviceCatalogTitle': 'كتالوج الخدمات',
      'workspace.header.myTicketsTitle': 'تذاكري',
      'workspace.header.approvalsTitle': 'الموافقات',
      'workspace.header.announcementsTitle': 'الإعلانات',
      'workspace.header.helpSupportTitle': 'المساعدة والدعم',
      'workspace.header.placeholderParent': 'القائمة',
      'workspace.header.askTitle': 'اسأل AI',
      'workspace.header.askCrumb': 'اسأل AI',
      'workspace.header.ticketTitle': 'إنشاء تذكرة',
      'workspace.header.ticketCrumbParent': 'التذاكر',
      'workspace.header.ticketCrumb': 'إنشاء تذكرة',
      'workspace.header.uploadTitle': 'رفع صورة',
      'workspace.header.uploadCrumb': 'رفع صورة'
    })
  });

  const dom = Object.freeze({
    root: document.documentElement,
    app: document.getElementById('app')
  });

  function safeLocalStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  }

  function safeLocalStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_error) {
      /* Local storage can be disabled; UI state still works for the session. */
    }
  }

  function parseStoredList(key, fallback) {
    const raw = safeLocalStorageGet(key);
    if (!raw) return fallback.map((item) => ({ ...item }));
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return fallback.map((item) => ({ ...item }));
      return parsed.filter((item) => item && typeof item.id === 'string' && typeof item.title === 'string');
    } catch (_error) {
      return fallback.map((item) => ({ ...item }));
    }
  }

  function iconSvg(name) {
    if (name === 'star') {
      return '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="m12 4.5 2.2 4.5 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7L12 4.5Z" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"/></svg>';
    }

    return '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M7.4 4.3h6.3l3.9 3.9v11.5H7.4V4.3Z" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"/><path d="M13.4 4.6v4h4M9.7 12.2h4.6M9.7 15.4h3.5" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function removeIconSvg() {
    return '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const LanguageManager = {
    current: CONFIG.defaultLanguage,

    init() {
      const stored = safeLocalStorageGet(CONFIG.storageKeys.language);
      const language = CONFIG.supportedLanguages.includes(stored) ? stored : CONFIG.defaultLanguage;
      this.apply(language, { persist: false });
      const toggle = document.querySelector('[data-language-toggle]');
      if (toggle && !toggle.dataset.bound) {
        toggle.dataset.bound = 'true';
        toggle.addEventListener('click', () => this.toggle());
      }
    },

    apply(language, options = {}) {
      if (!CONFIG.supportedLanguages.includes(language)) return;

      const direction = language === 'ar' ? 'rtl' : 'ltr';
      this.current = language;
      dom.root.lang = language;
      dom.root.dir = direction;
      dom.root.dataset.language = language;

      this.translate(language);
      this.syncToggle();
      if (typeof WorkspaceState !== 'undefined' && WorkspaceState.current) {
        WorkspaceState.renderHeader(WorkspaceState.current);
      }

      if (options.persist !== false) {
        safeLocalStorageSet(CONFIG.storageKeys.language, language);
      }

      window.dispatchEvent(new CustomEvent('sugo:languagechange', {
        detail: { language, direction }
      }));
    },

    translate(language) {
      const dictionary = I18N[language] || I18N[CONFIG.defaultLanguage];

      document.querySelectorAll('[data-i18n]').forEach((node) => {
        const key = node.getAttribute('data-i18n');
        if (dictionary[key]) node.textContent = dictionary[key];
      });

      document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
        const key = node.getAttribute('data-i18n-placeholder');
        if (dictionary[key]) node.setAttribute('placeholder', dictionary[key]);
      });

      document.querySelectorAll('[data-i18n-aria-label]').forEach((node) => {
        const key = node.getAttribute('data-i18n-aria-label');
        if (dictionary[key]) node.setAttribute('aria-label', dictionary[key]);
      });
    },

    t(key) {
      const dictionary = I18N[this.current] || I18N[CONFIG.defaultLanguage];
      return dictionary[key] || I18N[CONFIG.defaultLanguage][key] || key;
    },

    syncToggle() {
      const toggle = document.querySelector('[data-language-toggle]');
      const label = document.querySelector('[data-language-toggle-label]');
      if (!toggle || !label) return;
      const nextLanguage = this.current === 'ar' ? 'en' : 'ar';
      label.textContent = this.t(`header.languageLabel.${this.current}`);
      toggle.setAttribute('aria-label', this.t('header.languageToggle'));
      toggle.setAttribute('title', this.t('header.languageToggle'));
      toggle.setAttribute('data-next-language', nextLanguage);
    },

    toggle() {
      this.apply(this.current === 'ar' ? 'en' : 'ar');
    }
  };

  const WorkspaceState = {
    current: 'create-ticket',
    valid: ['ask-ai', 'create-ticket', 'upload-image', 'knowledgebase', 'service-catalog', 'my-tickets', 'approvals', 'announcements', 'help-support'],

    init() {
      const stored = safeLocalStorageGet(CONFIG.storageKeys.workspace);
      const domDefault = dom.app && dom.app.dataset.workspace ? dom.app.dataset.workspace : this.current;
      const initial = this.valid.includes(stored) ? stored : domDefault;
      this.set(this.valid.includes(initial) ? initial : this.current, { persist: false });
    },

    set(workspace, options = {}) {
      if (!this.valid.includes(workspace)) workspace = 'create-ticket';
      this.current = workspace;
      if (dom.app) dom.app.dataset.workspace = workspace;

      document.querySelectorAll('[data-workspace-action]').forEach((button) => {
        const isCurrent = button.getAttribute('data-workspace-action') === workspace;
        button.classList.toggle('is-current', isCurrent);
        button.setAttribute('aria-pressed', String(isCurrent));
        if (isCurrent) {
          button.setAttribute('aria-current', 'page');
        } else {
          button.removeAttribute('aria-current');
        }
      });

      this.renderHeader(workspace);
      this.syncWorkspacePanels(workspace);

      if (options.persist !== false) {
        safeLocalStorageSet(CONFIG.storageKeys.workspace, workspace);
      }

      window.dispatchEvent(new CustomEvent('sugo:workspacechange', {
        detail: { workspace }
      }));
    },

    renderHeader(workspace) {
      const title = document.querySelector('.workspace-heading__copy h1');
      const crumbs = Array.from(document.querySelectorAll('.breadcrumb li'));
      const homeCrumb = document.querySelector('[data-breadcrumb-home]');
      if (homeCrumb) homeCrumb.textContent = LanguageManager.t('header.home');
      if (!title || crumbs.length < 5) return;
      if (workspace === 'ask-ai') {
        title.textContent = LanguageManager.t('workspace.header.askTitle');
        crumbs[2].querySelector('a').textContent = LanguageManager.t('workspace.header.askParent');
        crumbs[4].textContent = LanguageManager.t('workspace.header.askCrumb');
      } else if (workspace === 'upload-image') {
        title.textContent = LanguageManager.t('workspace.header.uploadTitle');
        crumbs[2].querySelector('a').textContent = LanguageManager.t('workspace.header.uploadParent');
        crumbs[4].textContent = LanguageManager.t('workspace.header.uploadCrumb');
      } else if (workspace === 'knowledgebase') {
        title.textContent = LanguageManager.t('workspace.header.kbTitle');
        crumbs[2].querySelector('a').textContent = LanguageManager.t('workspace.header.kbCrumbParent');
        crumbs[4].textContent = LanguageManager.t('workspace.header.kbCrumb');
      } else if (PlaceholderScreens && PlaceholderScreens.isPlaceholderRoute(workspace)) {
        const screen = PlaceholderScreens.getScreen(workspace);
        title.textContent = screen ? screen.title() : LanguageManager.t('workspace.header.placeholderParent');
        crumbs[2].querySelector('a').textContent = LanguageManager.t('workspace.header.placeholderParent');
        crumbs[4].textContent = screen ? screen.title() : LanguageManager.t('workspace.header.placeholderParent');
      } else {
        title.textContent = LanguageManager.t('workspace.header.ticketTitle');
        crumbs[2].querySelector('a').textContent = LanguageManager.t('workspace.header.ticketCrumbParent');
        crumbs[4].textContent = LanguageManager.t('workspace.header.ticketCrumb');
      }
    },

    syncWorkspacePanels(workspace) {
      const visibility = [
        ['.ask-ai-workspace', workspace === 'ask-ai'],
        ['.ask-ai-options-panel', workspace === 'ask-ai'],
        ['.upload-image-workspace', workspace === 'upload-image'],
        ['.upload-image-options-panel', workspace === 'upload-image'],
        ['.kb-article-workspace', workspace === 'knowledgebase'],
        ['.kb-article-side-panel', workspace === 'knowledgebase'],
        ['.placeholder-workspace', PlaceholderScreens && PlaceholderScreens.isPlaceholderRoute(workspace)],
        ['.placeholder-side-panel', PlaceholderScreens && PlaceholderScreens.isPlaceholderRoute(workspace)],
        ['.ticket-workspace', workspace === 'create-ticket'],
        ['[data-ticket-preview]', workspace === 'create-ticket']
      ];
      visibility.forEach(([selector, shouldShow]) => {
        document.querySelectorAll(selector).forEach((node) => {
          node.hidden = !shouldShow;
        });
      });
    }
  };

  const FavoritesRecent = {
    state: {
      favorites: [],
      recent: [],
      expanded: {
        favorites: false,
        recent: false
      },
      activeId: ''
    },

    init() {
      this.state.favorites = parseStoredList(CONFIG.storageKeys.favorites, DEFAULT_SHORTCUTS.favorites);
      this.state.recent = parseStoredList(CONFIG.storageKeys.recent, DEFAULT_SHORTCUTS.recent);
      this.renderAll();

      document.addEventListener('click', (event) => {
        const removeButton = event.target.closest('[data-remove-shortcut]');
        if (removeButton) {
          event.preventDefault();
          this.remove(removeButton.getAttribute('data-list-type'), removeButton.getAttribute('data-remove-shortcut'));
          return;
        }

        const itemButton = event.target.closest('[data-sidebar-shortcut]');
        if (itemButton) {
          event.preventDefault();
          this.activate(itemButton.getAttribute('data-sidebar-shortcut'));
          return;
        }

        const viewAllButton = event.target.closest('[data-view-all]');
        if (viewAllButton) {
          event.preventDefault();
          const type = viewAllButton.getAttribute('data-view-all');
          this.toggleExpanded(type);
        }
      });

      window.addEventListener('sugo:languagechange', () => this.renderAll());
    },

    persist(type) {
      const key = type === 'favorites' ? CONFIG.storageKeys.favorites : CONFIG.storageKeys.recent;
      safeLocalStorageSet(key, JSON.stringify(this.state[type] || []));
    },

    getTitle(item) {
      return LanguageManager.current === 'ar' && item.titleAr ? item.titleAr : item.title;
    },

    renderAll() {
      this.renderList('favorites');
      this.renderList('recent');
    },

    renderList(type) {
      const list = document.querySelector(`[data-list="${type}"]`);
      const empty = document.querySelector(`[data-empty="${type}"]`);
      const section = document.querySelector(`[data-collection="${type}"]`);
      const viewAll = document.querySelector(`[data-view-all="${type}"]`);
      const items = this.state[type] || [];
      const visibleItems = this.state.expanded[type] ? items : items.slice(0, type === 'recent' ? 5 : 4);
      const removeLabel = type === 'favorites' ? LanguageManager.t('sidebar.removeFavorite') : LanguageManager.t('sidebar.removeRecent');

      if (!list) return;

      list.innerHTML = visibleItems.map((item) => {
        const title = escapeHtml(this.getTitle(item));
        const id = escapeHtml(item.id);
        return `<li class="sidebar-item-row" data-shortcut-row="${id}">
          <button class="sidebar-item-button${this.state.activeId === item.id ? ' is-active' : ''}" type="button" data-sidebar-shortcut="${id}" title="${title}">
            <span class="sidebar-item-icon">${iconSvg(item.icon)}</span>
            <span class="sidebar-item-title">${title}</span>
          </button>
          <button class="sidebar-item-remove" type="button" data-list-type="${type}" data-remove-shortcut="${id}" aria-label="${escapeHtml(removeLabel)}">
            ${removeIconSvg()}
          </button>
        </li>`;
      }).join('');

      if (empty) empty.hidden = items.length > 0;
      if (section) section.classList.toggle('is-empty', items.length === 0);
      if (viewAll) {
        viewAll.disabled = items.length === 0;
        viewAll.setAttribute('aria-expanded', String(this.state.expanded[type]));
      }
    },

    activate(id) {
      this.state.activeId = id;
      this.renderAll();
      window.dispatchEvent(new CustomEvent('sugo:shortcutselect', { detail: { id } }));
    },

    remove(type, id) {
      if (!['favorites', 'recent'].includes(type)) return;
      this.state[type] = this.state[type].filter((item) => item.id !== id);
      if (this.state.activeId === id) this.state.activeId = '';
      this.persist(type);
      this.renderList(type);
    },

    clear(type) {
      if (!['favorites', 'recent'].includes(type)) return;
      this.state[type] = [];
      this.persist(type);
      this.renderList(type);
    },

    toggleExpanded(type) {
      if (!['favorites', 'recent'].includes(type)) return;
      this.state.expanded[type] = !this.state.expanded[type];
      this.renderList(type);
    }
  };

  const SidebarTopControls = {
    init() {
      document.addEventListener('click', (event) => {
        const actionButton = event.target.closest('[data-workspace-action]');
        if (!actionButton) return;
        event.preventDefault();
        WorkspaceState.set(actionButton.getAttribute('data-workspace-action'));
      });

      document.addEventListener('keydown', (event) => {
        const isCommandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
        if (!isCommandK) return;
        event.preventDefault();
        if (SUGO.globalSearch && typeof SUGO.globalSearch.open === 'function') {
          SUGO.globalSearch.open();
          return;
        }
        const searchInput = document.getElementById('globalKnowledgeSearch');
        if (searchInput) searchInput.focus();
      });
    }
  };




  const KnowledgeTree = {
    data: null,
    activeSource: 'mena',
    activePane: '',
    openGroups: new Set(),

    init() {
      this.data = window.SUGO_KB_DATA || { roots: [], hiddenPanes: [], lookup: [], stats: {} };
      this.activeSource = SidebarNavigation.state.activeSource || safeLocalStorageGet(CONFIG.storageKeys.kbSource) || 'mena';
      this.activePane = safeLocalStorageGet(CONFIG.storageKeys.kbActivePane) || '';
      this.openGroups = this.readOpenGroups();
      this.ensureInitialOpenState();
      this.render();

      document.addEventListener('click', (event) => {
        const toggle = event.target.closest('[data-kb-toggle]');
        if (toggle) {
          event.preventDefault();
          this.toggleGroup(toggle.getAttribute('data-kb-toggle'));
          return;
        }

        const topic = event.target.closest('[data-kb-pane]');
        if (topic) {
          event.preventDefault();
          this.selectPane(topic.getAttribute('data-kb-pane'));
        }
      });

      window.addEventListener('sugo:kbsourcechange', (event) => {
        this.activeSource = event.detail.source;
        this.ensureInitialOpenState();
        this.render();
      });

      window.addEventListener('sugo:languagechange', () => this.render());
    },

    getRoot(source = this.activeSource) {
      return (this.data.roots || []).find((root) => root.key === source) || (this.data.roots || [])[0] || null;
    },

    groupKey(type, id) {
      return `${this.activeSource}:${type}:${id}`;
    },

    readOpenGroups() {
      const raw = safeLocalStorageGet(CONFIG.storageKeys.kbOpenGroups);
      if (!raw) return new Set();
      try {
        const parsed = JSON.parse(raw);
        return new Set(Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []);
      } catch (_error) {
        return new Set();
      }
    },

    persistOpenGroups() {
      safeLocalStorageSet(CONFIG.storageKeys.kbOpenGroups, JSON.stringify(Array.from(this.openGroups)));
    },

    ensureInitialOpenState() {
      const root = this.getRoot();
      if (!root || !root.categories || !root.categories.length) return;
      const firstCategory = root.categories[0];
      this.openGroups.add(this.groupKey('category', firstCategory.id));
      if (firstCategory.sections && firstCategory.sections[0]) {
        this.openGroups.add(this.groupKey('section', firstCategory.sections[0].id));
      }
    },

    isOpen(type, id) {
      return this.openGroups.has(this.groupKey(type, id));
    },

    toggleGroup(key) {
      if (!key) return;
      if (this.openGroups.has(key)) {
        this.openGroups.delete(key);
      } else {
        this.openGroups.add(key);
      }
      this.persistOpenGroups();
      this.render();
    },

    selectPane(paneId) {
      if (!paneId) return;
      this.activePane = paneId;
      safeLocalStorageSet(CONFIG.storageKeys.kbActivePane, paneId);
      this.render();
      if (SUGO.sidebarNavigation) {
        SUGO.sidebarNavigation.setMenu('knowledgebase', { persist: true, silent: true });
      }
      WorkspaceState.set('knowledgebase');
      window.dispatchEvent(new CustomEvent('sugo:kbpaneselect', {
        detail: { paneId, source: this.activeSource }
      }));
    },

    render() {
      const root = this.getRoot();
      const titleNode = document.querySelector('[data-kb-root-title]');
      const treeNode = document.querySelector('[data-kb-tree]');
      if (!treeNode) return;

      if (!root) {
        if (titleNode) titleNode.textContent = '';
        treeNode.innerHTML = '';
        return;
      }

      if (titleNode) titleNode.textContent = root.title;
      treeNode.innerHTML = (root.categories || []).map((category) => this.renderCategory(category)).join('');
    },

    renderCategory(category) {
      const key = this.groupKey('category', category.id);
      const isOpen = this.openGroups.has(key);
      const sections = (category.sections || []).map((section) => this.renderSection(section)).join('');
      return `<div class="kb-tree-category${isOpen ? ' is-open' : ''}">
        <button class="kb-tree-toggle" type="button" data-kb-toggle="${escapeHtml(key)}" aria-expanded="${String(isOpen)}" title="${escapeHtml(category.title)}">
          <span class="kb-tree-toggle__chevron" aria-hidden="true">${this.chevronSvg()}</span>
          <span class="kb-tree-toggle__label">${escapeHtml(category.title)}</span>
        </button>
        <div class="kb-tree-category__children">${sections}</div>
      </div>`;
    },

    renderSection(section) {
      const key = this.groupKey('section', section.id);
      const isOpen = this.openGroups.has(key);
      const topics = (section.articles || []).map((article) => this.renderTopic(article)).join('');
      return `<div class="kb-tree-section${isOpen ? ' is-open' : ''}">
        <button class="kb-tree-toggle" type="button" data-kb-toggle="${escapeHtml(key)}" aria-expanded="${String(isOpen)}" title="${escapeHtml(section.title)}">
          <span class="kb-tree-toggle__chevron" aria-hidden="true">${this.chevronSvg()}</span>
          <span class="kb-tree-toggle__label">${escapeHtml(section.title)}</span>
        </button>
        <div class="kb-tree-section__children">${topics}</div>
      </div>`;
    },

    renderTopic(article) {
      const isActive = this.activePane === article.id;
      return `<button class="kb-tree-topic${isActive ? ' is-active' : ''}" type="button" data-kb-pane="${escapeHtml(article.id)}" title="${escapeHtml(article.title)}">
        <span class="kb-tree-topic__label">${escapeHtml(article.title)}</span>
      </button>`;
    },

    chevronSvg() {
      return '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
  };


  const SidebarNavigation = {
    state: {
      activeMenu: 'knowledgebase',
      activeSource: 'mena'
    },

    init() {
      const storedMenu = safeLocalStorageGet(CONFIG.storageKeys.sidebarMenu);
      const storedSource = safeLocalStorageGet(CONFIG.storageKeys.kbSource);
      this.setMenu(storedMenu || this.state.activeMenu, { persist: false, silent: true });
      this.setSource(storedSource || this.state.activeSource, { persist: false, silent: true });

      document.addEventListener('click', (event) => {
        const menuButton = event.target.closest('[data-sidebar-menu]');
        if (menuButton) {
          event.preventDefault();
          this.setMenu(menuButton.getAttribute('data-sidebar-menu'));
          return;
        }

        const sourceButton = event.target.closest('[data-kb-source]');
        if (sourceButton) {
          event.preventDefault();
          this.setSource(sourceButton.getAttribute('data-kb-source'));
        }
      });
    },

    setMenu(menu, options = {}) {
      const allowed = ['knowledgebase', 'service-catalog', 'my-tickets', 'approvals', 'announcements', 'help-support'];
      const nextMenu = allowed.includes(menu) ? menu : 'knowledgebase';
      this.state.activeMenu = nextMenu;

      document.querySelectorAll('[data-sidebar-menu]').forEach((button) => {
        const isActive = button.getAttribute('data-sidebar-menu') === nextMenu;
        button.classList.toggle('is-active', isActive);
        if (isActive) {
          button.setAttribute('aria-current', 'page');
        } else {
          button.removeAttribute('aria-current');
        }
      });

      if (options.persist !== false) {
        safeLocalStorageSet(CONFIG.storageKeys.sidebarMenu, nextMenu);
      }

      if (!options.silent) {
        window.dispatchEvent(new CustomEvent('sugo:sidebarmenuchange', { detail: { menu: nextMenu } }));
      }
    },

    setSource(source, options = {}) {
      const nextSource = ['mena', 'sv'].includes(source) ? source : 'mena';
      this.state.activeSource = nextSource;

      document.querySelectorAll('[data-kb-source]').forEach((button) => {
        const isActive = button.getAttribute('data-kb-source') === nextSource;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-checked', String(isActive));
      });

      if (options.persist !== false) {
        safeLocalStorageSet(CONFIG.storageKeys.kbSource, nextSource);
      }

      if (!options.silent) {
        window.dispatchEvent(new CustomEvent('sugo:kbsourcechange', { detail: { source: nextSource } }));
      }
    }
  };


  const TicketTypeSelector = {
    allowed: ['it-support', 'access-request', 'service-request', 'information'],
    current: 'it-support',

    init() {
      const stored = safeLocalStorageGet(CONFIG.storageKeys.ticketType);
      this.set(this.allowed.includes(stored) ? stored : this.current, { persist: false, silent: true });

      document.addEventListener('click', (event) => {
        const card = event.target.closest('[data-ticket-type]');
        if (!card) return;
        event.preventDefault();
        this.set(card.getAttribute('data-ticket-type'));
      });
    },

    set(type, options = {}) {
      const nextType = this.allowed.includes(type) ? type : 'it-support';
      this.current = nextType;

      document.querySelectorAll('[data-ticket-type]').forEach((card) => {
        const isSelected = card.getAttribute('data-ticket-type') === nextType;
        card.classList.toggle('is-selected', isSelected);
        card.setAttribute('aria-checked', String(isSelected));
        if (isSelected) {
          card.setAttribute('tabindex', '0');
        } else {
          card.setAttribute('tabindex', '-1');
        }
      });

      if (options.persist !== false) {
        safeLocalStorageSet(CONFIG.storageKeys.ticketType, nextType);
      }

      if (!options.silent) {
        window.dispatchEvent(new CustomEvent('sugo:tickettypechange', {
          detail: { ticketType: nextType }
        }));
      }
    }
  };


  const TicketDetailsForm = {
    defaultState: Object.freeze({
      subject: '',
      urgency: 'high',
      category: '',
      affects: '',
      location: '',
      contact: 'email',
      description: ''
    }),
    state: null,

    init() {
      this.state = this.loadState();
      this.syncControls();
      this.updateUrgencyIndicator();
      this.updateDescriptionCounter();

      document.addEventListener('click', (event) => {
        const toolbarButton = event.target.closest('[data-description-format]');
        if (!toolbarButton) return;
        event.preventDefault();
        this.applyDescriptionFormat(toolbarButton.getAttribute('data-description-format'));
      });

      document.addEventListener('input', (event) => {
        const field = event.target.closest('[data-ticket-field]');
        if (!field) return;
        this.updateField(field.getAttribute('data-ticket-field'), field.value);
      });

      document.addEventListener('change', (event) => {
        const field = event.target.closest('[data-ticket-field]');
        if (!field) return;
        this.updateField(field.getAttribute('data-ticket-field'), field.value);
      });
    },

    loadState() {
      const raw = safeLocalStorageGet(CONFIG.storageKeys.ticketDetails);
      if (!raw) return { ...this.defaultState };
      try {
        const parsed = JSON.parse(raw);
        return { ...this.defaultState, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
      } catch (_error) {
        return { ...this.defaultState };
      }
    },

    syncControls() {
      document.querySelectorAll('[data-ticket-field]').forEach((field) => {
        const name = field.getAttribute('data-ticket-field');
        if (!Object.prototype.hasOwnProperty.call(this.state, name)) return;
        field.value = this.state[name];
      });
    },

    updateField(name, value, options = {}) {
      if (!Object.prototype.hasOwnProperty.call(this.defaultState, name)) return;
      this.state = { ...this.state, [name]: value };
      this.persist();
      if (name === 'urgency') this.updateUrgencyIndicator();
      if (name === 'description') this.updateDescriptionCounter();
      if (!options.silent) {
        window.dispatchEvent(new CustomEvent('sugo:ticketdetailschange', {
          detail: { details: this.getState(), changedField: name }
        }));
      }
    },

    setFields(patch = {}, options = {}) {
      const nextState = { ...this.state };
      Object.keys(patch || {}).forEach((name) => {
        if (!Object.prototype.hasOwnProperty.call(this.defaultState, name)) return;
        nextState[name] = patch[name] == null ? '' : String(patch[name]);
      });
      this.state = nextState;
      this.persist();
      this.syncControls();
      this.updateUrgencyIndicator();
      this.updateDescriptionCounter();
      if (!options.silent) {
        window.dispatchEvent(new CustomEvent('sugo:ticketdetailschange', {
          detail: { details: this.getState(), changedField: 'batch' }
        }));
      }
    },

    persist() {
      safeLocalStorageSet(CONFIG.storageKeys.ticketDetails, JSON.stringify(this.state));
    },

    updateUrgencyIndicator() {
      const indicator = document.querySelector('[data-urgency-indicator]');
      if (!indicator) return;
      indicator.classList.remove('ticket-status-dot--high', 'ticket-status-dot--medium', 'ticket-status-dot--low');
      indicator.classList.add(`ticket-status-dot--${this.state.urgency || 'high'}`);
    },

    updateDescriptionCounter() {
      const counter = document.querySelector('[data-description-counter]');
      if (!counter) return;
      const length = String(this.state.description || '').length;
      counter.textContent = `${length} / 4000`;
      counter.classList.toggle('is-warning', length >= 3600);
    },

    applyDescriptionFormat(format) {
      const textarea = document.getElementById('ticketDescription');
      if (!textarea) return;

      const value = textarea.value || '';
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || start;
      const selected = value.slice(start, end);
      const fallbackText = selected || (LanguageManager.current === 'ar' ? 'النص' : 'text');

      const wrappers = {
        bold: ['**', '**'],
        italic: ['_', '_'],
        underline: ['<u>', '</u>'],
        code: ['`', '`'],
        link: ['[', '](https://)'],
        image: ['![', '](image-reference)']
      };

      let replacement = fallbackText;
      if (format === 'bullet') {
        replacement = selected
          ? selected.split('\n').map((line) => line.trim() ? `• ${line.replace(/^[-•]\s*/, '')}` : line).join('\n')
          : '• ';
      } else if (format === 'numbered') {
        replacement = selected
          ? selected.split('\n').map((line, index) => line.trim() ? `${index + 1}. ${line.replace(/^\d+\.\s*/, '')}` : line).join('\n')
          : '1. ';
      } else if (wrappers[format]) {
        const [before, after] = wrappers[format];
        replacement = `${before}${fallbackText}${after}`;
      }

      textarea.value = `${value.slice(0, start)}${replacement}${value.slice(end)}`;
      textarea.focus();
      const caretStart = start + replacement.length;
      textarea.setSelectionRange(caretStart, caretStart);
      this.updateField('description', textarea.value);
    },

    getState() {
      return { ...this.state };
    },

    validateRequired(options = {}) {
      const required = ['subject', 'urgency', 'category', 'affects', 'description'];
      const missing = required.filter((field) => String(this.state[field] || '').trim().length === 0);
      if (options.mark !== false) this.markInvalid(missing);
      return {
        valid: missing.length === 0,
        missing
      };
    },

    markInvalid(missingFields = []) {
      const missing = new Set(missingFields);
      document.querySelectorAll('[data-ticket-field]').forEach((field) => {
        const name = field.getAttribute('data-ticket-field');
        const invalid = missing.has(name);
        field.classList.toggle('is-invalid', invalid);
        field.setAttribute('aria-invalid', String(invalid));
      });
    },

    reset(options = {}) {
      this.state = { ...this.defaultState };
      this.persist();
      this.syncControls();
      this.updateUrgencyIndicator();
      this.updateDescriptionCounter();
      this.markInvalid([]);
      if (!options.silent) {
        window.dispatchEvent(new CustomEvent('sugo:ticketdetailschange', {
          detail: { details: this.getState(), changedField: 'reset' }
        }));
      }
    }
  };



  const TicketAttachments = {
    maxFileSize: 25 * 1024 * 1024,
    allowedExtensions: new Set(['jpg', 'jpeg', 'png', 'pdf', 'docx', 'xlsx', 'txt']),
    allowedMimeTypes: new Set([
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ]),
    files: [],

    init() {
      this.restoreMetadata();
      this.render();

      const input = document.querySelector('[data-attachment-input]');
      const dropzone = document.querySelector('[data-attachment-dropzone]');

      if (input) {
        input.addEventListener('change', (event) => {
          this.addFiles(Array.from(event.target.files || []));
          input.value = '';
        });
      }

      if (dropzone) {
        ['dragenter', 'dragover'].forEach((eventName) => {
          dropzone.addEventListener(eventName, (event) => {
            event.preventDefault();
            dropzone.classList.add('is-dragover');
          });
        });

        ['dragleave', 'drop'].forEach((eventName) => {
          dropzone.addEventListener(eventName, (event) => {
            event.preventDefault();
            dropzone.classList.remove('is-dragover');
          });
        });

        dropzone.addEventListener('drop', (event) => {
          this.addFiles(Array.from(event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files : []));
        });
      }

      document.addEventListener('click', (event) => {
        const removeButton = event.target.closest('[data-attachment-remove]');
        if (!removeButton) return;
        event.preventDefault();
        this.remove(removeButton.getAttribute('data-attachment-remove'));
      });

      window.addEventListener('sugo:languagechange', () => {
        this.render();
      });
    },

    restoreMetadata() {
      const raw = safeLocalStorageGet(CONFIG.storageKeys.ticketAttachments);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;
        this.files = parsed
          .filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string')
          .map((item) => ({
            id: item.id,
            file: null,
            name: item.name,
            size: Number(item.size) || 0,
            type: item.type || '',
            extension: item.extension || this.extensionFromName(item.name),
            restored: true
          }));
      } catch (_error) {
        this.files = [];
      }
    },

    addFiles(fileList) {
      if (!fileList.length) return;
      let added = 0;

      fileList.forEach((file) => {
        const validationError = this.validateFile(file);
        if (validationError) {
          this.setFeedback(validationError, 'error');
          return;
        }

        if (this.files.some((item) => item.name === file.name && item.size === file.size)) {
          this.setFeedback(LanguageManager.t('ticket.attachmentDuplicate'), 'error');
          return;
        }

        const record = {
          id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type || '',
          extension: this.extensionFromName(file.name),
          restored: false
        };
        this.files.push(record);
        added += 1;
      });

      if (added > 0) {
        this.persistMetadata();
        this.render();
        this.setFeedback(LanguageManager.t(added > 1 ? 'ticket.attachmentsAdded' : 'ticket.attachmentAdded'), 'success');
        this.emitChange();
      }
    },

    validateFile(file) {
      if (!file || typeof file.name !== 'string') return LanguageManager.t('ticket.attachmentInvalidType');
      if (file.size > this.maxFileSize) return LanguageManager.t('ticket.attachmentTooLarge');
      const extension = this.extensionFromName(file.name);
      const hasAllowedExtension = this.allowedExtensions.has(extension);
      const hasAllowedMime = file.type ? this.allowedMimeTypes.has(file.type) : false;
      if (!hasAllowedExtension && !hasAllowedMime) return LanguageManager.t('ticket.attachmentInvalidType');
      return '';
    },

    remove(id) {
      const before = this.files.length;
      this.files = this.files.filter((item) => item.id !== id);
      if (this.files.length === before) return;
      this.persistMetadata();
      this.render();
      this.setFeedback(LanguageManager.t('ticket.attachmentRemoved'), 'success');
      this.emitChange();
    },

    render() {
      const list = document.querySelector('[data-attachment-list]');
      if (!list) return;
      list.innerHTML = this.files.map((item) => this.renderItem(item)).join('');
    },

    renderItem(item) {
      const sizeLabel = this.formatFileSize(item.size);
      const typeLabel = String(item.extension || '').toUpperCase() || 'FILE';
      const restoredSuffix = item.restored ? ` · ${LanguageManager.current === 'ar' ? 'بيانات محفوظة' : 'saved metadata'}` : '';
      return `
        <li class="ticket-attachment-item" data-attachment-id="${escapeHtml(item.id)}">
          <span class="ticket-attachment-fileicon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false"><path d="M7.3 4.3h6.6l3.8 3.8v11.6H7.3V4.3Z" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"/><path d="M13.6 4.6v4h4M10 13.2h4M10 16.2h3" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/></svg>
          </span>
          <span class="ticket-attachment-meta">
            <span class="ticket-attachment-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
            <span class="ticket-attachment-size">${escapeHtml(typeLabel)} · ${escapeHtml(sizeLabel)}${escapeHtml(restoredSuffix)}</span>
          </span>
          <button class="ticket-attachment-remove" type="button" data-attachment-remove="${escapeHtml(item.id)}" aria-label="${escapeHtml(LanguageManager.t('ticket.attachmentRemove'))}">
            ${removeIconSvg()}
          </button>
        </li>`;
    },

    setFeedback(message, tone) {
      const feedback = document.querySelector('[data-attachment-feedback]');
      if (!feedback) return;
      feedback.textContent = message || '';
      feedback.classList.toggle('is-error', tone === 'error');
      feedback.classList.toggle('is-success', tone === 'success');
    },

    persistMetadata() {
      const metadata = this.files.map(({ id, name, size, type, extension, restored }) => ({ id, name, size, type, extension, restored }));
      safeLocalStorageSet(CONFIG.storageKeys.ticketAttachments, JSON.stringify(metadata));
    },

    extensionFromName(name) {
      const parts = String(name || '').split('.');
      return parts.length > 1 ? parts.pop().toLowerCase() : '';
    },

    formatFileSize(size) {
      const bytes = Number(size) || 0;
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
      if (bytes >= 1024) return `${Math.ceil(bytes / 1024)} KB`;
      return `${bytes} B`;
    },

    getState() {
      return this.files.map((item) => ({
        id: item.id,
        file: item.file,
        name: item.name,
        size: item.size,
        type: item.type,
        extension: item.extension,
        restored: item.restored
      }));
    },

    emitChange() {
      window.dispatchEvent(new CustomEvent('sugo:ticketattachmentschange', {
        detail: { attachments: this.getState() }
      }));
    }
  };



  const TicketPreview = {
    init() {
      this.render();
      ['sugo:tickettypechange', 'sugo:ticketdetailschange', 'sugo:ticketattachmentschange', 'sugo:languagechange', 'sugo:smartticketapplied'].forEach((eventName) => {
        window.addEventListener(eventName, () => this.render());
      });

      document.addEventListener('click', (event) => {
        const actionButton = event.target.closest('[data-ticket-action]');
        if (!actionButton) return;
        event.preventDefault();
        window.dispatchEvent(new CustomEvent(`sugo:ticket${actionButton.getAttribute('data-ticket-action')}`, {
          detail: this.collectState()
        }));
      });
    },

    collectState() {
      return {
        ticketType: TicketTypeSelector.current,
        details: TicketDetailsForm.getState(),
        attachments: TicketAttachments.getState()
      };
    },

    render() {
      const details = TicketDetailsForm.getState();
      const attachments = TicketAttachments.getState();

      this.setText('ticketType', this.getTicketTypeLabel(TicketTypeSelector.current));
      this.setText('subject', details.subject || '—');
      this.setText('category', this.getSelectLabel('ticketCategory', details.category) || '—');
      this.setUrgency(details.urgency || 'high');
      this.setText('affects', this.getSelectLabel('ticketAffects', details.affects) || '—');
      this.setText('location', this.getSelectLabel('ticketLocation', details.location) || '—');
      this.setText('contact', this.getSelectLabel('ticketContact', details.contact) || '—');
      this.setText('description', details.description || '—');
      this.renderAttachments(attachments);
    },

    setText(field, value) {
      const node = document.querySelector(`[data-preview-field="${field}"]`);
      if (!node) return;
      node.textContent = value;
      node.classList.toggle('is-empty', value === '—');
    },

    setUrgency(value) {
      const node = document.querySelector('[data-preview-field="urgency"]');
      if (!node) return;
      const key = ['high', 'medium', 'low'].includes(value) ? value : 'high';
      node.innerHTML = `<span class="ticket-status-dot ticket-status-dot--${escapeHtml(key)}" aria-hidden="true"></span><span>${escapeHtml(LanguageManager.t(`ticket.urgency.${key}`))}</span>`;
    },

    getTicketTypeLabel(type) {
      const card = document.querySelector(`[data-ticket-type="${type}"] .ticket-type-card__title`);
      if (card && card.textContent.trim()) return card.textContent.trim();
      return LanguageManager.t('ticket.type.itSupport.title');
    },

    getSelectLabel(selectId, value) {
      const select = document.getElementById(selectId);
      if (!select) return '';
      const option = Array.from(select.options || []).find((item) => item.value === value);
      return option ? option.textContent.trim() : '';
    },

    renderAttachments(attachments) {
      const count = Array.isArray(attachments) ? attachments.length : 0;
      const countNode = document.querySelector('[data-preview-field="attachmentCount"]');
      const list = document.querySelector('[data-preview-attachments]');

      if (countNode) {
        if (count === 0) countNode.textContent = LanguageManager.t('ticket.preview.noAttachments');
        else if (count === 1) countNode.textContent = LanguageManager.t('ticket.preview.oneAttachment');
        else countNode.textContent = LanguageManager.t('ticket.preview.manyAttachments').replace('{count}', String(count));
      }

      if (!list) return;
      list.innerHTML = attachments.map((item) => {
        const typeLabel = String(item.extension || '').toUpperCase() || 'FILE';
        const sizeLabel = TicketAttachments.formatFileSize(item.size);
        return `<li class="ticket-preview-attachment-item">
          <span class="ticket-preview-attachment-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false"><path d="M7.3 4.3h6.6l3.8 3.8v11.6H7.3V4.3Z" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"/><path d="M13.6 4.6v4h4M10 13.2h4M10 16.2h3" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/></svg>
          </span>
          <span class="ticket-preview-attachment-meta">
            <span class="ticket-preview-attachment-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
            <span class="ticket-preview-attachment-size">${escapeHtml(typeLabel)} · ${escapeHtml(sizeLabel)}</span>
          </span>
        </li>`;
      }).join('');
    }
  };


  const SmartTicketBridge = {
    state: {
      lastDraft: null,
      appliedAt: null
    },

    init() {
      window.SUGO_SMART_TICKET_BUILDER_STATE = window.SUGO_SMART_TICKET_BUILDER_STATE || {
        source: 'phase-13-worker-ticket-bridge',
        status: 'waiting-for-ai-ticket-output',
        lastDraft: null,
        appliedAt: null
      };
    },

    applyDraft(draftInput = {}) {
      const draft = this.normalizeDraft(draftInput);

      if (draft.ticketType) {
        TicketTypeSelector.set(draft.ticketType, { silent: true });
      }

      TicketDetailsForm.setFields({
        subject: draft.subject,
        urgency: draft.urgency,
        category: draft.category,
        affects: draft.affects,
        location: draft.location,
        contact: draft.contact,
        description: draft.description
      }, { silent: true });

      this.state.lastDraft = draft;
      this.state.appliedAt = new Date().toISOString();
      window.SUGO_SMART_TICKET_BUILDER_STATE = {
        source: 'phase-13-worker-ticket-bridge',
        status: 'draft-applied-to-create-ticket-state',
        lastDraft: draft,
        appliedAt: this.state.appliedAt
      };

      window.dispatchEvent(new CustomEvent('sugo:smartticketapplied', {
        detail: { draft, state: window.SUGO_SMART_TICKET_BUILDER_STATE }
      }));
    },

    normalizeDraft(input) {
      const source = input && typeof input === 'object' ? input : {};
      const ticketType = this.normalizeEnum(source.ticketType || source.type, TicketTypeSelector.allowed, 'it-support');
      const urgency = this.normalizeEnum(source.urgency || source.priority, ['high', 'medium', 'low'], 'high');
      const category = this.normalizeEnum(source.category, ['network-connectivity', 'account-access', 'email-collaboration', 'hardware-devices', 'software-applications', 'other'], '');
      const affects = this.normalizeEnum(source.affects || source.affectedUsers, ['me-only', 'my-team', 'multiple-users', 'entire-office'], '');
      const location = this.normalizeEnum(source.location, ['head-office-riyadh', 'remote', 'branch-office'], '');
      const contact = this.normalizeEnum(source.contact || source.preferredContact, ['email', 'phone', 'microsoft-teams'], 'email');

      return {
        ticketType,
        subject: source.subject || source.title || '',
        urgency,
        category,
        affects,
        location,
        contact,
        description: source.description || source.body || ''
      };
    },

    normalizeEnum(value, allowedValues, fallback) {
      const normalized = String(value || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
      return allowedValues.includes(normalized) ? normalized : fallback;
    }
  };

  const KnowledgeBaseMatcher = {
    index: null,

    buildIndex() {
      if (this.index) return this.index;
      const data = window.SUGO_KB_DATA || { roots: [], hiddenPanes: [] };
      const content = window.SUGO_KB_CONTENT || {};
      const items = [];
      const pushArticle = (article, rootTitle, categoryTitle, sectionTitle) => {
        if (!article || !article.id) return;
        const pane = content[article.id] || null;
        const fields = this.extractFields(pane);
        const path = Array.isArray(article.path) ? article.path.join(' › ') : [rootTitle, categoryTitle, sectionTitle, article.title].filter(Boolean).join(' › ');
        items.push({
          id: article.id,
          title: article.title || article.id,
          category: categoryTitle || '',
          section: sectionTitle || '',
          path,
          root: rootTitle || '',
          hidden: !!article.hidden,
          fields,
          searchableText: this.normalizeSearchText([article.id, article.title, rootTitle, categoryTitle, sectionTitle, path, ...fields.map((field) => `${field.label} ${field.text}`)].join('\n'))
        });
      };

      (data.roots || []).forEach((root) => {
        (root.categories || []).forEach((category) => {
          (category.sections || []).forEach((section) => {
            (section.articles || []).forEach((article) => pushArticle(article, root.title, category.title, section.title));
          });
        });
      });

      (data.hiddenPanes || []).forEach((article) => {
        if (items.some((item) => item.id === article.id)) return;
        const path = Array.isArray(article.path) ? article.path : [];
        pushArticle(article, path[0] || '', path[1] || '', path[2] || '');
      });

      Object.keys(content).forEach((paneId) => {
        if (items.some((item) => item.id === paneId)) return;
        const pane = content[paneId];
        items.push({
          id: paneId,
          title: pane.enTitle || pane.arTitle || paneId,
          category: '',
          section: '',
          path: pane.enTitle || pane.arTitle || paneId,
          root: '',
          hidden: true,
          fields: this.extractFields(pane),
          searchableText: this.normalizeSearchText([paneId, pane.enTitle, pane.arTitle, ...this.extractFields(pane).map((field) => `${field.label} ${field.text}`)].join('\n'))
        });
      });

      this.index = items;
      return items;
    },

    extractFields(pane) {
      if (!pane || typeof pane !== 'object') return [];
      const fields = [];
      const add = (field, lang) => {
        if (!field || !String(field.text || '').trim()) return;
        fields.push({
          lang,
          label: String(field.label || (lang === 'ar' ? 'النص' : 'Text')).trim(),
          text: String(field.text || '').trim(),
          type: this.fieldType(field.label, field.text)
        });
      };
      (pane.enFields || []).forEach((field) => add(field, 'en'));
      (pane.arFields || []).forEach((field) => add(field, 'ar'));
      return fields;
    },

    fieldType(label, text) {
      const value = String(label || '').toLowerCase();
      const body = String(text || '').toLowerCase();
      if (/ticket|التذكرة|التذكره/.test(value)) return 'ticket';
      if (/answer|الإجابة|الاجابة/.test(value)) return 'answer';
      if (/form|النموذج|reporter\s*:|violator\s+id\s*:|description\s*:/.test(`${value}\n${body}`)) return 'form';
      if (/mention|منشن|escalation|تصعيد|@/.test(`${value}\n${body}`)) return 'escalation';
      return 'text';
    },

    normalizeSearchText(value) {
      return String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/[ة]/g, 'ه')
        .replace(/[ى]/g, 'ي')
        .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    },

    tokenize(query) {
      const stop = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'you', 'your', 'user', 'issue', 'request', 'case', 'please', 'على', 'في', 'من', 'الى', 'إلى', 'عن', 'مع', 'هذه', 'هذا', 'مشكلة', 'طلب']);
      return this.normalizeSearchText(query).split(' ').filter((token) => token.length > 1 && !stop.has(token)).slice(0, 60);
    },

    detectIntents(query) {
      const text = this.normalizeSearchText(query);
      const rules = [
        ['ban_moderation', /(ban|banned|block|blocked|حظر|محظور|مخالفه|اساءه|تبليغ)/],
        ['recharge_payment', /(recharge|payment|pay|visa|coins|charge|شحن|دفع|رصيد|عملات|فيزا)/],
        ['withdrawal_exchange', /(withdraw|withdrawal|exchange|cash|سحب|تحويل|استبدال|صرف)/],
        ['agency_host', /(agency|agent|host|anchor|agm|bcm|وكاله|وكالة|مذيع|مذيعه|مضيفة)/],
        ['account_access', /(account|login|password|phone|bind|binding|حساب|دخول|كلمه|كلمة|هاتف|ربط)/],
        ['task_reward', /(task|reward|activity|mission|مهمه|مهمة|مكافاه|مكافأة|نشاط)/],
        ['app_technical', /(crash|error|bug|network|connect|sync|internet|تطبيق|خطا|خطأ|شبكه|شبكة|انترنت)/]
      ];
      return rules.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
    },

    lookup(query, topN = 12, charBudget = 3200, preferredPane = null, options = {}) {
      const tokens = this.tokenize(query);
      const queryText = this.normalizeSearchText(query);
      const preferTicketTopics = !!(options.preferTicketTopics || options.outputType === 'ticket' || options.smartTicket);
      const intents = this.detectIntents(query);
      const topics = this.buildIndex().map((item) => {
        let score = 0;
        const titleText = this.normalizeSearchText(item.title);
        const pathText = this.normalizeSearchText(item.path);
        const hits = [];

        tokens.forEach((token) => {
          if (titleText.includes(token)) { score += 18; hits.push(token); }
          else if (pathText.includes(token)) { score += 10; hits.push(token); }
          else if (item.searchableText.includes(token)) { score += 4; hits.push(token); }
        });

        if (queryText && titleText && queryText.includes(titleText)) score += 35;
        if (preferredPane && item.id === preferredPane) score += 65;
        if (preferTicketTopics && /(^|-)tickets?-|ticket/i.test(item.id)) score += 16;
        if (preferTicketTopics && item.fields.some((field) => field.type === 'ticket')) score += 12;
        if (intents.includes('ban_moderation') && /ban|abuse|report|moderation|حظر|اساءه/.test(item.searchableText)) score += 16;
        if (intents.includes('recharge_payment') && /recharge|payment|visa|coins|شحن|دفع/.test(item.searchableText)) score += 16;
        if (intents.includes('withdrawal_exchange') && /withdraw|exchange|سحب|تحويل|استبدال/.test(item.searchableText)) score += 16;
        if (intents.includes('agency_host') && /agency|host|anchor|agm|وكاله|مذيع/.test(item.searchableText)) score += 14;
        if (intents.includes('account_access') && /account|login|binding|phone|حساب|دخول|ربط/.test(item.searchableText)) score += 14;

        return {
          ...item,
          score,
          confidence: score >= 75 ? 'high' : score >= 35 ? 'medium' : 'low',
          hits: Array.from(new Set(hits)).slice(0, 12),
          tags: intents.slice(0, 8),
          primary: false,
          selected: preferredPane ? item.id === preferredPane : false
        };
      }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, Math.max(topN, 12));

      if (topics[0]) topics[0].primary = true;
      const best = topics[0] || null;
      const confidenceScore = best ? Math.min(100, Math.round(best.score * 10) / 10) : 0;
      const confidence = confidenceScore >= 75 ? 'high' : confidenceScore >= 35 ? 'medium' : 'low';
      const ambiguous = !!(topics[0] && topics[1] && Math.abs(topics[0].score - topics[1].score) < 8);
      const selectedTopics = topics.slice(0, topN);
      const text = this.buildPromptText(selectedTopics, charBudget, preferTicketTopics);

      return {
        text,
        topics: selectedTopics,
        topicIds: selectedTopics.map((topic) => topic.id),
        bestTopic: best,
        confidence,
        confidenceLabel: confidence.charAt(0).toUpperCase() + confidence.slice(1),
        confidenceScore,
        ambiguous,
        primaryRoute: best ? { id: best.id, name: best.title } : null,
        queryIntents: intents,
        hasMeaningfulMatch: !!best && confidenceScore >= 18 && text.trim().length > 80
      };
    },

    buildPromptText(topics, charBudget, preferTicketTopics) {
      let used = 0;
      const blocks = [];
      topics.forEach((topic, index) => {
        if (used >= charBudget) return;
        const ticketFields = topic.fields.filter((field) => field.type === 'ticket');
        const answerFields = topic.fields.filter((field) => field.type === 'answer');
        const textFields = preferTicketTopics && ticketFields.length ? ticketFields : (answerFields.length ? answerFields : topic.fields);
        const clippedFields = textFields.slice(0, 4).map((field) => {
          const clean = field.text.replace(/\s+/g, ' ').trim();
          return `${field.lang.toUpperCase()} ${field.label}: ${clean.slice(0, 900)}`;
        }).join('\n');
        const block = `#${index + 1} ${topic.title}\nPane: ${topic.id}\nPath: ${topic.path}\nScore: ${Math.round(topic.score * 10) / 10}\n${clippedFields || 'No pane body was available.'}`;
        const remaining = charBudget - used;
        const finalBlock = block.length > remaining ? block.slice(0, remaining) : block;
        blocks.push(finalBlock);
        used += finalBlock.length;
      });
      return blocks.join('\n\n---\n\n');
    }
  };



  const GlobalSearch = {
    isOpen: false,
    filter: 'all',
    query: '',
    results: [],
    flatResults: [],
    activeIndex: 0,
    lastFocus: null,

    init() {
      this.overlay = document.querySelector('[data-search-overlay]');
      this.input = document.querySelector('[data-search-input]');
      this.resultsNode = document.querySelector('[data-search-results]');
      this.summaryNode = document.querySelector('[data-search-summary]');
      if (!this.overlay || !this.input || !this.resultsNode) return;

      document.addEventListener('click', (event) => {
        const close = event.target.closest('[data-search-close]');
        if (close && this.isOpen) {
          event.preventDefault();
          this.close();
          return;
        }

        const filter = event.target.closest('[data-search-filter]');
        if (filter && this.overlay.contains(filter)) {
          event.preventDefault();
          this.setFilter(filter.getAttribute('data-search-filter'));
          return;
        }

        const item = event.target.closest('[data-search-result-id]');
        if (item && this.overlay.contains(item)) {
          event.preventDefault();
          this.openResultById(item.getAttribute('data-search-result-id'));
        }
      });

      this.input.addEventListener('input', () => {
        this.query = this.input.value;
        this.activeIndex = 0;
        this.renderResults();
      });

      this.input.addEventListener('keydown', (event) => this.handleInputKeydown(event));

      const sidebarInput = document.getElementById('globalKnowledgeSearch');
      if (sidebarInput) {
        sidebarInput.addEventListener('focus', (event) => {
          const seed = event.target.value || '';
          this.open(seed);
          sidebarInput.blur();
        });
        sidebarInput.addEventListener('click', (event) => {
          event.preventDefault();
          this.open(sidebarInput.value || '');
        });
        sidebarInput.addEventListener('input', (event) => {
          this.open(event.target.value || '');
          sidebarInput.value = '';
        });
        const form = sidebarInput.closest('form');
        if (form) {
          form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.open(sidebarInput.value || '');
          });
        }
      }

      document.addEventListener('keydown', (event) => {
        if (!this.isOpen) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          this.close();
        }
      });

      window.addEventListener('sugo:languagechange', () => {
        if (this.isOpen) this.renderResults();
      });
    },

    open(seed = '') {
      if (!this.overlay || !this.input) return;
      this.lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.isOpen = true;
      this.overlay.hidden = false;
      this.overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-search-open');
      this.query = String(seed || '').trim();
      this.input.value = this.query;
      this.activeIndex = 0;
      this.renderResults();
      window.setTimeout(() => {
        this.input.focus({ preventScroll: true });
        this.input.select();
      }, 0);
    },

    close() {
      if (!this.overlay) return;
      this.isOpen = false;
      this.overlay.hidden = true;
      this.overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-search-open');
      if (this.lastFocus && typeof this.lastFocus.focus === 'function') {
        this.lastFocus.focus({ preventScroll: true });
      }
    },

    setFilter(filter) {
      const allowed = ['all', 'visible', 'hidden', 'shortcuts'];
      this.filter = allowed.includes(filter) ? filter : 'all';
      document.querySelectorAll('[data-search-filter]').forEach((button) => {
        const active = button.getAttribute('data-search-filter') === this.filter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-checked', String(active));
      });
      this.activeIndex = 0;
      this.renderResults();
      if (this.input) this.input.focus({ preventScroll: true });
    },

    handleInputKeydown(event) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.moveActive(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.moveActive(-1);
      } else if (event.key === 'Enter') {
        const result = this.flatResults[this.activeIndex];
        if (result) {
          event.preventDefault();
          this.openResultById(result.uid);
        }
      }
    },

    moveActive(step) {
      if (!this.flatResults.length) return;
      this.activeIndex = (this.activeIndex + step + this.flatResults.length) % this.flatResults.length;
      this.syncActiveItem();
    },

    syncActiveItem() {
      const nodes = Array.from(this.resultsNode.querySelectorAll('[data-search-result-id]'));
      nodes.forEach((node, index) => {
        const active = index === this.activeIndex;
        node.classList.toggle('is-active', active);
        node.setAttribute('aria-selected', String(active));
        if (active) node.scrollIntoView({ block: 'nearest' });
      });
    },

    searchShortcuts(query) {
      const tokens = KnowledgeBaseMatcher.tokenize(query);
      const rows = [];
      const addList = (type, items) => {
        (items || []).forEach((item) => {
          const title = FavoritesRecent.getTitle(item);
          const haystack = KnowledgeBaseMatcher.normalizeSearchText([item.id, item.title, item.titleAr, type].join(' '));
          let score = 0;
          tokens.forEach((token) => {
            if (haystack.includes(token)) score += 18;
          });
          if (!tokens.length) score = type === 'favorites' ? 6 : 5;
          if (score > 0) {
            rows.push({
              uid: `shortcut:${type}:${item.id}`,
              type: 'shortcut',
              shortcutType: type,
              id: item.id,
              title,
              path: type === 'favorites' ? LanguageManager.t('sidebar.favorites') : LanguageManager.t('sidebar.recent'),
              score,
              hidden: false,
              badge: LanguageManager.t('search.badge.shortcut')
            });
          }
        });
      };
      addList('favorites', FavoritesRecent.state.favorites);
      addList('recent', FavoritesRecent.state.recent);
      return rows.sort((a, b) => b.score - a.score).slice(0, 8);
    },

    searchArticles(query) {
      const topics = KnowledgeBaseMatcher.lookup(query, 60, 1800, null, { outputType: 'answer' }).topics;
      return topics.map((topic) => ({
        uid: `pane:${topic.id}`,
        type: 'pane',
        id: topic.id,
        title: topic.title || topic.id,
        path: topic.path || topic.id,
        score: Math.round(topic.score),
        confidence: topic.confidence,
        hits: topic.hits || [],
        hidden: !!topic.hidden,
        badge: topic.hidden ? LanguageManager.t('search.badge.hidden') : LanguageManager.t('search.badge.article')
      }));
    },

    buildGroups() {
      const query = String(this.query || '').trim();
      if (!query) {
        const shortcuts = this.searchShortcuts('').slice(0, 6);
        this.flatResults = shortcuts;
        return shortcuts.length ? [{ key: 'shortcuts', title: LanguageManager.t('search.group.shortcuts'), items: shortcuts }] : [];
      }

      const articles = this.filter === 'shortcuts' ? [] : this.searchArticles(query);
      const shortcuts = this.filter === 'hidden' || this.filter === 'visible' ? [] : this.searchShortcuts(query);
      const visible = articles.filter((item) => !item.hidden);
      const hidden = articles.filter((item) => item.hidden);
      const combined = [...articles, ...shortcuts].sort((a, b) => b.score - a.score);
      const top = combined.slice(0, 5);

      let groups = [];
      if (this.filter === 'all') {
        if (top.length) groups.push({ key: 'top', title: LanguageManager.t('search.group.top'), items: top });
        if (visible.length) groups.push({ key: 'articles', title: LanguageManager.t('search.group.articles'), items: visible.slice(0, 12) });
        if (hidden.length) groups.push({ key: 'hidden', title: LanguageManager.t('search.group.hidden'), items: hidden.slice(0, 8) });
        if (shortcuts.length) groups.push({ key: 'shortcuts', title: LanguageManager.t('search.group.shortcuts'), items: shortcuts });
      } else if (this.filter === 'visible') {
        if (visible.length) groups.push({ key: 'articles', title: LanguageManager.t('search.group.articles'), items: visible.slice(0, 18) });
      } else if (this.filter === 'hidden') {
        if (hidden.length) groups.push({ key: 'hidden', title: LanguageManager.t('search.group.hidden'), items: hidden.slice(0, 18) });
      } else if (this.filter === 'shortcuts') {
        if (shortcuts.length) groups.push({ key: 'shortcuts', title: LanguageManager.t('search.group.shortcuts'), items: shortcuts });
      }

      const seen = new Set();
      this.flatResults = [];
      groups.forEach((group) => {
        group.items = group.items.filter((item) => {
          const key = item.uid;
          if (seen.has(key) && group.key !== 'top') return false;
          if (group.key !== 'top') seen.add(key);
          return true;
        });
        group.items.forEach((item) => this.flatResults.push(item));
      });
      return groups.filter((group) => group.items.length);
    },

    renderResults() {
      if (!this.resultsNode) return;
      const groups = this.buildGroups();
      const count = this.flatResults.length;
      if (this.summaryNode) {
        if (!String(this.query || '').trim()) this.summaryNode.textContent = LanguageManager.t('search.ready');
        else if (count === 1) this.summaryNode.textContent = LanguageManager.t('search.count.one');
        else this.summaryNode.textContent = LanguageManager.t('search.count.many').replace('{count}', String(count));
      }

      if (!String(this.query || '').trim() && !groups.length) {
        this.resultsNode.innerHTML = this.renderEmpty(LanguageManager.t('search.initialTitle'), LanguageManager.t('search.initialBody'));
        return;
      }
      if (String(this.query || '').trim() && !groups.length) {
        this.resultsNode.innerHTML = this.renderEmpty(LanguageManager.t('search.noResults'), LanguageManager.t('search.initialBody'));
        return;
      }

      this.resultsNode.innerHTML = groups.map((group) => this.renderGroup(group)).join('');
      this.syncActiveItem();
    },

    renderEmpty(title, body) {
      return `<div class="global-search-empty">
        <span class="global-search-empty__icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="m20 20-4.7-4.7m2.5-5.1a7.6 7.6 0 1 1-15.2 0 7.6 7.6 0 0 1 15.2 0Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(body)}</p>
      </div>`;
    },

    renderGroup(group) {
      return `<section class="global-search-group" data-search-group="${escapeHtml(group.key)}">
        <header class="global-search-group__header">
          <h3>${escapeHtml(group.title)}</h3>
          <span>${escapeHtml(String(group.items.length))}</span>
        </header>
        <div class="global-search-group__items" role="listbox">
          ${group.items.map((item) => this.renderItem(item)).join('')}
        </div>
      </section>`;
    },

    renderItem(item) {
      const score = LanguageManager.t('search.badge.score').replace('{score}', String(item.score || 0));
      const actionLabel = item.type === 'shortcut' ? LanguageManager.t('search.openShortcut') : LanguageManager.t('search.openArticle');
      const hits = item.hits && item.hits.length ? `<span class="global-search-hitline">${escapeHtml(item.hits.slice(0, 5).join(' · '))}</span>` : '';
      return `<button class="global-search-result" type="button" role="option" data-search-result-id="${escapeHtml(item.uid)}" aria-label="${escapeHtml(actionLabel)}: ${escapeHtml(item.title)}">
        <span class="global-search-result__icon" aria-hidden="true">${item.type === 'shortcut' ? iconSvg('star') : iconSvg('document')}</span>
        <span class="global-search-result__body">
          <span class="global-search-result__title">${escapeHtml(item.title)}</span>
          <span class="global-search-result__path">${escapeHtml(item.path || item.id)}</span>
          ${hits}
        </span>
        <span class="global-search-result__meta">
          <span class="global-search-badge${item.hidden ? ' global-search-badge--hidden' : ''}">${escapeHtml(item.badge)}</span>
          <span class="global-search-score">${escapeHtml(score)}</span>
        </span>
      </button>`;
    },

    openResultById(uid) {
      const result = this.flatResults.find((item) => item.uid === uid);
      if (!result) return;
      if (result.type === 'shortcut') {
        FavoritesRecent.activate(result.id);
        const sidebarInput = document.getElementById('globalKnowledgeSearch');
        if (sidebarInput) sidebarInput.value = result.title;
        this.close();
        return;
      }
      if (result.type === 'pane') {
        if (SUGO.knowledgeTree && typeof SUGO.knowledgeTree.selectPane === 'function') {
          SUGO.knowledgeTree.selectPane(result.id);
        } else if (SUGO.knowledgeArticleView) {
          SUGO.knowledgeArticleView.render(result.id);
        }
        this.close();
      }
    }
  };


  const KnowledgeArticleView = {
    activePane: '',
    activeArticle: null,
    lastCopyText: '',

    init() {
      this.activePane = safeLocalStorageGet(CONFIG.storageKeys.kbActivePane) || '';
      if (this.activePane) {
        this.render(this.activePane, { silent: true });
      }

      document.addEventListener('click', (event) => {
        const action = event.target.closest('[data-kb-action]');
        if (action) {
          event.preventDefault();
          if (action.getAttribute('data-kb-action') === 'copy') this.copyCurrentArticle();
          return;
        }

        const related = event.target.closest('[data-kb-related-pane]');
        if (related) {
          event.preventDefault();
          const paneId = related.getAttribute('data-kb-related-pane');
          if (SUGO.knowledgeTree) SUGO.knowledgeTree.selectPane(paneId);
          else this.render(paneId);
        }
      });

      window.addEventListener('sugo:kbpaneselect', (event) => {
        this.render(event.detail.paneId);
      });

      window.addEventListener('sugo:kbsourcechange', () => {
        if (WorkspaceState.current === 'knowledgebase') {
          const fallback = this.getDefaultPaneForSource(SidebarNavigation.state.activeSource);
          if (fallback) {
            if (SUGO.knowledgeTree) SUGO.knowledgeTree.selectPane(fallback);
            else this.render(fallback);
          }
        }
      });

      window.addEventListener('sugo:sidebarmenuchange', (event) => {
        if (event.detail.menu !== 'knowledgebase') return;
        const paneId = this.activePane || safeLocalStorageGet(CONFIG.storageKeys.kbActivePane) || this.getDefaultPaneForSource(SidebarNavigation.state.activeSource);
        if (paneId) {
          if (SUGO.knowledgeTree) SUGO.knowledgeTree.selectPane(paneId);
          else this.render(paneId);
        } else {
          WorkspaceState.set('knowledgebase');
        }
      });

      window.addEventListener('sugo:languagechange', () => {
        if (this.activePane) this.render(this.activePane, { preserveStatus: true });
      });
    },

    getDefaultPaneForSource(source) {
      const data = window.SUGO_KB_DATA || { roots: [] };
      const root = (data.roots || []).find((item) => item.key === source) || (data.roots || [])[0];
      const category = root && root.categories && root.categories[0];
      const section = category && category.sections && category.sections[0];
      const article = section && section.articles && section.articles[0];
      return article ? article.id : '';
    },

    getArticleMeta(paneId) {
      const index = KnowledgeBaseMatcher.buildIndex();
      return index.find((item) => item.id === paneId) || null;
    },

    getPaneBody(paneId) {
      const content = window.SUGO_KB_CONTENT || {};
      return content[paneId] || null;
    },

    getFieldsForLanguage(pane) {
      if (!pane) return [];
      const primary = LanguageManager.current === 'ar' ? (pane.arFields || []) : (pane.enFields || []);
      const fallback = LanguageManager.current === 'ar' ? (pane.enFields || []) : (pane.arFields || []);
      return (primary && primary.length ? primary : fallback || []).filter((field) => field && String(field.text || '').trim());
    },

    getDisplayTitle(article, pane) {
      if (LanguageManager.current === 'ar') {
        return (pane && pane.arTitle) || (pane && pane.enTitle) || (article && article.title) || this.activePane || LanguageManager.t('kb.emptyTitle');
      }
      return (pane && pane.enTitle) || (pane && pane.arTitle) || (article && article.title) || this.activePane || LanguageManager.t('kb.emptyTitle');
    },

    getPath(article) {
      return article && article.path ? article.path : [article && article.root, article && article.category, article && article.section, article && article.title].filter(Boolean).join(' › ');
    },

    render(paneId, options = {}) {
      if (!paneId) return;
      const article = this.getArticleMeta(paneId);
      const pane = this.getPaneBody(paneId);
      const fields = this.getFieldsForLanguage(pane);
      const title = this.getDisplayTitle(article, pane);
      const path = this.getPath(article) || paneId;

      this.activePane = paneId;
      this.activeArticle = { article, pane, fields, title, path };
      safeLocalStorageSet(CONFIG.storageKeys.kbActivePane, paneId);

      const titleNode = document.querySelector('[data-kb-article-title]');
      const pathNode = document.querySelector('[data-kb-article-path]');
      const contentNode = document.querySelector('[data-kb-content]');
      const emptyNode = document.querySelector('[data-kb-empty]');
      const copyButtons = document.querySelectorAll('[data-kb-action="copy"]');

      if (titleNode) titleNode.textContent = title;
      if (pathNode) pathNode.textContent = path;
      if (contentNode) {
        contentNode.hidden = fields.length === 0;
        contentNode.innerHTML = fields.map((field) => this.renderField(field)).join('');
      }
      if (emptyNode) emptyNode.hidden = fields.length > 0;
      copyButtons.forEach((button) => { button.disabled = fields.length === 0; });

      this.renderMeta(article, fields.length);
      this.renderRelated(article, title);
      this.lastCopyText = this.buildCopyText(title, path, fields);
      if (!options.preserveStatus) {
        this.setStatus(fields.length ? LanguageManager.t('kb.statusLoaded') : LanguageManager.t('kb.statusNoBody'), fields.length ? 'success' : 'warning');
      }
      WorkspaceState.set('knowledgebase');
    },

    renderField(field) {
      const label = field && field.label ? field.label : (LanguageManager.current === 'ar' ? 'النص' : 'Text');
      const text = field && field.text ? field.text : '';
      return `<section class="kb-field-block">
        <header class="kb-field-block__label">${escapeHtml(label)}</header>
        <pre class="kb-field-block__body">${escapeHtml(text)}</pre>
      </section>`;
    },

    renderMeta(article, fieldCount) {
      const set = (selector, value) => {
        const node = document.querySelector(selector);
        if (node) node.textContent = value || '—';
      };
      set('[data-kb-meta-source]', article ? article.root : '—');
      set('[data-kb-meta-category]', article ? article.category : '—');
      set('[data-kb-meta-section]', article ? article.section : '—');
      set('[data-kb-meta-pane]', this.activePane || '—');
      set('[data-kb-meta-blocks]', String(fieldCount || 0));
    },

    renderRelated(article, title) {
      const relatedNode = document.querySelector('[data-kb-related]');
      if (!relatedNode) return;
      let related = [];
      const data = window.SUGO_KB_DATA || { roots: [] };
      (data.roots || []).forEach((root) => {
        (root.categories || []).forEach((category) => {
          (category.sections || []).forEach((section) => {
            const hasActive = (section.articles || []).some((item) => item.id === this.activePane);
            if (hasActive) {
              related = (section.articles || []).filter((item) => item.id !== this.activePane).slice(0, 5).map((item) => ({ id: item.id, title: item.title }));
            }
          });
        });
      });

      if (!related.length && title) {
        related = KnowledgeBaseMatcher.lookup(title, 6, 1000, null, { outputType: 'answer' }).topics
          .filter((item) => item.id !== this.activePane)
          .slice(0, 5)
          .map((item) => ({ id: item.id, title: item.title }));
      }

      if (!related.length) {
        relatedNode.innerHTML = `<p class="kb-related-empty">${escapeHtml(LanguageManager.t('kb.relatedEmpty'))}</p>`;
        return;
      }

      relatedNode.innerHTML = related.map((item) => `<button class="kb-related-button" type="button" data-kb-related-pane="${escapeHtml(item.id)}" title="${escapeHtml(item.title)}">
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M7.4 4.3h6.3l3.9 3.9v11.5H7.4V4.3Z" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"/><path d="M13.4 4.6v4h4M9.7 12.2h4.6M9.7 15.4h3.5" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>${escapeHtml(item.title)}</span>
      </button>`).join('');
    },

    buildCopyText(title, path, fields) {
      const blocks = [title, path].filter(Boolean);
      fields.forEach((field) => {
        blocks.push(`${field.label || 'Text'}\n${field.text || ''}`.trim());
      });
      return blocks.join('\n\n');
    },

    async copyCurrentArticle() {
      const text = this.lastCopyText || '';
      if (!text.trim()) return;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          textarea.remove();
        }
        this.setStatus(LanguageManager.t('kb.statusCopied'), 'success');
      } catch (_error) {
        this.setStatus(LanguageManager.t('kb.statusReady'), 'warning');
      }
    },

    setStatus(message, tone = 'ready') {
      const node = document.querySelector('[data-kb-status]');
      if (!node) return;
      node.textContent = message || '';
      node.className = `kb-article-status kb-article-status--${tone}`;
    }
  };


  const MarkdownRenderer = {
    inline(text) {
      return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
    },

    render(text) {
      const source = String(text || '').trim();
      if (!source) return `<p>${escapeHtml(LanguageManager.t('ask.emptyAnswer'))}</p>`;
      const lines = source.split(/\r?\n/);
      const html = [];
      let list = null;
      const closeList = () => {
        if (list) {
          html.push(`</${list}>`);
          list = null;
        }
      };
      const openList = (type) => {
        if (list !== type) {
          closeList();
          html.push(`<${type}>`);
          list = type;
        }
      };
      lines.forEach((raw) => {
        const line = raw.trim();
        if (!line) {
          closeList();
          return;
        }
        const heading = line.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
          closeList();
          const level = Math.min(heading[1].length + 2, 4);
          html.push(`<h${level}>${this.inline(heading[2])}</h${level}>`);
          return;
        }
        const bullet = line.match(/^[-*•]\s+(.+)$/);
        if (bullet) {
          openList('ul');
          html.push(`<li>${this.inline(bullet[1])}</li>`);
          return;
        }
        const ordered = line.match(/^\d+[.)]\s+(.+)$/);
        if (ordered) {
          openList('ol');
          html.push(`<li>${this.inline(ordered[1])}</li>`);
          return;
        }
        closeList();
        html.push(`<p>${this.inline(line)}</p>`);
      });
      closeList();
      return html.join('');
    }
  };

  const AIResponsePipeline = {
    stripPreamble(text) {
      const lines = String(text || '').split(/\r?\n/);
      const preamblePattern = /^(based on|according to|here is|here's|the following is|i found|i couldn't find|i was unable)\b/i;
      while (lines.length > 1) {
        const first = lines[0].trim();
        if (first && !/^(#{1,3}\s|[-*•]\s|\d+\.\s)/.test(first) && preamblePattern.test(first)) {
          lines.shift();
          if (lines[0] && lines[0].trim() === '') lines.shift();
        } else break;
      }
      return lines.join('\n').trim();
    },

    stripLatexNotation(text) {
      const replacements = [
        [/\$\\geq?\$/g, '≥'], [/\$\\leq?\$/g, '≤'], [/\$\\neq\$/g, '≠'], [/\$\\rightarrow\$/g, '→'], [/\$\\leftarrow\$/g, '←'], [/\$\\times\$/g, '×'], [/\$\\div\$/g, '÷'],
        [/\\geq?/g, '≥'], [/\\leq?/g, '≤'], [/\\neq/g, '≠'], [/\\rightarrow/g, '→'], [/\\leftarrow/g, '←'], [/\\times/g, '×'], [/\\div/g, '÷'], [/\$([^$]+)\$/g, '$1']
      ];
      return replacements.reduce((out, [pattern, replacement]) => out.replace(pattern, replacement), String(text || ''));
    },

    applyCustomerReplyEnvelope(text) {
      return String(text || '')
        .replace(/(?:\n\s*){3,}/g, '\n\n')
        .replace(/^(dear customer,?\s*){2,}/i, 'Dear Customer,\n')
        .trim();
    },

    finalize(text) {
      return this.applyCustomerReplyEnvelope(this.stripLatexNotation(this.stripPreamble(text)));
    }
  };

  const WorkerAPI = {
    lastRequestTime: 0,
    abortController: null,

    languageForWorker() {
      return LanguageManager.current === 'ar' ? 'arabic' : 'english';
    },

    customerEnvelopePrompt(language) {
      if (language === 'arabic') {
        return '## أسلوب رد خدمة العملاء في سوجو:\nأنت مسؤول عن كتابة مقدمة ونهاية طبيعية مناسبة للحالة. لا توجد صيغة افتتاح ثابتة مفروضة من الواجهة، لكن يجب أن يكون الرد جاهزًا للإرسال للعميل وبأسلوب فريق خدمة عملاء سوجو. لا تكرر التحية أو عبارة عزيزي العميل أو الخاتمة. في وضع التذكرة فقط: اتبع هذا الترتيب: مقدمة قصيرة مناسبة، ثم اعتذار في فقرة مستقلة فقط إذا كانت الحالة تستدعي الاعتذار، ثم شرح مفصل أو خطوات الموضوع، ثم خاتمة رسمية طبيعية، ثم آخر سطر: خدمة عملاء سوجو. لا تستخدم أرقامًا أو نقاطًا أو bullets في بداية الأسطر؛ إذا احتجت ترتيب خطوات أو متطلبات فاكتبها بكلمات عربية مثل: أولاً، ثانياً، ثالثاً، مع الحفاظ على كل بند في سطر منفصل. لا تطلب تمييز أو تكبير الكلمات الحساسة.\n\n';
      }
      return '## SUGO customer support reply style:\nYou are responsible for writing a natural opening and closing suitable for the case. The UI does not force any fixed opening template. The final reply must be ready to send and written in the voice of the SUGO Customer Support Team. Do not repeat greetings, \'Dear Customer\', or closings. In Ticket mode only: use this structure: short natural opening, then a separate apology paragraph only if the case needs an apology, then the detailed explanation or steps, then a formal natural closing, then the final line: SUGO Customer Support Team. Do not use numeric lists, bullets, or markdown list markers at the start of lines; if you need ordered steps or requirements, use word-based order such as First, Second, Third, while keeping each item on a separate line. Do not visually emphasize sensitive terms.\n\n';
    },

    buildSystemPrompt({ kb, language, responseMode, outputType, askToolInstruction, imageInstruction, sopMode }) {
      const isDetailed = responseMode === 'detailed';
      const isStepMode = responseMode === 'step';
      const isTicketOutput = outputType === 'ticket';
      const modeInstruction = isStepMode
        ? '## RESPONSE MODE — STEP-BY-STEP:\nUse clear numbered steps. Separate agent action, customer message, required evidence, and escalation if applicable.\n\n'
        : isDetailed
          ? '## RESPONSE MODE — DETAILED:\nGive a complete answer with conditions, exceptions, and escalation details when relevant.\n\n'
          : '## RESPONSE MODE — BRIEF:\nGive a concise answer with only the essential action points.\n\n';
      const strictSop = sopMode === 'sop_only' || outputType === 'ticket';
      const knowledgeModeInstruction = strictSop
        ? '## KNOWLEDGE MODE — STRICT SOP ONLY:\nUse ONLY the internal knowledge base supplied below. In Smart Ticket mode, never use outside policy or generic support text. If the supplied SOP does not clearly support the case, ask for the missing details or recommend internal escalation. Do not use web search and do not invent policy.\n\n'
        : '## KNOWLEDGE MODE — HYBRID:\nUse the internal knowledge base first. If it is incomplete or there is no strong match, you may use provider fallback only for SUGO-specific support context. Do not invent policy, IDs, dates, amounts, or hidden image details.\n\n';
      const outputTypeInstruction = isTicketOutput
        ? '## OUTPUT TYPE — TICKET / CUSTOMER REPLY:\nReturn a ready-to-send customer support ticket/reply only. Use a respectful greeting, clear body, and polite closing. Do not explain internal reasoning. Do not mention that you used a knowledge base. Do not include internal fields such as Mention, Care, Reporter, VIP, Charm, or admin notes unless the user explicitly asks for an internal form. If the internal KB contains a Ticket field, prioritize it and rewrite it professionally in the selected language. If required information is missing, ask the customer for the missing items inside the ticket message. Do not use numbered or bulleted list markers in the final ticket; for Arabic tickets use: أولاً، ثانياً، ثالثاً، and so on.\n'
        : '## OUTPUT TYPE — ANSWER / AGENT GUIDANCE:\nAnswer the support agent directly. Explain the correct procedure, key conditions, and what to send to the customer. You may include internal notes, escalation guidance, or source chips when useful. Do not format it as a customer ticket unless the selected output type is Ticket.\n';
      const smartTicketInstruction = '## SMART CREATE TICKET MODE — HIGH ACCURACY:\n- Treat the user\'s text as raw customer conversation/problem details and extract the actual issue before writing.\n- Use the strongest matching SOP Ticket text when available; rewrite it naturally and ignore irrelevant SOP lines.\n- Do not invent IDs, names, dates, amounts, policy decisions, refunds, compensation, unban results, or approval guarantees.\n- If required details are missing, ask for them politely inside the customer-facing ticket.\n- Keep the final output customer-facing only: no analysis, no confidence labels, no source names, no admin notes, no internal routing, and no hidden-policy wording.\n- For sensitive cases such as account ownership, ban, abuse, recharge, withdrawal, VIP, Charm, agency, or host issues, be conservative and request verification/escalation when the SOP is not conclusive.\n- Final output must be one polished ready-to-send support ticket/reply in the selected language.\n- Ticket formatting rule: no numeric list markers and no bullets. If ordering is needed in Arabic, use أولاً، ثانياً، ثالثاً، etc.; in English, use First, Second, Third, etc. Keep each item on its own line.\n\n';
      const languageInstruction = language === 'arabic'
        ? 'You must answer only in formal Modern Standard Arabic. Do not use English, slang, or Egyptian/Jordanian colloquial expressions.'
        : 'You must answer only in professional English. Do not use Arabic.';
      const kbHasContent = !!(kb.hasMeaningfulMatch && kb.text.trim().length > 150);
      return 'You are an expert SUGO app support specialist for the MENA region. ' +
        'SUGO (also known as Sugo Live or VoiceMaker) is a popular live voice and social app operating in MENA. ' +
        'Your role: give accurate, complete answers about SUGO features, policies, and troubleshooting to customer support agents.\n\n' +
        knowledgeModeInstruction +
        modeInstruction +
        '## SOURCE DISCIPLINE:\n' +
        '- Treat the provided SOP text as the source of truth when it contains a match.\n' +
        '- If INTERNAL MATCHES show a Primary route, use that route first and do not replace it with a broad overview, generic appeal, or unrelated unban article.\n' +
        '- In Ticket mode, if a matching sv-tickets topic exists, prioritize its Ticket field over general SOP text.\n' +
        '- If confidence is low, avoid definitive policy language.\n' +
        '- For sensitive topics such as ban, abuse, payment, withdrawal, VIP, or agency, prefer escalation when the SOP is incomplete.\n\n' +
        outputTypeInstruction + '\n' + (isTicketOutput ? smartTicketInstruction : '') + (imageInstruction ? '## ATTACHED IMAGE ANALYSIS:\n' + imageInstruction + '\n\n' : '') + (askToolInstruction ? '## ASK AI WORKSPACE FOCUS:\n' + askToolInstruction + '\n\n' : '') + this.customerEnvelopePrompt(language) +
        '## DEFAULT QUALITY RULES — ALWAYS ON:\n' +
        '- Clean and organize the answer before final output; remove duplicate points, repeated headings, repeated sentences, and filler.\n' +
        '- Numbered lists must be continuous and correct: 1, 2, 3, 4. Never restart at 1 unless a new section truly starts.\n' +
        '- Keep spacing tight: avoid extra blank lines, avoid large gaps, and use compact readable paragraphs.\n' +
        '- Keep English text left-to-right and Arabic text right-to-left in meaning and punctuation.\n' +
        '- When writing a ticket, make it ready to send: write a natural case-specific greeting, exact action, missing information request if needed, and a natural polite closing as SUGO Customer Support Team. Do not duplicate opening or closing lines.\n\n' +
        '## FORMATTING:\n' +
        '- ## for main headings, ### for sub-sections\n' +
        '- **bold** for key terms, numbers, important values\n' +
        '- Numbered lists for step-by-step processes; bullet lists for unordered lists\n' +
        '- Short paragraphs (2-4 sentences)\n' +
        '- Start DIRECTLY with the answer — no preamble like \'Based on the knowledge base...\'\n' +
        '- No LaTeX notation; use plain Unicode: ≥, ≤, →, ×, ÷, %\n' +
        (isDetailed || isStepMode ? '- Give a complete answer and finish every section fully; do not stop mid-list or mid-sentence\n' : '- Give a complete concise answer and finish every sentence fully\n') +
        (isTicketOutput ? '- Do not add source notes or internal labels in Ticket mode\n' : '- Mention uncertainty clearly when SOP confidence is medium or low\n') +
        '- Follow-up questions: use the prior conversation context to understand references\n\n' +
        (kbHasContent
          ? '=== INTERNAL KNOWLEDGE BASE MATCHES ===\nConfidence: ' + kb.confidenceLabel + ' (' + kb.confidenceScore + ')\nBest match: ' + (kb.bestTopic ? kb.bestTopic.id : 'none') + '\n\n' + kb.text
          : '=== INTERNAL KNOWLEDGE BASE MATCHES ===\n[No directly relevant articles found. Strict SOP Only mode is active.]') +
        '\n\nIMPORTANT LANGUAGE RULE:\n' + languageInstruction;
    },

    buildTicketQuery(ticketState) {
      const details = ticketState.details || {};
      const lines = [
        'Create Ticket workspace request',
        'Ticket Type: ' + TicketPreview.getTicketTypeLabel(ticketState.ticketType),
        'Subject: ' + (details.subject || ''),
        'Urgency: ' + (details.urgency || ''),
        'Category: ' + (TicketPreview.getSelectLabel('ticketCategory', details.category) || details.category || ''),
        'Affects: ' + (TicketPreview.getSelectLabel('ticketAffects', details.affects) || details.affects || ''),
        'Location: ' + (TicketPreview.getSelectLabel('ticketLocation', details.location) || details.location || ''),
        'Preferred Contact: ' + (TicketPreview.getSelectLabel('ticketContact', details.contact) || details.contact || ''),
        'Description: ' + (details.description || '')
      ];
      return lines.join('\n').trim();
    },

    buildRequestPayload(ticketState) {
      const language = this.languageForWorker();
      const responseMode = 'detailed';
      const outputType = 'ticket';
      const query = this.buildTicketQuery(ticketState);
      const kbLookupQuery = [ticketState.details.subject, TicketPreview.getSelectLabel('ticketCategory', ticketState.details.category), ticketState.details.description].filter(Boolean).join('\n');
      const kb = KnowledgeBaseMatcher.lookup(kbLookupQuery || query, 12, 3200, null, { outputType, preferTicketTopics: true, smartTicket: true, compactPrompt: false, completeAnswer: true });
      const messages = [
        { role: 'system', content: this.buildSystemPrompt({ kb, language, responseMode, outputType, sopMode: 'sop_only' }) },
        { role: 'user', content: query }
      ];

      return {
        query,
        kb,
        payload: {
          task_type: 'create_ticket',
          workspace: 'create_ticket',
          max_completion_tokens: 7000,
          response_mode: responseMode,
          output_type: outputType,
          language,
          sop_mode: 'sop_only',
          kb_matches: this.serializeKbMatches(kb),
          kb_confidence: kb.confidence || 'low',
          kb_confidence_score: Math.round((kb.confidenceScore || 0) * 10) / 10,
          kb_ambiguous: !!kb.ambiguous,
          kb_primary_route: kb.primaryRoute ? kb.primaryRoute.name : null,
          kb_query_intents: kb.queryIntents || [],
          has_image: false,
          images: undefined,
          image: undefined,
          cache: true,
          stream: false,
          messages
        }
      };
    },

    serializeKbMatches(kb) {
      return (kb.topics || []).slice(0, 12).map((topic) => ({
        paneId: topic.id,
        title: topic.title || topic.id,
        category: topic.category || '',
        section: topic.section || '',
        path: topic.path || '',
        score: Math.round((topic.score || 0) * 10) / 10,
        confidence: topic.confidence || kb.confidence || 'low',
        hits: (topic.hits || []).slice(0, 12),
        tags: (topic.tags || []).slice(0, 8),
        primary: !!topic.primary,
        selected: !!topic.selected
      }));
    },

    focusInstruction(focus) {
      if (focus === 'sop_check') {
        return 'This request came from the dedicated Ask AI workspace. Treat it as an agent-facing SOP check. Start with the best matching policy/procedure, mention confidence when useful, separate what is confirmed by SOP from what needs verification, and avoid writing a customer ticket.';
      }
      if (focus === 'troubleshoot') {
        return 'This request came from the dedicated Ask AI workspace. Treat it as an agent-facing troubleshooting answer. Provide practical steps in the correct order, include what evidence to request, and mention when to escalate. Do not write a customer ticket.';
      }
      if (focus === 'escalation') {
        return 'This request came from the dedicated Ask AI workspace. Treat it as an escalation review. Identify whether escalation is needed, which team/path should handle it if known, what missing information/evidence is required, and what the agent should avoid promising. Do not write a customer ticket.';
      }
      return 'This request came from the dedicated Ask AI workspace. Treat it as an agent-facing support answer. Give the correct action, relevant SOP conditions, missing information, and safe customer guidance. Do not write a customer ticket unless the user specifically asks inside the question.';
    },

    buildAskAIRequestPayload(query, askState) {
      const language = askState.language || this.languageForWorker();
      const responseMode = askState.response || 'brief';
      const outputType = 'answer';
      const sopMode = askState.sop === 'sop_only' ? 'sop_only' : 'hybrid';
      const askToolInstruction = this.focusInstruction(askState.focus || 'agent');
      const kb = KnowledgeBaseMatcher.lookup(query, 12, 3200, null, { outputType, preferTicketTopics: false, smartTicket: false, compactPrompt: false, completeAnswer: responseMode !== 'brief' });
      const messages = [
        { role: 'system', content: this.buildSystemPrompt({ kb, language, responseMode, outputType, askToolInstruction, sopMode }) },
        { role: 'user', content: query }
      ];

      return {
        query,
        kb,
        payload: {
          task_type: 'ask_ai',
          workspace: 'ask_ai',
          max_completion_tokens: responseMode === 'brief' ? 5200 : 9000,
          response_mode: responseMode,
          output_type: outputType,
          language,
          sop_mode: sopMode,
          kb_matches: this.serializeKbMatches(kb),
          kb_confidence: kb.confidence || 'low',
          kb_confidence_score: Math.round((kb.confidenceScore || 0) * 10) / 10,
          kb_ambiguous: !!kb.ambiguous,
          kb_primary_route: kb.primaryRoute ? kb.primaryRoute.name : null,
          kb_query_intents: kb.queryIntents || [],
          has_image: false,
          images: undefined,
          image: undefined,
          cache: true,
          stream: false,
          messages
        }
      };
    },


    visionInstruction(analysis, outputType) {
      const analysisRules = {
        screenshot_case: 'Read the screenshot carefully. Identify visible text, error messages, UI state, account or transaction clues, and the likely support category. Separate what is visible from what is assumed.',
        ban_moderation: 'Treat the image as possible moderation or ban evidence. Describe only visible evidence, avoid unsupported accusations, and use safe policy wording. If the image is insufficient, request more evidence or escalate.',
        payment_evidence: 'Treat the image as recharge, payment, withdrawal, exchange, or balance evidence. Extract visible amounts, order IDs, dates, status messages, and missing details before escalation. Do not promise refunds or credit.',
        account_identity: 'Treat the image as account, profile, agency, host, or identity evidence. Extract visible IDs/names/status carefully and request verification if ownership or identity is not conclusive.',
        app_error: 'Treat the image as an app issue screenshot. Identify the exact visible error or crash state, then give refresh/log/upload/cache/device steps and escalation trigger if the issue continues.'
      };
      return [
        'This request came from the dedicated Upload Image workspace, not the normal Ask AI or Create Ticket workspace.',
        'The image is the primary evidence. Read visible content carefully, but never invent unreadable text, hidden details, IDs, amounts, dates, or policy decisions.',
        analysisRules[analysis] || analysisRules.screenshot_case,
        outputType === 'ticket'
          ? 'Final output must be a customer-ready Vision Ticket. Use the image as evidence internally, but do not mention internal analysis, confidence labels, or source chips.'
          : 'Final output must be agent-facing Vision Answer. Include visible findings, likely SOP match, correct action, missing information, and escalation path when needed.',
        'For sensitive cases such as ban, abuse, recharge, withdrawal, VIP, agency, host, identity, or account ownership, be conservative and request verification/escalation if the SOP or image is not conclusive.'
      ].join(' ');
    },

    buildVisionQuery(uploadState) {
      const parts = [];
      parts.push('Upload Image workspace request.');
      parts.push(`Selected image analysis type: ${uploadState.analysis || 'screenshot_case'}.`);
      parts.push(`Selected output: ${uploadState.output || 'answer'}.`);
      const note = String(uploadState.context || '').trim();
      if (note) parts.push('Case note / requested check:\n' + note);
      if (!note) {
        parts.push((uploadState.output || 'answer') === 'ticket'
          ? 'Create a safe customer-ready reply based on the attached image and the strongest SUGO SOP match.'
          : 'Analyze the attached image and explain the visible issue, likely SOP match, correct agent action, missing information, and escalation path if needed.');
      }
      return parts.join('\n\n');
    },

    buildImageAnalysisRequestPayload(uploadState) {
      const language = uploadState.language || this.languageForWorker();
      const responseMode = uploadState.response || 'brief';
      const outputType = uploadState.output === 'ticket' ? 'ticket' : 'answer';
      const sopMode = uploadState.sop === 'sop_only' ? 'sop_only' : 'hybrid';
      const query = this.buildVisionQuery(uploadState);
      const analysisKbMap = {
        screenshot_case: 'screenshot visible issue support case SUGO app',
        ban_moderation: 'ban abuse report moderation violation screenshot evidence',
        payment_evidence: 'recharge payment withdrawal invoice transaction receipt screenshot',
        account_identity: 'account profile identity verification user id agency host screenshot',
        app_error: 'app error crash bug technical issue screenshot not working'
      };
      const kbQuery = String(uploadState.context || '').trim() || analysisKbMap[uploadState.analysis] || 'image screenshot support issue';
      const imagePayload = uploadState.image ? [{
        mimeType: uploadState.image.mimeType,
        data: uploadState.image.data,
        name: uploadState.image.name,
        width: uploadState.image.width,
        height: uploadState.image.height
      }] : undefined;
      const kb = KnowledgeBaseMatcher.lookup(kbQuery, 6, 2200, null, { outputType, preferTicketTopics: outputType === 'ticket', smartTicket: outputType === 'ticket', compactPrompt: false, completeAnswer: true });
      const imageInstruction = this.visionInstruction(uploadState.analysis || 'screenshot_case', outputType);
      const finalUserContent = uploadState.image
        ? `${query}\n\n[Attached image: ${uploadState.image.name || 'image'}; ${uploadState.image.width || '?'}×${uploadState.image.height || '?'}; compressed ${UploadImageConsole.formatBytes(uploadState.image.size || 0)}]`
        : query;
      const messages = [
        { role: 'system', content: this.buildSystemPrompt({ kb, language, responseMode, outputType, imageInstruction, sopMode }) },
        { role: 'user', content: finalUserContent }
      ];

      return {
        query,
        kb,
        payload: {
          task_type: 'image_analysis',
          workspace: 'upload_image',
          max_completion_tokens: outputType === 'ticket' ? (responseMode === 'brief' ? 4200 : 7000) : (responseMode === 'brief' ? 5200 : 9000),
          response_mode: responseMode,
          output_type: outputType,
          language,
          sop_mode: sopMode,
          kb_matches: this.serializeKbMatches(kb),
          kb_confidence: kb.confidence || 'low',
          kb_confidence_score: Math.round((kb.confidenceScore || 0) * 10) / 10,
          kb_ambiguous: !!kb.ambiguous,
          kb_primary_route: kb.primaryRoute ? kb.primaryRoute.name : null,
          kb_query_intents: kb.queryIntents || [],
          has_image: !!uploadState.image,
          images: imagePayload,
          image: imagePayload && imagePayload[0] ? imagePayload[0] : undefined,
          cache: !uploadState.image,
          stream: false,
          messages
        }
      };
    },

    async createTicketDraft(ticketState) {
      const now = Date.now();
      if (now - this.lastRequestTime < CONFIG.aiCooldownMs) {
        await new Promise((resolve) => window.setTimeout(resolve, CONFIG.aiCooldownMs - (now - this.lastRequestTime)));
      }
      this.lastRequestTime = Date.now();
      if (this.abortController) this.abortController.abort();
      this.abortController = new AbortController();
      const request = this.buildRequestPayload(ticketState);
      const timeout = window.setTimeout(() => this.abortController.abort(), CONFIG.aiRequestTimeoutMs);
      try {
        const response = await fetch(CONFIG.workerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: this.abortController.signal,
          body: JSON.stringify(request.payload)
        });
        window.clearTimeout(timeout);
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Request failed (${response.status}): ${errText.slice(0, 300)}`);
        }
        const parsed = await this.parseResponse(response);
        return { ...parsed, request, kb: request.kb };
      } catch (error) {
        window.clearTimeout(timeout);
        throw error;
      }
    },

    async askAIAnswer(query, askState, options = {}) {
      const now = Date.now();
      if (now - this.lastRequestTime < CONFIG.aiCooldownMs) {
        await new Promise((resolve) => window.setTimeout(resolve, CONFIG.aiCooldownMs - (now - this.lastRequestTime)));
      }
      this.lastRequestTime = Date.now();
      if (this.abortController) this.abortController.abort();
      this.abortController = new AbortController();
      const request = this.buildAskAIRequestPayload(query, askState || {});
      const timeout = window.setTimeout(() => this.abortController.abort(), CONFIG.aiRequestTimeoutMs);
      try {
        const response = await fetch(CONFIG.workerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: this.abortController.signal,
          body: JSON.stringify(request.payload)
        });
        window.clearTimeout(timeout);
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Request failed (${response.status}): ${errText.slice(0, 300)}`);
        }
        const parsed = await this.parseResponse(response, options);
        return { ...parsed, request, kb: request.kb };
      } catch (error) {
        window.clearTimeout(timeout);
        throw error;
      }
    },


    async analyzeImage(uploadState, options = {}) {
      const now = Date.now();
      if (now - this.lastRequestTime < CONFIG.aiCooldownMs) {
        await new Promise((resolve) => window.setTimeout(resolve, CONFIG.aiCooldownMs - (now - this.lastRequestTime)));
      }
      this.lastRequestTime = Date.now();
      if (this.abortController) this.abortController.abort();
      this.abortController = new AbortController();
      const request = this.buildImageAnalysisRequestPayload(uploadState || {});
      const timeout = window.setTimeout(() => this.abortController.abort(), CONFIG.aiRequestTimeoutMs);
      try {
        const response = await fetch(CONFIG.workerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: this.abortController.signal,
          body: JSON.stringify(request.payload)
        });
        window.clearTimeout(timeout);
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Request failed (${response.status}): ${errText.slice(0, 300)}`);
        }
        const parsed = await this.parseResponse(response, options);
        return { ...parsed, request, kb: request.kb };
      } catch (error) {
        window.clearTimeout(timeout);
        throw error;
      }
    },

    async parseResponse(response, options = {}) {
      let answer = '';
      let responseData = null;
      if (response.body && response.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === '[DONE]') continue;
            try {
              const json = JSON.parse(payload);
              const delta = json.response ?? json.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                answer += delta;
                if (typeof options.onDelta === 'function') options.onDelta(delta, answer);
              }
            } catch (_error) {}
          }
        }
      } else {
        const data = await response.json();
        responseData = data;
        const choice = (data.choices || [])[0];
        answer = (choice && choice.message && choice.message.content || '').trim();
        if (!answer) {
          const raw = data._debug_raw ? JSON.stringify(data._debug_raw).slice(0, 300) : '';
          throw new Error('Empty response' + (raw ? ` (raw: ${raw})` : ''));
        }
      }
      const finalized = AIResponsePipeline.finalize(answer);
      if (typeof options.onFinal === 'function') options.onFinal(finalized);
      return { answer: finalized, responseData };
    }
  };


  const AskAIConsole = {
    busy: false,
    state: {
      language: 'english',
      response: 'brief',
      sop: 'hybrid',
      focus: 'agent',
      answer: ''
    },

    init() {
      this.restore();
      this.bindEvents();
      this.syncOptions();
      this.updateHint();
      this.renderAnswer(this.state.answer || '', { empty: !this.state.answer });
    },

    restore() {
      const raw = safeLocalStorageGet(CONFIG.storageKeys.askAiState);
      if (!raw) {
        this.state.language = LanguageManager.current === 'ar' ? 'arabic' : 'english';
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.state.language = ['english', 'arabic'].includes(parsed.language) ? parsed.language : this.state.language;
          this.state.response = ['brief', 'detailed', 'step'].includes(parsed.response) ? parsed.response : this.state.response;
          this.state.sop = ['hybrid', 'sop_only'].includes(parsed.sop) ? parsed.sop : this.state.sop;
          this.state.focus = ['agent', 'sop_check', 'troubleshoot', 'escalation'].includes(parsed.focus) ? parsed.focus : this.state.focus;
          this.state.answer = typeof parsed.answer === 'string' ? parsed.answer : '';
        }
      } catch (_error) {}
    },

    persist() {
      safeLocalStorageSet(CONFIG.storageKeys.askAiState, JSON.stringify(this.state));
    },

    bindEvents() {
      document.addEventListener('click', (event) => {
        const option = event.target.closest('[data-ask-option]');
        if (option) {
          event.preventDefault();
          this.setOption(option.getAttribute('data-ask-option'), option.getAttribute('data-value'));
          return;
        }

        const chip = event.target.closest('[data-ask-chip]');
        if (chip) {
          event.preventDefault();
          this.addChip(chip.getAttribute('data-ask-chip') || chip.textContent || '');
          return;
        }

        const action = event.target.closest('[data-ask-action]');
        if (action) {
          event.preventDefault();
          this.handleAction(action.getAttribute('data-ask-action'));
        }
      });

      const input = document.querySelector('[data-ask-input]');
      if (input) {
        input.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this.submit();
          }
        });
      }

      window.addEventListener('sugo:languagechange', () => {
        this.syncOptions();
        this.updateHint();
        if (!this.state.answer) this.renderAnswer('', { empty: true });
      });
    },

    setOption(key, value) {
      if (!Object.prototype.hasOwnProperty.call(this.state, key)) return;
      const allowed = {
        language: ['english', 'arabic'],
        response: ['brief', 'detailed', 'step'],
        sop: ['hybrid', 'sop_only'],
        focus: ['agent', 'sop_check', 'troubleshoot', 'escalation']
      };
      if (!allowed[key] || !allowed[key].includes(value)) return;
      this.state[key] = value;
      this.persist();
      this.syncOptions();
      this.updateHint();
    },

    syncOptions() {
      document.querySelectorAll('[data-ask-option]').forEach((button) => {
        const key = button.getAttribute('data-ask-option');
        const value = button.getAttribute('data-value');
        const active = this.state[key] === value;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    },

    updateHint() {
      const hint = document.querySelector('[data-ask-hint]');
      if (!hint) return;
      hint.textContent = LanguageManager.t(`ask.hint.${this.state.focus}`);
    },

    addChip(text) {
      const input = document.querySelector('[data-ask-input]');
      if (!input) return;
      const current = input.value.trim();
      input.value = current ? `${current}\n${text}` : text;
      input.focus();
    },

    handleAction(action) {
      if (action === 'submit') {
        this.submit();
      } else if (action === 'clear') {
        this.clear();
      } else if (action === 'copy') {
        this.copyAnswer();
      }
    },

    getQuery() {
      const input = document.querySelector('[data-ask-input]');
      return input ? input.value.trim() : '';
    },

    async submit() {
      if (this.busy) return;
      const query = this.getQuery();
      const input = document.querySelector('[data-ask-input]');
      if (!query) {
        this.setStatus(LanguageManager.t('ask.statusMissing'), 'error');
        if (input) input.focus({ preventScroll: false });
        return;
      }
      this.setBusy(true);
      this.state.answer = '';
      this.renderAnswer('', { loading: true });
      this.setStatus(LanguageManager.t('ask.statusGenerating'), 'loading');
      try {
        const result = await WorkerAPI.askAIAnswer(query, this.state, {
          onDelta: (_delta, partial) => {
            this.setStatus(LanguageManager.t('ask.statusStreaming'), 'loading');
            this.renderAnswer(AIResponsePipeline.finalize(partial), { streaming: true });
          },
          onFinal: (finalized) => {
            this.renderAnswer(finalized, { streaming: false });
          }
        });
        this.state.answer = result.answer;
        this.persist();
        safeLocalStorageSet(CONFIG.storageKeys.lastAskAiAnswer, JSON.stringify({ answer: result.answer, at: new Date().toISOString(), kbConfidence: result.kb.confidence, kbConfidenceScore: result.kb.confidenceScore }));
        this.renderAnswer(result.answer, { streaming: false });
        this.setStatus(LanguageManager.t('ask.statusApplied'), result.kb.confidence === 'low' ? 'warning' : 'success');
      } catch (error) {
        const message = error && error.name === 'AbortError' ? LanguageManager.t('ask.statusTimeout') : LanguageManager.t('ask.statusFailed');
        this.setStatus(`${message}${error && error.message && error.name !== 'AbortError' ? ` ${error.message}` : ''}`, 'error');
        this.renderAnswer(this.state.answer || '', { empty: !this.state.answer });
      } finally {
        this.setBusy(false);
      }
    },

    clear() {
      const input = document.querySelector('[data-ask-input]');
      if (input) {
        input.value = '';
        input.focus();
      }
      this.state.answer = '';
      this.persist();
      this.renderAnswer('', { empty: true });
      this.setStatus(LanguageManager.t('ask.statusReady'), 'neutral');
    },

    async copyAnswer() {
      if (!this.state.answer) return;
      try {
        await navigator.clipboard.writeText(this.state.answer);
      } catch (_error) {
        const textarea = document.createElement('textarea');
        textarea.value = this.state.answer;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      this.setStatus(LanguageManager.t('ask.statusCopied'), 'success');
    },

    renderAnswer(answer, options = {}) {
      const node = document.querySelector('[data-ask-answer]');
      const copy = document.querySelector('[data-ask-action="copy"]');
      if (!node) return;
      if (options.loading) {
        node.innerHTML = '<div class="ask-ai-answer-loading"><span></span><span></span><span></span></div>';
      } else if (options.empty) {
        node.innerHTML = `<p>${escapeHtml(LanguageManager.t('ask.emptyAnswer'))}</p>`;
      } else {
        node.innerHTML = MarkdownRenderer.render(answer) + (options.streaming ? '<span class="ask-ai-cursor" aria-hidden="true"></span>' : '');
      }
      if (copy) copy.disabled = !String(answer || '').trim();
    },

    setBusy(isBusy) {
      this.busy = !!isBusy;
      document.querySelectorAll('[data-ask-action="submit"]').forEach((button) => {
        button.disabled = this.busy;
        button.classList.toggle('is-loading', this.busy);
      });
    },

    setStatus(message, tone = 'neutral') {
      const node = document.querySelector('[data-ask-status]');
      if (!node) return;
      node.textContent = message || '';
      node.className = `ask-ai-status ask-ai-status--${tone}`;
    }
  };


  const UploadImageConsole = {
    maxFileBytes: 8 * 1024 * 1024,
    maxBase64Chars: 6500000,
    maxEdge: 1600,
    jpegQuality: 0.84,
    allowedTypes: new Set(['image/jpeg', 'image/png', 'image/webp']),
    busy: false,
    state: {
      output: 'answer',
      language: 'english',
      response: 'brief',
      sop: 'hybrid',
      analysis: 'screenshot_case',
      context: '',
      image: null,
      answer: ''
    },

    init() {
      this.restore();
      this.bindEvents();
      this.syncOptions();
      this.updateHint();
      this.renderPreview();
      this.renderAnswer(this.state.answer || '', { empty: !this.state.answer });
    },

    restore() {
      const raw = safeLocalStorageGet(CONFIG.storageKeys.uploadImageState);
      this.state.language = LanguageManager.current === 'ar' ? 'arabic' : 'english';
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.state.output = ['answer', 'ticket'].includes(parsed.output) ? parsed.output : this.state.output;
          this.state.language = ['english', 'arabic'].includes(parsed.language) ? parsed.language : this.state.language;
          this.state.response = ['brief', 'detailed', 'step'].includes(parsed.response) ? parsed.response : this.state.response;
          this.state.sop = ['hybrid', 'sop_only'].includes(parsed.sop) ? parsed.sop : this.state.sop;
          this.state.analysis = ['screenshot_case', 'ban_moderation', 'payment_evidence', 'account_identity', 'app_error'].includes(parsed.analysis) ? parsed.analysis : this.state.analysis;
          this.state.context = typeof parsed.context === 'string' ? parsed.context : '';
          this.state.answer = typeof parsed.answer === 'string' ? parsed.answer : '';
          if (parsed.image && parsed.image.data && parsed.image.previewDataUrl) this.state.image = parsed.image;
        }
      } catch (_error) {}
      const context = document.querySelector('[data-upload-context]');
      if (context) context.value = this.state.context || '';
    },

    persist() {
      const snapshot = {
        output: this.state.output,
        language: this.state.language,
        response: this.state.response,
        sop: this.state.sop,
        analysis: this.state.analysis,
        context: this.getContext(),
        answer: this.state.answer,
        image: this.state.image
      };
      safeLocalStorageSet(CONFIG.storageKeys.uploadImageState, JSON.stringify(snapshot));
    },

    bindEvents() {
      document.addEventListener('click', (event) => {
        const option = event.target.closest('[data-upload-option]');
        if (option) {
          event.preventDefault();
          this.setOption(option.getAttribute('data-upload-option'), option.getAttribute('data-value'));
          return;
        }

        const chip = event.target.closest('[data-upload-chip]');
        if (chip) {
          event.preventDefault();
          this.addChip(chip.getAttribute('data-upload-chip') || chip.textContent || '');
          return;
        }

        const action = event.target.closest('[data-upload-action]');
        if (action) {
          event.preventDefault();
          this.handleAction(action.getAttribute('data-upload-action'));
        }
      });

      const input = document.querySelector('[data-upload-input]');
      if (input) {
        input.addEventListener('change', (event) => {
          const file = event.target.files && event.target.files[0];
          if (file) this.handleImage(file);
          input.value = '';
        });
      }

      const dropzone = document.querySelector('[data-upload-dropzone]');
      if (dropzone) {
        dropzone.addEventListener('click', (event) => {
          if (!event.target.closest('[data-upload-action]')) this.openPicker();
        });
        dropzone.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.openPicker();
          }
        });
        ['dragenter', 'dragover'].forEach((type) => {
          dropzone.addEventListener(type, (event) => {
            event.preventDefault();
            dropzone.classList.add('is-dragover');
          });
        });
        ['dragleave', 'drop'].forEach((type) => {
          dropzone.addEventListener(type, (event) => {
            event.preventDefault();
            dropzone.classList.remove('is-dragover');
          });
        });
        dropzone.addEventListener('drop', (event) => {
          const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
          if (file) this.handleImage(file);
        });
      }

      const context = document.querySelector('[data-upload-context]');
      if (context) {
        context.addEventListener('input', () => {
          this.state.context = this.getContext();
          this.persist();
        });
        context.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this.submit();
          }
        });
      }

      window.addEventListener('sugo:languagechange', () => {
        this.syncOptions();
        this.updateHint();
        this.renderPreview();
        if (!this.state.answer) this.renderAnswer('', { empty: true });
      });
    },

    handleAction(action) {
      if (action === 'browse') this.openPicker();
      if (action === 'remove-image') this.clearImage();
      if (action === 'submit') this.submit();
      if (action === 'clear') this.clear();
      if (action === 'copy') this.copyAnswer();
    },

    setOption(key, value) {
      const allowed = {
        output: ['answer', 'ticket'],
        language: ['english', 'arabic'],
        response: ['brief', 'detailed', 'step'],
        sop: ['hybrid', 'sop_only'],
        analysis: ['screenshot_case', 'ban_moderation', 'payment_evidence', 'account_identity', 'app_error']
      };
      if (!allowed[key] || !allowed[key].includes(value)) return;
      this.state[key] = value;
      this.persist();
      this.syncOptions();
      this.updateHint();
    },

    syncOptions() {
      document.querySelectorAll('[data-upload-option]').forEach((button) => {
        const key = button.getAttribute('data-upload-option');
        const value = button.getAttribute('data-value');
        const active = this.state[key] === value;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    },

    updateHint() {
      const hint = document.querySelector('[data-upload-hint]');
      if (!hint) return;
      hint.textContent = LanguageManager.t(`upload.hint.${this.state.analysis}`);
    },

    addChip(text) {
      const input = document.querySelector('[data-upload-context]');
      if (!input) return;
      const current = input.value.trim();
      input.value = current ? `${current}\n${text}` : text;
      input.focus();
      this.state.context = input.value.trim();
      this.persist();
    },

    openPicker() {
      const input = document.querySelector('[data-upload-input]');
      if (input) input.click();
    },

    getContext() {
      const input = document.querySelector('[data-upload-context]');
      return input ? input.value.trim() : this.state.context || '';
    },

    async handleImage(file) {
      if (!file) return;
      this.setStatus(LanguageManager.t('upload.statusPreparing'), 'loading');
      try {
        this.state.image = await this.prepareImage(file);
        this.persist();
        this.renderPreview();
        this.setStatus(LanguageManager.t('upload.statusReadyImage'), 'success');
      } catch (error) {
        this.state.image = null;
        this.persist();
        this.renderPreview();
        this.setStatus(error && error.message ? error.message : String(error), 'error');
      }
    },

    readFileAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error(LanguageManager.t('upload.readFailed')));
        reader.readAsDataURL(file);
      });
    },

    loadImage(dataUrl) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(LanguageManager.t('upload.openFailed')));
        img.src = dataUrl;
      });
    },

    estimateBase64Bytes(base64) {
      const clean = String(base64 || '').replace(/\s+/g, '');
      return Math.max(0, Math.floor(clean.length * 0.75));
    },

    async prepareImage(file) {
      const rawType = String(file.type || '').toLowerCase() === 'image/jpg' ? 'image/jpeg' : String(file.type || '').toLowerCase();
      if (!this.allowedTypes.has(rawType)) throw new Error(LanguageManager.t('upload.invalidType'));
      if (file.size > this.maxFileBytes) throw new Error(LanguageManager.t('upload.tooLarge'));
      const originalDataUrl = await this.readFileAsDataURL(file);
      const image = await this.loadImage(originalDataUrl);
      const originalWidth = image.naturalWidth || image.width;
      const originalHeight = image.naturalHeight || image.height;
      if (!originalWidth || !originalHeight) throw new Error(LanguageManager.t('upload.dimensionsFailed'));
      const scale = Math.min(1, this.maxEdge / Math.max(originalWidth, originalHeight));
      const width = Math.max(1, Math.round(originalWidth * scale));
      const height = Math.max(1, Math.round(originalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', this.jpegQuality);
      const base64 = dataUrl.split(',')[1] || '';
      if (!base64 || base64.length > this.maxBase64Chars) throw new Error(LanguageManager.t('upload.compressedTooLarge'));
      return {
        mimeType: 'image/jpeg',
        data: base64,
        name: file.name || 'attached-image.jpg',
        originalType: rawType,
        originalSize: file.size,
        size: this.estimateBase64Bytes(base64),
        width,
        height,
        originalWidth,
        originalHeight,
        previewDataUrl: dataUrl
      };
    },

    clearImage() {
      this.state.image = null;
      this.persist();
      this.renderPreview();
      this.setStatus(LanguageManager.t('upload.statusReady'), 'neutral');
    },

    renderPreview() {
      const node = document.querySelector('[data-upload-preview]');
      if (!node) return;
      const image = this.state.image;
      if (!image) {
        node.classList.remove('has-image');
        node.innerHTML = `<p>${escapeHtml(LanguageManager.t('upload.noImage'))}</p>`;
        return;
      }
      node.classList.add('has-image');
      node.innerHTML = `
        <img class="upload-image-thumb" src="${image.previewDataUrl}" alt="${escapeHtml(LanguageManager.t('upload.previewAlt'))}">
        <div class="upload-image-meta">
          <strong>${escapeHtml(image.name)}</strong>
          <span>${escapeHtml(`${image.width}×${image.height} · ${this.formatBytes(image.size)} compressed`)}</span>
        </div>
        <button type="button" class="upload-image-remove" data-upload-action="remove-image" aria-label="${escapeHtml(LanguageManager.t('upload.removeImage'))}">×</button>`;
    },

    formatBytes(bytes) {
      const n = Number(bytes || 0);
      if (n < 1024) return `${n} B`;
      if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
      return `${(n / (1024 * 1024)).toFixed(2)} MB`;
    },

    async submit() {
      if (this.busy) return;
      if (!this.state.image) {
        this.setStatus(LanguageManager.t('upload.statusMissingImage'), 'error');
        this.openPicker();
        return;
      }
      this.state.context = this.getContext();
      this.setBusy(true);
      this.state.answer = '';
      this.renderAnswer('', { loading: true });
      this.setStatus(LanguageManager.t('upload.statusGenerating'), 'loading');
      try {
        const result = await WorkerAPI.analyzeImage(this.state, {
          onDelta: (_delta, partial) => {
            this.setStatus(LanguageManager.t('upload.statusStreaming'), 'loading');
            this.renderAnswer(AIResponsePipeline.finalize(partial), { streaming: true });
          },
          onFinal: (finalized) => this.renderAnswer(finalized, { streaming: false })
        });
        this.state.answer = result.answer;
        this.persist();
        safeLocalStorageSet(CONFIG.storageKeys.lastImageAnalysisAnswer, JSON.stringify({ answer: result.answer, at: new Date().toISOString(), kbConfidence: result.kb.confidence, kbConfidenceScore: result.kb.confidenceScore }));
        this.renderAnswer(result.answer, { streaming: false });
        this.setStatus(LanguageManager.t('upload.statusApplied'), result.kb.confidence === 'low' ? 'warning' : 'success');
      } catch (error) {
        const message = error && error.name === 'AbortError' ? LanguageManager.t('upload.statusTimeout') : LanguageManager.t('upload.statusFailed');
        this.setStatus(`${message}${error && error.message && error.name !== 'AbortError' ? ` ${error.message}` : ''}`, 'error');
        this.renderAnswer(this.state.answer || '', { empty: !this.state.answer });
      } finally {
        this.setBusy(false);
      }
    },

    clear() {
      const input = document.querySelector('[data-upload-context]');
      if (input) input.value = '';
      this.state.context = '';
      this.state.image = null;
      this.state.answer = '';
      this.persist();
      this.renderPreview();
      this.renderAnswer('', { empty: true });
      this.setStatus(LanguageManager.t('upload.statusReady'), 'neutral');
    },

    async copyAnswer() {
      if (!this.state.answer) return;
      try {
        await navigator.clipboard.writeText(this.state.answer);
      } catch (_error) {
        const textarea = document.createElement('textarea');
        textarea.value = this.state.answer;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      this.setStatus(LanguageManager.t('upload.statusCopied'), 'success');
    },

    renderAnswer(answer, options = {}) {
      const node = document.querySelector('[data-upload-answer]');
      const copy = document.querySelector('[data-upload-action="copy"]');
      if (!node) return;
      if (options.loading) {
        node.innerHTML = '<div class="ask-ai-answer-loading"><span></span><span></span><span></span></div>';
      } else if (options.empty) {
        node.innerHTML = `<p>${escapeHtml(LanguageManager.t('upload.emptyAnswer'))}</p>`;
      } else {
        node.innerHTML = MarkdownRenderer.render(answer) + (options.streaming ? '<span class="ask-ai-cursor" aria-hidden="true"></span>' : '');
      }
      if (copy) copy.disabled = !String(answer || '').trim();
    },

    setBusy(isBusy) {
      this.busy = !!isBusy;
      document.querySelectorAll('[data-upload-action="submit"]').forEach((button) => {
        button.disabled = this.busy;
        button.classList.toggle('is-loading', this.busy);
      });
    },

    setStatus(message, tone = 'neutral') {
      const nodes = document.querySelectorAll('[data-upload-status], [data-upload-answer-status]');
      nodes.forEach((node) => {
        node.textContent = message || '';
        node.className = node.hasAttribute('data-upload-answer-status') ? `ask-ai-status ask-ai-status--${tone}` : `upload-image-status upload-image-status--${tone}`;
      });
    }
  };

  const WorkerAdminAPI = {
    authHeader(password) {
      return { Authorization: 'Bearer ' + String(password || '').trim() };
    },

    async request(path, options = {}) {
      const response = await fetch(CONFIG.workerUrl + path, options);
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Admin request failed (${response.status}): ${body.slice(0, 300)}`);
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) return response.json();
      return response.text();
    },

    getMenu() {
      return this.request('/menu', { method: 'GET' });
    },

    getContent() {
      return this.request('/content', { method: 'GET' });
    },

    saveMenu(menu, password) {
      return this.request('/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.authHeader(password) },
        body: JSON.stringify(menu)
      });
    },

    saveContent(content, password) {
      return this.request('/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.authHeader(password) },
        body: JSON.stringify(content)
      });
    },

    savePane(pane, password) {
      return this.request('/admin/pane', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.authHeader(password) },
        body: JSON.stringify(pane)
      });
    },

    resetPane(paneId, password) {
      return this.request('/admin/pane/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.authHeader(password) },
        body: JSON.stringify({ paneId })
      });
    }
  };


  const TicketWorkflow = {
    busy: false,

    init() {
      window.addEventListener('sugo:ticketcreate', (event) => {
        this.handleCreate(event.detail).catch((error) => this.handleError(error));
      });
      window.addEventListener('sugo:ticketcancel', () => this.handleCancel());
    },

    async handleCreate(ticketState) {
      if (this.busy) return;
      const validation = TicketDetailsForm.validateRequired({ mark: true });
      if (!validation.valid) {
        this.setStatus(LanguageManager.t('ticket.workflow.validationError'), 'error');
        const first = validation.missing[0];
        const node = document.querySelector(`[data-ticket-field="${first}"]`);
        if (node) node.focus({ preventScroll: false });
        return;
      }
      this.setBusy(true);
      this.setStatus(LanguageManager.t('ticket.workflow.generating'), 'loading');
      const state = ticketState || TicketPreview.collectState();
      const result = await WorkerAPI.createTicketDraft(state);
      SmartTicketBridge.applyTicketAnswer(result.answer, { state, kb: result.kb, responseData: result.responseData });
      safeLocalStorageSet(CONFIG.storageKeys.lastTicketAiDraft, JSON.stringify({ answer: result.answer, at: new Date().toISOString(), kbConfidence: result.kb.confidence, kbConfidenceScore: result.kb.confidenceScore }));
      this.setBusy(false);
      this.setStatus(result.kb.confidence === 'low' ? LanguageManager.t('ticket.workflow.kbLow') : LanguageManager.t('ticket.workflow.applied'), result.kb.confidence === 'low' ? 'warning' : 'success');
    },

    handleCancel() {
      TicketTypeSelector.set('it-support', { silent: true });
      TicketDetailsForm.reset({ silent: true });
      TicketAttachments.files = [];
      TicketAttachments.persistMetadata();
      TicketAttachments.render();
      TicketAttachments.emitChange();
      TicketPreview.render();
      this.setStatus(LanguageManager.t('ticket.workflow.cancelled'), 'success');
    },

    handleError(error) {
      this.setBusy(false);
      const message = error && error.name === 'AbortError' ? LanguageManager.t('ticket.workflow.timeout') : LanguageManager.t('ticket.workflow.failed');
      this.setStatus(`${message}${error && error.message && error.name !== 'AbortError' ? ` ${error.message}` : ''}`, 'error');
    },

    setBusy(isBusy) {
      this.busy = !!isBusy;
      const button = document.querySelector('[data-ticket-action="create"]');
      if (button) {
        button.disabled = this.busy;
        button.classList.toggle('is-loading', this.busy);
      }
    },

    setStatus(message, tone = 'neutral') {
      const node = document.querySelector('[data-ticket-ai-status]');
      if (!node) return;
      node.hidden = !message;
      node.textContent = message || '';
      node.className = `ticket-ai-status ticket-ai-status--${tone}`;
    }
  };

  SmartTicketBridge.applyTicketAnswer = function applyTicketAnswer(answer, meta = {}) {
    const current = TicketDetailsForm.getState();
    const lines = String(answer || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const firstMeaningful = lines.find((line) => !/^(dear|hello|hi|welcome|مرحب|عزيزي|أهلاً)/i.test(line)) || lines[0] || current.subject;
    const inferredSubject = current.subject || firstMeaningful.replace(/^#+\s*/, '').slice(0, 140);
    const lower = `${current.subject}\n${current.description}\n${answer}`.toLowerCase();
    const inferredCategory = current.category || (/(login|password|account|حساب|دخول|كلمة)/.test(lower) ? 'account-access'
      : /(network|internet|vpn|connect|sync|انترنت|شبكة)/.test(lower) ? 'network-connectivity'
        : /(email|outlook|mail|teams|بريد)/.test(lower) ? 'email-collaboration'
          : /(device|printer|hardware|طابعة|جهاز)/.test(lower) ? 'hardware-devices'
            : /(software|application|app|تطبيق|برنامج)/.test(lower) ? 'software-applications' : 'other');

    this.applyDraft({
      ticketType: meta.state ? meta.state.ticketType : TicketTypeSelector.current,
      subject: inferredSubject,
      urgency: current.urgency || 'high',
      category: inferredCategory,
      affects: current.affects,
      location: current.location,
      contact: current.contact,
      description: answer
    });

    window.SUGO_SMART_TICKET_BUILDER_STATE = {
      ...(window.SUGO_SMART_TICKET_BUILDER_STATE || {}),
      source: 'phase-13-worker-ticket-bridge',
      status: 'ai-ticket-output-applied',
      answer,
      kbConfidence: meta.kb ? meta.kb.confidence : undefined,
      kbConfidenceScore: meta.kb ? meta.kb.confidenceScore : undefined,
      appliedAt: new Date().toISOString()
    };
  };



  const PlaceholderScreens = {
    routes: ['service-catalog', 'my-tickets', 'approvals', 'announcements', 'help-support'],

    definitions: {
      'service-catalog': {
        titleKey: 'placeholder.serviceCatalog.title',
        subtitleKey: 'placeholder.serviceCatalog.subtitle',
        cards: ['placeholder.serviceCatalog.card1', 'placeholder.serviceCatalog.card2'],
        icon: '<svg viewBox="0 0 24 24" focusable="false"><path d="M5.2 7.2 12 3.8l6.8 3.4v9.6L12 20.2l-6.8-3.4V7.2Zm3.1 1.6 3.7 1.9 3.7-1.9M12 10.7v5.9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      },
      'my-tickets': {
        titleKey: 'placeholder.myTickets.title',
        subtitleKey: 'placeholder.myTickets.subtitle',
        cards: ['placeholder.myTickets.card1', 'placeholder.myTickets.card2'],
        icon: '<svg viewBox="0 0 24 24" focusable="false"><path d="M6.4 4.8h11.2a1.6 1.6 0 0 1 1.6 1.6v2.4a2.1 2.1 0 0 0 0 4.2v4.6a1.6 1.6 0 0 1-1.6 1.6H6.4a1.6 1.6 0 0 1-1.6-1.6V13a2.1 2.1 0 0 0 0-4.2V6.4a1.6 1.6 0 0 1 1.6-1.6Z" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      },
      approvals: {
        titleKey: 'placeholder.approvals.title',
        subtitleKey: 'placeholder.approvals.subtitle',
        cards: ['placeholder.approvals.card1', 'placeholder.approvals.card2'],
        icon: '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 21a8.8 8.8 0 1 0 0-17.6A8.8 8.8 0 0 0 12 21Zm-3.7-8.9 2.4 2.4 5-5" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      },
      announcements: {
        titleKey: 'placeholder.announcements.title',
        subtitleKey: 'placeholder.announcements.subtitle',
        cards: ['placeholder.announcements.card1', 'placeholder.announcements.card2'],
        icon: '<svg viewBox="0 0 24 24" focusable="false"><path d="M5.3 13.8 4 15.1V8.9l1.3 1.3 10.2-4.6v12.8L5.3 13.8Zm10.2-1.2 3.4 1.5a2.2 2.2 0 0 0 0-4l-3.4 1.5M7.4 14.7l1.8 4.3" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      },
      'help-support': {
        titleKey: 'placeholder.helpSupport.title',
        subtitleKey: 'placeholder.helpSupport.subtitle',
        cards: ['placeholder.helpSupport.card1', 'placeholder.helpSupport.card2'],
        icon: '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 20.6a8.6 8.6 0 1 0 0-17.2 8.6 8.6 0 0 0 0 17.2Zm-2.1-10.7a2.3 2.3 0 1 1 3.8 1.7c-.8.6-1.7 1.2-1.7 2.5m0 3h.1" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      }
    },

    init() {
      window.addEventListener('sugo:sidebarmenuchange', (event) => {
        const menu = event.detail && event.detail.menu;
        if (!this.isPlaceholderRoute(menu)) return;
        WorkspaceState.set(menu);
      });

      window.addEventListener('sugo:workspacechange', (event) => {
        const workspace = event.detail && event.detail.workspace;
        if (this.isPlaceholderRoute(workspace)) this.render(workspace);
      });

      window.addEventListener('sugo:languagechange', () => {
        if (this.isPlaceholderRoute(WorkspaceState.current)) this.render(WorkspaceState.current);
      });

      if (this.isPlaceholderRoute(WorkspaceState.current)) this.render(WorkspaceState.current);
    },

    isPlaceholderRoute(route) {
      return this.routes.includes(route);
    },

    getScreen(route) {
      const def = this.definitions[route];
      if (!def) return null;
      return {
        route,
        title: () => LanguageManager.t(def.titleKey),
        subtitle: () => LanguageManager.t(def.subtitleKey),
        cards: def.cards,
        icon: def.icon
      };
    },

    render(route) {
      const screen = this.getScreen(route) || this.getScreen('service-catalog');
      if (!screen) return;

      const title = document.querySelector('[data-placeholder-title]');
      const subtitle = document.querySelector('[data-placeholder-subtitle]');
      const icon = document.querySelector('[data-placeholder-icon]');
      const cards = document.querySelector('[data-placeholder-cards]');
      const metaRoute = document.querySelector('[data-placeholder-meta-route]');

      if (title) title.textContent = screen.title();
      if (subtitle) subtitle.textContent = screen.subtitle();
      if (icon) icon.innerHTML = screen.icon;
      if (metaRoute) metaRoute.textContent = screen.title();
      if (cards) {
        const rows = [
          { label: 'placeholder.card.status', body: 'placeholder.status.placeholder' },
          { label: 'placeholder.card.data', body: 'placeholder.data.none' },
          { label: 'placeholder.card.action', body: 'placeholder.action.return' },
          { label: screen.cards[0], body: screen.cards[1] }
        ];
        cards.innerHTML = rows.map((row) => `<article class="placeholder-info-card">
          <span class="placeholder-info-card__label">${escapeHtml(LanguageManager.t(row.label))}</span>
          <p>${escapeHtml(LanguageManager.t(row.body))}</p>
        </article>`).join('');
      }
    }
  };

  SUGO.config = CONFIG;
  SUGO.dom = dom;
  SUGO.language = LanguageManager;
  SUGO.workspace = WorkspaceState;
  SUGO.sidebarTopControls = SidebarTopControls;
  SUGO.favoritesRecent = FavoritesRecent;
  SUGO.sidebarNavigation = SidebarNavigation;
  SUGO.knowledgeTree = KnowledgeTree;
  SUGO.ticketTypeSelector = TicketTypeSelector;
  SUGO.ticketDetailsForm = TicketDetailsForm;
  SUGO.ticketAttachments = TicketAttachments;
  SUGO.ticketPreview = TicketPreview;
  SUGO.smartTicketBuilder = SmartTicketBridge;
  SUGO.knowledgeBaseMatcher = KnowledgeBaseMatcher;
  SUGO.globalSearch = GlobalSearch;
  SUGO.knowledgeArticleView = KnowledgeArticleView;
  SUGO.aiResponsePipeline = AIResponsePipeline;
  SUGO.markdownRenderer = MarkdownRenderer;
  SUGO.workerAPI = WorkerAPI;
  SUGO.workerAdminAPI = WorkerAdminAPI;
  SUGO.askAIConsole = AskAIConsole;
  SUGO.uploadImageConsole = UploadImageConsole;
  SUGO.placeholderScreens = PlaceholderScreens;
  SUGO.ticketWorkflow = TicketWorkflow;

  document.addEventListener('DOMContentLoaded', function () {
    LanguageManager.init();
    WorkspaceState.init();
    SidebarTopControls.init();
    FavoritesRecent.init();
    SidebarNavigation.init();
    KnowledgeTree.init();
    GlobalSearch.init();
    KnowledgeArticleView.init();
    TicketTypeSelector.init();
    TicketDetailsForm.init();
    TicketAttachments.init();
    TicketPreview.init();
    AskAIConsole.init();
    UploadImageConsole.init();
    PlaceholderScreens.init();
    SmartTicketBridge.init();
    TicketWorkflow.init();
    dom.root.dataset.ready = 'true';
  });
})();
