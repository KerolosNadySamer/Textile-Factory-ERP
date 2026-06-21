import { useEffect, useMemo, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import useLanguage from '@/lib/useLanguage';

const labels = {
    ar: {
        title: 'مساعد النظام',
        subtitle: 'مستشار تشغيل بنمط القراءة فقط',
        open: 'فتح مساعد النظام',
        close: 'إغلاق',
        minimize: 'تصغير',
        guide: 'الدليل',
        today: 'اليوم',
        health: 'الفحص',
        pilot: 'التشغيل',
        feedback: 'الملاحظات',
        askPlaceholder: 'اسأل عن شاشة، إجراء، صلاحية، أو تقرير...',
        send: 'إرسال',
        listen: 'استماع',
        stop: 'إيقاف',
        repeat: 'إعادة',
        voiceSpeed: 'سرعة الصوت',
        autoReadSummary: 'قراءة الملخص تلقائيًا',
        dailySummary: 'ملخص اليوم',
        summaryLoading: 'جاري تحميل ملخص اليوم...',
        summaryEmpty: 'لا يوجد ملخص متاح الآن.',
        readSummary: 'قراءة الملخص اليومي',
        todayDone: 'ما تم اليوم',
        todayPending: 'ما زال مطلوبًا',
        todayAlerts: 'تنبيهات',
        openRelatedScreen: 'فتح الشاشة',
        clear: 'مسح',
        copy: 'نسخ',
        copied: 'تم النسخ',
        export: 'تصدير',
        exportFindings: 'تقرير النتائج',
        findingsTitle: 'نتائج التشغيل التجريبي',
        findingsIntro: 'تقرير مجمع من ملاحظات التشغيل داخل مساعد النظام.',
        search: 'بحث في الدليل',
        examples: 'أسئلة جاهزة',
        suggested: 'نتائج مقترحة',
        noResults: 'لا توجد نتائج مطابقة.',
        readOnly: 'قراءة وشرح فقط: لا إضافة، لا تعديل، لا حذف، لا اعتماد.',
        greeting: 'أهلا، أنا مساعد النظام. أشرح الشاشات والإجراءات والصلاحيات، وأساعدك في تسجيل ملاحظات التشغيل التجريبي بدون تغيير أي بيانات.',
        fallback: 'لم أجد إجابة دقيقة. اكتب اسم الشاشة أو الإجراء بشكل أوضح، أو سجّل ملاحظة تشغيل ليتم مراجعتها.',
        confidence: 'درجة الثقة',
        cause: 'السبب',
        impact: 'التأثير إذا لم تُحل',
        solutionSteps: 'خطوات الحل',
        priority: 'الأولوية',
        owner: 'المسؤول عن التنفيذ',
        rerunCheck: 'أعد تشغيل الفحص أو افتح ملخص اليوم للتأكد من اختفاء المشكلة.',
        liveFinding: 'نتيجة الفحص الحالية',
        liveFindingEmpty: 'لا توجد سجلات ظاهرة لك حاليًا لهذه المشكلة.',
        affectedItems: 'أول السجلات المتأثرة',
        totalAffected: 'إجمالي السجلات المتأثرة',
        currentPage: 'الشاشة الحالية',
        currentUser: 'المستخدم الحالي',
        role: 'الدور',
        permissions: 'الصلاحيات',
        visiblePermissions: 'أول صلاحيات ظاهرة',
        healthScore: 'مؤشر صحة التشغيل',
        healthIntro: 'فحص سريع غير تنفيذي يساعدك تعرف جاهزية التشغيل التجريبي من واجهة المستخدم الحالية.',
        good: 'جيد',
        review: 'يحتاج مراجعة',
        risky: 'يحتاج انتباه',
        languageReady: 'اللغة مفعّلة',
        accountReady: 'بيانات الحساب متاحة',
        permissionsReady: 'الصلاحيات محمّلة',
        pageAware: 'يتعرف على الشاشة الحالية',
        feedbackReady: 'تسجيل الملاحظات متاح',
        quickFeedbackTitle: 'تسجيل ملاحظة تشغيل',
        noteTitle: 'عنوان الملاحظة',
        feedbackType: 'النوع',
        findingCategory: 'تصنيف التقرير',
        severity: 'الأولوية',
        problem: 'مشكلة',
        suggestion: 'اقتراح',
        improvement: 'طلب تطوير',
        bugCategory: 'أخطاء',
        improvementCategory: 'تحسينات',
        userRequestCategory: 'طلبات المستخدمين',
        missingPermissionCategory: 'صلاحيات ناقصة',
        requiredReportCategory: 'تقارير مطلوبة',
        screenChangeCategory: 'شاشات تحتاج تعديل',
        low: 'منخفضة',
        medium: 'متوسطة',
        high: 'عالية',
        feedbackText: 'الملاحظة',
        feedbackPlaceholder: 'اكتب ما حدث، الشاشة، والخطوة التي كنت تنفذها...',
        feedbackSaved: 'تم حفظ الملاحظة محليا على هذا الجهاز.',
        savedNotes: 'آخر الملاحظات',
        noNotes: 'لا توجد ملاحظات محفوظة بعد.',
        page: 'الشاشة',
        date: 'التاريخ',
        localOnly: 'الحفظ الحالي محلي مؤقت إلى أن يتم ربط مركز الملاحظات بقاعدة البيانات.',
        pilotTitle: 'خطة التشغيل التجريبي',
        pilotIntro: 'خطة أسبوع داخلي لاختبار النظام ببيانات حقيقية داخل قاعدة Pilot منفصلة قبل الإنتاج.',
        pilotDatabase: 'قاعدة Pilot منفصلة',
        pilotDatabaseBody: 'استخدم قاعدة بيانات منفصلة مثل textile_erp_pilot ولا تخلطها مع textile_erp_production.',
        day: 'اليوم',
        done: 'تم',
        notDone: 'لم يتم',
    },
    en: {
        title: 'System Assistant',
        subtitle: 'Read-only operations advisor',
        open: 'Open System Assistant',
        close: 'Close',
        minimize: 'Minimize',
        guide: 'Guide',
        today: 'Today',
        health: 'Check',
        pilot: 'Pilot',
        feedback: 'Feedback',
        askPlaceholder: 'Ask about a screen, process, permission, or report...',
        send: 'Send',
        listen: 'Listen',
        stop: 'Stop',
        repeat: 'Repeat',
        voiceSpeed: 'Voice speed',
        autoReadSummary: 'Read summary automatically',
        dailySummary: 'Daily summary',
        summaryLoading: 'Loading today summary...',
        summaryEmpty: 'No summary is available now.',
        readSummary: 'Read daily summary',
        todayDone: 'Done today',
        todayPending: 'Still pending',
        todayAlerts: 'Alerts',
        openRelatedScreen: 'Open screen',
        clear: 'Clear',
        copy: 'Copy',
        copied: 'Copied',
        export: 'Export',
        exportFindings: 'Findings report',
        findingsTitle: 'Pilot Run Findings',
        findingsIntro: 'A report generated from pilot feedback recorded inside the System Assistant.',
        search: 'Search guide',
        examples: 'Suggested questions',
        suggested: 'Suggested matches',
        noResults: 'No matching results.',
        readOnly: 'Read and explain only: no create, edit, delete, or approval.',
        navigateOnly: 'The assistant only guides you to the right screen and never performs edits, deletes, or approvals.',
        stepScreen: 'Target screen',
        openStep: 'Open step',
        greeting: 'Hi, I am the System Assistant. I explain screens, workflows, and permissions, and help record pilot feedback without changing data.',
        fallback: 'I could not find a precise answer. Mention the screen or process more clearly, or record pilot feedback for review.',
        confidence: 'Confidence',
        cause: 'Cause',
        impact: 'Impact if unresolved',
        solutionSteps: 'Resolution steps',
        priority: 'Priority',
        owner: 'Responsible owner',
        rerunCheck: 'Run the check again or open Today summary to confirm the issue is gone.',
        liveFinding: 'Current live check',
        liveFindingEmpty: 'No visible records for this issue right now.',
        affectedItems: 'First affected records',
        totalAffected: 'Total affected records',
        currentPage: 'Current page',
        currentUser: 'Current user',
        role: 'Role',
        permissions: 'Permissions',
        visiblePermissions: 'First visible permissions',
        healthScore: 'Operation health score',
        healthIntro: 'A non-executive quick check that estimates pilot readiness from the current UI context.',
        good: 'Good',
        review: 'Review',
        risky: 'Needs attention',
        languageReady: 'Language is active',
        accountReady: 'Account data is available',
        permissionsReady: 'Permissions are loaded',
        pageAware: 'Current page is detected',
        feedbackReady: 'Feedback capture is available',
        quickFeedbackTitle: 'Record pilot feedback',
        noteTitle: 'Feedback title',
        feedbackType: 'Type',
        findingCategory: 'Report category',
        severity: 'Priority',
        problem: 'Problem',
        suggestion: 'Suggestion',
        improvement: 'Improvement request',
        bugCategory: 'Bugs',
        improvementCategory: 'Improvements',
        userRequestCategory: 'User requests',
        missingPermissionCategory: 'Missing permissions',
        requiredReportCategory: 'Required reports',
        screenChangeCategory: 'Screens needing changes',
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        feedbackText: 'Feedback',
        feedbackPlaceholder: 'Write what happened, the screen, and the step you were doing...',
        feedbackSaved: 'Feedback saved locally on this device.',
        savedNotes: 'Latest notes',
        noNotes: 'No saved notes yet.',
        page: 'Page',
        date: 'Date',
        localOnly: 'Current storage is temporary and local until the feedback center is connected to the database.',
        pilotTitle: 'Pilot operation plan',
        pilotIntro: 'A one-week internal plan to test the system with real working data inside a separate pilot database before production.',
        pilotDatabase: 'Separate pilot database',
        pilotDatabaseBody: 'Use a separate database such as textile_erp_pilot and do not mix it with textile_erp_production.',
        day: 'Day',
        done: 'Done',
        notDone: 'Pending',
    },
};

const pilotPlan = {
    ar: [
        ['1', ['إنشاء الأقسام الفعلية', 'تحديد الوظائف المعتمدة', 'إدخال الموظفين الحقيقيين']],
        ['2', ['إنشاء حسابات المستخدمين', 'اختبار الصلاحيات', 'اختبار تغيير المستخدم']],
        ['3', ['إدخال العملاء والموردين', 'اختبار الاستيراد من Excel', 'مراجعة الأكواد والتكويد']],
        ['4', ['إدخال الأصناف', 'اختبار التقارير', 'اختبار التصدير']],
        ['5', ['تجربة دورة التوظيف', 'تجربة الترقية والنقل', 'تجربة التقييمات']],
        ['6', ['تجربة الرواتب', 'تجربة الاعتمادات', 'تجربة الإشعارات']],
        ['7', ['تسجيل كل الملاحظات داخل المساعد', 'حصر المشاكل الفعلية', 'تحديد أولويات الإصلاح']],
    ],
    en: [
        ['1', ['Create actual departments', 'Confirm approved positions', 'Enter real employees']],
        ['2', ['Create user accounts', 'Test permissions', 'Test Switch User']],
        ['3', ['Enter customers and suppliers', 'Test Excel imports', 'Review codes and coding']],
        ['4', ['Enter products', 'Test reports', 'Test exports']],
        ['5', ['Test recruitment flow', 'Test promotion and transfer', 'Test reviews']],
        ['6', ['Test payroll', 'Test approvals', 'Test notifications']],
        ['7', ['Record all feedback in the assistant', 'List actual issues', 'Prioritize fixes']],
    ],
};

const findingCategories = [
    { value: 'bugs', labelKey: 'bugCategory' },
    { value: 'improvements', labelKey: 'improvementCategory' },
    { value: 'user_requests', labelKey: 'userRequestCategory' },
    { value: 'missing_permissions', labelKey: 'missingPermissionCategory' },
    { value: 'required_reports', labelKey: 'requiredReportCategory' },
    { value: 'screen_changes', labelKey: 'screenChangeCategory' },
];

const problemAnalyses = {
    ar: [
        {
            key: 'employees_without_position',
            title: 'موظف بدون وظيفة',
            keywords: ['موظف بدون وظيفة', 'بدون وظيفة', 'غير مربوط بوظيفة', 'employee without position', 'missing position'],
            cause: 'تم إنشاء الموظف أو استيراده ولم يتم ربطه بوظيفة معتمدة داخل قسمه.',
            impact: 'لن يتم احتساب التغطية الوظيفية بشكل صحيح، وقد تظهر شواغر غير حقيقية أو موظفون خارج الهيكل.',
            steps: ['افتح شاشة الموظفين.', 'افتح بطاقة الموظف.', 'اختر القسم والوظيفة المعتمدة المناسبة.', 'احفظ التعديل.', 'أعد تشغيل فحص التغطية أو افتح ملخص اليوم.'],
            priority: 'عالية عند التشغيل التجريبي.',
            owner: 'HR أو مسؤول الهيكل الوظيفي.',
        },
        {
            key: 'departments_without_manager',
            title: 'قسم بدون مدير',
            keywords: ['قسم بدون مدير', 'لا يوجد مدير', 'department without manager', 'missing manager'],
            cause: 'القسم موجود في الهيكل لكن لا يوجد مستخدم أو موظف مرتبط بدور مدير القسم.',
            impact: 'طلبات التوظيف أو الاعتمادات أو التنبيهات الخاصة بالقسم قد لا تصل لصاحب قرار واضح.',
            steps: ['افتح شاشة الأقسام أو الهيكل التنظيمي.', 'راجع القسم الذي يظهر في التنبيه.', 'اربط مدير القسم أو حدّث وظيفة المدير الحالية.', 'راجع صلاحيات المدير.', 'أعد تشغيل الفحص.'],
            priority: 'عالية.',
            owner: 'الإدارة العامة أو HR.',
        },
        {
            key: 'employees_without_manager',
            title: 'موظفون بدون مدير مباشر',
            keywords: ['موظف بدون مدير', 'موظفين بدون مدير', 'بدون مدير مباشر', 'employee without manager', 'missing direct manager'],
            cause: 'الموظف نشط داخل النظام لكن حقل المدير المباشر غير محدد في بطاقة الموظف.',
            impact: 'قد لا تصل التقييمات أو الاعتمادات أو المتابعات اليومية للمدير الصحيح.',
            steps: ['افتح شاشة الموظفين.', 'افتح بطاقة الموظف المتأثر.', 'اختر المدير المباشر الصحيح.', 'احفظ التعديل.', 'راجع التقييمات أو طلبات الاعتماد المرتبطة به.'],
            priority: 'متوسطة إلى عالية حسب دور الموظف.',
            owner: 'HR أو مدير القسم.',
        },
        {
            key: 'delayed_recruitment_requests',
            title: 'طلب توظيف متأخر',
            keywords: ['طلب توظيف متأخر', 'توظيف متأخر', 'recruitment delayed', 'late hiring request'],
            cause: 'طلب التوظيف لم يتحرك للمرحلة التالية خلال المدة المتوقعة أو ينتظر اعتمادًا من دور محدد.',
            impact: 'قد تظل الوظيفة شاغرة وتظهر فجوة في تغطية القسم أو خطة الإنتاج.',
            steps: ['افتح طلبات الموظفين الجدد.', 'افتح الطلب المتأخر.', 'راجع المرحلة الحالية والمسؤول عنها.', 'نفّذ الاعتماد أو أعد الطلب للتعديل حسب الصلاحية.', 'سجل ملاحظة تشغيل إذا كان سبب التأخير غير واضح.'],
            priority: 'متوسطة إلى عالية حسب الوظيفة.',
            owner: 'HR وصاحب الاعتماد الحالي.',
        },
        {
            key: 'payroll_pending_approval',
            title: 'راتب بانتظار اعتماد',
            keywords: ['راتب بانتظار اعتماد', 'رواتب بانتظار اعتماد', 'payroll pending approval', 'salary approval'],
            cause: 'دفعة الرواتب وصلت لمرحلة اعتماد ولم يتم تنفيذ القرار من صاحب الصلاحية.',
            impact: 'قد يتأخر إقفال الرواتب أو تظهر أرقام غير نهائية في التقارير المالية.',
            steps: ['افتح شاشة الرواتب.', 'حدد دفعة الرواتب المعلقة.', 'راجع المرحلة الحالية والمبالغ.', 'اطلب من صاحب الصلاحية الاعتماد أو الرفض.', 'أعد فتح ملخص اليوم للتأكد من اختفاء التنبيه.'],
            priority: 'عالية قرب موعد الصرف.',
            owner: 'الحسابات أو المدير العام حسب المرحلة.',
        },
        {
            key: 'delayed_reviews',
            title: 'تقييم متأخر',
            keywords: ['تقييم متأخر', 'تقييمات متأخرة', 'late review', 'delayed evaluation'],
            cause: 'تقييم شهري أو دوري لم يتم تسجيله أو اعتماده في موعده.',
            impact: 'قد تتأثر قرارات الترقيات والتعاقب والزيادات لأن بيانات الأداء غير مكتملة.',
            steps: ['افتح شاشة التقييمات.', 'حدد الموظف أو الشهر المتأخر.', 'أكمل التقييم أو اطلبه من المدير المسؤول.', 'احفظ أو اعتمد حسب الصلاحية.', 'راجع شاشة المسار الوظيفي إذا كان التقييم مؤثرًا على ترشيح.'],
            priority: 'متوسطة.',
            owner: 'المدير المباشر أو HR.',
        },
        {
            key: 'inactive_accounts',
            title: 'حساب غير مفعل',
            keywords: ['حساب غير مفعل', 'مستخدم غير مفعل', 'inactive account', 'disabled user'],
            cause: 'تم إنشاء المستخدم لكن لم يتم تفعيل الحساب أو ربطه بدور وصلاحيات تشغيلية.',
            impact: 'لن يستطيع المستخدم تنفيذ مهامه وقد تتوقف خطوات تعتمد على دوره داخل الدورة التشغيلية.',
            steps: ['افتح شاشة المستخدمين.', 'ابحث عن الحساب غير المفعل.', 'راجع البريد والدور والموظف المرتبط.', 'فعّل الحساب وراجع الصلاحيات.', 'اطلب من المستخدم تسجيل الدخول للتأكد.'],
            priority: 'عالية إذا كان المستخدم ضمن دورة اعتماد.',
            owner: 'مسؤول النظام أو HR.',
        },
        {
            key: 'incomplete_data',
            title: 'بيانات ناقصة',
            keywords: ['بيانات ناقصة', 'حقول ناقصة', 'missing data', 'incomplete data'],
            cause: 'سجل أساسي تم حفظه أو استيراده بدون كل البيانات المطلوبة للتشغيل أو التقارير.',
            impact: 'قد تظهر تقارير غير دقيقة أو تتوقف عمليات لاحقة بسبب نقص بيانات الربط أو الأكواد.',
            steps: ['افتح الشاشة المذكورة في التنبيه.', 'افتح السجل صاحب البيانات الناقصة.', 'راجع الحقول الأساسية مثل القسم، الوظيفة، الكود، الحالة، أو المسؤول.', 'أكمل البيانات واحفظ.', 'أعد التصدير أو الفحص إذا كان التنبيه مرتبطًا بتقرير.'],
            priority: 'متوسطة، وتصبح عالية إذا أثرت على الرواتب أو الاعتمادات.',
            owner: 'مالك البيانات في القسم المختص.',
        },
        {
            key: 'department_staffing_screen_error',
            title: 'إعدادات توزيع الأقسام لا تعمل',
            keywords: ['اعدادات توزيع الاقسام', 'إعدادات توزيع الأقسام', 'توزيع الاقسام لا يعمل', 'توزيع الأقسام لا يعمل', 'department staffing not working', 'department distribution error'],
            cause: 'غالبًا يوجد خطأ واجهة داخل شاشة إعداد وتوزيع الأقسام أو رابط داخل البطاقة يعتمد على بيانات غير محملة.',
            impact: 'لن يستطيع HR أو الإدارة تعديل هيكل الأقسام أو الأعداد المعتمدة، وقد تتأثر تغطية الوظائف وتكويد الموظفين.',
            steps: ['افتح شاشة إعداد وتوزيع الأقسام مرة أخرى.', 'إذا ظهرت شاشة بيضاء أو لم تستجب، حدّث الصفحة بعد آخر إصلاح.', 'راجع بطاقة القسم التي كانت تتعطل عندها الشاشة.', 'جرّب فتح رابط تكويد الموظفين أو التصدير من نفس البطاقة.', 'إذا تكرر العطل، سجّل ملاحظة تشغيل من تبويب الملاحظات باسم الشاشة والقسم المتأثر.'],
            priority: 'عالية قبل التشغيل التجريبي لأنها تؤثر على الهيكل والتغطية.',
            owner: 'مسؤول النظام مع HR.',
        },
    ],
    en: [
        {
            key: 'employees_without_position',
            title: 'Employee without position',
            keywords: ['employee without position', 'missing position', 'unassigned position', 'موظف بدون وظيفة'],
            cause: 'The employee was created or imported without being linked to an approved position inside the department.',
            impact: 'Position coverage will be inaccurate, and the system may show false vacancies or employees outside the structure.',
            steps: ['Open Employees.', 'Open the employee profile.', 'Select the correct department and approved position.', 'Save the change.', 'Run the coverage check again or open Today summary.'],
            priority: 'High during pilot operation.',
            owner: 'HR or the position structure owner.',
        },
        {
            key: 'departments_without_manager',
            title: 'Department without manager',
            keywords: ['department without manager', 'missing manager', 'قسم بدون مدير'],
            cause: 'The department exists in the structure but no user or employee is assigned as its manager.',
            impact: 'Department requests, approvals, or alerts may not reach a clear decision owner.',
            steps: ['Open Departments or Organization Structure.', 'Review the department shown in the alert.', 'Assign the department manager or update the current manager position.', 'Review manager permissions.', 'Run the check again.'],
            priority: 'High.',
            owner: 'General management or HR.',
        },
        {
            key: 'employees_without_manager',
            title: 'Employees without direct manager',
            keywords: ['employee without manager', 'employees without manager', 'missing direct manager', 'موظف بدون مدير'],
            cause: 'The employee is active, but the direct manager field is not set on the employee profile.',
            impact: 'Reviews, approvals, and daily follow-up may not reach the correct manager.',
            steps: ['Open Users or Employees.', 'Open the affected employee profile.', 'Select the correct direct manager.', 'Save the change.', 'Review related evaluations or approval requests.'],
            priority: 'Medium to high depending on the employee role.',
            owner: 'HR or department manager.',
        },
        {
            key: 'delayed_recruitment_requests',
            title: 'Delayed recruitment request',
            keywords: ['delayed recruitment request', 'late hiring request', 'recruitment delayed', 'طلب توظيف متأخر'],
            cause: 'The request has not moved to the next stage within the expected time or is waiting for approval by a specific role.',
            impact: 'The position may remain vacant and create a coverage gap in the department or production plan.',
            steps: ['Open New Employee Requests.', 'Open the delayed request.', 'Review the current stage and owner.', 'Approve, reject, or return it for edits according to permission.', 'Record pilot feedback if the delay reason is unclear.'],
            priority: 'Medium to high depending on the position.',
            owner: 'HR and the current approver.',
        },
        {
            key: 'payroll_pending_approval',
            title: 'Payroll pending approval',
            keywords: ['payroll pending approval', 'salary approval', 'راتب بانتظار اعتماد', 'رواتب بانتظار اعتماد'],
            cause: 'The payroll batch reached an approval stage and the responsible approver has not made a decision yet.',
            impact: 'Payroll closing may be delayed, and finance reports may show non-final numbers.',
            steps: ['Open Payroll.', 'Select the pending payroll batch.', 'Review the current stage and amounts.', 'Ask the authorized user to approve or reject.', 'Open Today summary again to confirm the alert is gone.'],
            priority: 'High near payment date.',
            owner: 'Finance or general manager depending on stage.',
        },
        {
            key: 'delayed_reviews',
            title: 'Delayed evaluation',
            keywords: ['delayed evaluation', 'late review', 'late evaluation', 'تقييم متأخر'],
            cause: 'A monthly or periodic evaluation has not been recorded or approved on time.',
            impact: 'Promotion, succession, and raise decisions may be affected because performance data is incomplete.',
            steps: ['Open Evaluations.', 'Select the delayed employee or month.', 'Complete the review or request it from the responsible manager.', 'Save or approve according to permission.', 'Review Career & Succession if the evaluation affects a nomination.'],
            priority: 'Medium.',
            owner: 'Direct manager or HR.',
        },
        {
            key: 'inactive_accounts',
            title: 'Inactive account',
            keywords: ['inactive account', 'disabled user', 'account not active', 'حساب غير مفعل'],
            cause: 'The user was created but the account was not activated or linked to an operational role and permissions.',
            impact: 'The user cannot perform assigned work, and steps depending on that role may stop.',
            steps: ['Open Users.', 'Find the inactive account.', 'Review email, role, and linked employee.', 'Activate the account and review permissions.', 'Ask the user to sign in to confirm access.'],
            priority: 'High if the user participates in approvals.',
            owner: 'System admin or HR.',
        },
        {
            key: 'incomplete_data',
            title: 'Incomplete data',
            keywords: ['incomplete data', 'missing data', 'missing fields', 'بيانات ناقصة'],
            cause: 'A master record was saved or imported without all data needed for operation or reporting.',
            impact: 'Reports may be inaccurate or later workflows may fail because codes or links are missing.',
            steps: ['Open the screen mentioned in the alert.', 'Open the record with missing data.', 'Review core fields such as department, position, code, status, or owner.', 'Complete the data and save.', 'Run the check or export again if the alert is report-related.'],
            priority: 'Medium, high if it affects payroll or approvals.',
            owner: 'The data owner in the relevant department.',
        },
        {
            key: 'department_staffing_screen_error',
            title: 'Department staffing settings are not working',
            keywords: ['department staffing not working', 'department distribution error', 'staffing settings error', 'إعدادات توزيع الأقسام'],
            cause: 'There is likely a frontend error in Department Staffing, or a card link depends on data that was not loaded.',
            impact: 'HR or management may be unable to edit department structure or approved headcount, affecting position coverage and employee coding.',
            steps: ['Open Department Staffing again.', 'If the page was blank or unresponsive, refresh after the latest fix.', 'Review the department card that caused the failure.', 'Try the employee coding and export links from the same card.', 'If it happens again, record pilot feedback with the screen name and affected department.'],
            priority: 'High before pilot because it affects structure and coverage.',
            owner: 'System admin with HR.',
        },
    ],
};

const knowledge = {
    ar: [
        {
            category: 'العملاء',
            title: 'كيف أضيف عميل؟',
            keywords: ['عميل', 'عملاء', 'customer', 'client', 'اضافة عميل', 'إضافة عميل'],
            answer: 'افتح الملفات الأساسية ثم العملاء. إذا ظهرت لك صلاحية الإضافة، اضغط إضافة عميل جديد، أدخل البيانات المطلوبة، ثم احفظ. الاعتماد أو الرفض يظهر حسب صلاحيات مراجعة بيانات العملاء.',
        },
        {
            category: 'الموردون',
            title: 'كيف أضيف مورد؟',
            keywords: ['مورد', 'موردين', 'supplier', 'vendor', 'اضافة مورد', 'إضافة مورد'],
            answer: 'افتح المشتريات ثم قسم الموردين. أدخل بيانات المورد الأساسية مثل الاسم والكود والبيانات الضريبية ثم احفظ. أي تعديل مهم يجب أن يمر عبر الصلاحيات المخصصة.',
        },
        {
            category: 'الموارد البشرية',
            title: 'كيف أطلب موظف جديد؟',
            keywords: ['موظف جديد', 'طلب توظيف', 'توظيف', 'hiring', 'recruitment', 'headcount'],
            answer: 'افتح الإدارة والنظام ثم طلبات موظفين جدد. أنشئ الطلب، اختر القسم والوظيفة والعدد المطلوب، ثم أرسله للاعتماد حسب دورة الموافقات.',
        },
        {
            category: 'الموارد البشرية',
            title: 'كيف أتابع الترقيات؟',
            keywords: ['ترقية', 'ترقيات', 'مسار وظيفي', 'تعاقب', 'promotion', 'succession'],
            answer: 'افتح الإدارة والنظام ثم المسار الوظيفي والتعاقب. من هناك يمكنك متابعة الترشيحات وخطط التعاقب. الاعتماد يتم فقط للمستخدم صاحب الصلاحية المناسبة.',
        },
        {
            category: 'الرواتب',
            title: 'كيف أعتمد الرواتب؟',
            keywords: ['رواتب', 'راتب', 'payroll', 'salary', 'اعتماد الرواتب'],
            answer: 'افتح الإدارة والنظام ثم الرواتب. دورة الرواتب تمر بمراجعة الحسابات أو HR ثم اعتماد المدير العام حسب المرحلة. إذا لم يظهر زر الاعتماد فغالبا لا تملك الصلاحية المطلوبة لهذه المرحلة.',
        },
        {
            category: 'التقارير',
            title: 'أين أجد تقارير المبيعات؟',
            keywords: ['تقرير', 'تقارير', 'مبيعات', 'sales report', 'تحليل البيانات'],
            answer: 'افتح الإدارة والنظام ثم تحليل البيانات. ستجد تحليلات مثل المبيعات حسب العميل، المبيعات حسب الصنف، والمبيعات الشهرية. يمكن أيضا استخدام البحث العام باسم التقرير.',
        },
        {
            category: 'الصلاحيات',
            title: 'لماذا لا أستطيع تنفيذ إجراء؟',
            keywords: ['صلاحية', 'صلاحيات', 'لا أستطيع', 'زر مش ظاهر', 'permission', 'access', 'cannot'],
            answer: 'الإجراء يظهر حسب دورك وصلاحياتك. راجع شاشة صلاحياتي من قائمة المستخدم. إذا كانت الصلاحية غير موجودة، اطلب من الإدارة مراجعة الدور بدلا من تنفيذ الإجراء من حساب آخر.',
        },
        {
            category: 'التشغيل التجريبي',
            title: 'كيف أسجل مشكلة أثناء التشغيل التجريبي؟',
            keywords: ['ملاحظة', 'مشكلة', 'اقتراح', 'feedback', 'pilot', 'تشغيل تجريبي'],
            answer: 'افتح تبويب الملاحظات داخل هذه النافذة، اختر النوع والأولوية، واكتب وصفا مختصرا لما حدث. سيتم حفظها محليا الآن إلى أن يتم ربط مركز الملاحظات بقاعدة البيانات.',
        },
        {
            category: 'المخازن',
            title: 'أين أراجع حركة المخزون؟',
            keywords: ['مخزون', 'دفتر حركة', 'inventory', 'ledger', 'حركة المخزون'],
            answer: 'افتح المخازن والتتبع ثم دفتر حركة المخزون. هذه الشاشة تعرض حركات الصرف والاستلام والتسويات حسب الصلاحيات المتاحة لك.',
        },
        {
            category: 'المشتريات',
            title: 'كيف أتابع أوامر الشراء؟',
            keywords: ['شراء', 'مشتريات', 'purchase', 'po', 'goods receipt', 'استلام'],
            answer: 'افتح المخازن والتتبع ثم المشتريات. ستجد طلبات الشراء وأوامر الشراء وأذون الاستلام، وكل خطوة تظهر حسب صلاحيات الإنشاء أو الاعتماد أو الرفض.',
        },
    ],
    en: [
        {
            category: 'Customers',
            title: 'How do I add a customer?',
            keywords: ['customer', 'client', 'عميل'],
            answer: 'Open Master Data, then Customers. If you have create permission, choose Add Customer, enter the required data, then save. Review or approval appears according to customer data permissions.',
        },
        {
            category: 'Suppliers',
            title: 'How do I add a supplier?',
            keywords: ['supplier', 'vendor', 'مورد'],
            answer: 'Open Purchasing, then the suppliers section. Enter supplier name, code, and tax data, then save. Sensitive changes should follow assigned permissions.',
        },
        {
            category: 'HR',
            title: 'How do I request a new employee?',
            keywords: ['hiring', 'recruitment', 'employee request', 'headcount', 'موظف'],
            answer: 'Open Administration & System, then New Employee Requests. Create the request, choose department, position, and headcount, then submit it for approval.',
        },
        {
            category: 'HR',
            title: 'How do I follow promotions?',
            keywords: ['promotion', 'succession', 'career'],
            answer: 'Open Administration & System, then Career & Succession. You can follow nominations and succession plans there. Approval is limited to users with the correct permissions.',
        },
        {
            category: 'Payroll',
            title: 'How do I approve payroll?',
            keywords: ['payroll', 'salary', 'salaries'],
            answer: 'Open Administration & System, then Payroll. Payroll moves through finance or HR review, then general manager approval depending on the stage. Missing buttons usually mean missing permission for that stage.',
        },
        {
            category: 'Reports',
            title: 'Where are sales reports?',
            keywords: ['sales report', 'reports', 'analysis'],
            answer: 'Open Administration & System, then Data Analysis. You can review sales by customer, sales by product, and monthly sales. The global search can also help find reports.',
        },
        {
            category: 'Permissions',
            title: 'Why can I not perform an action?',
            keywords: ['permission', 'cannot', 'access', 'button missing'],
            answer: 'Actions are controlled by role and permissions. Open My Permissions from the user menu. If the permission is missing, ask management to review the role instead of using another account.',
        },
        {
            category: 'Pilot',
            title: 'How do I record pilot feedback?',
            keywords: ['feedback', 'problem', 'suggestion', 'pilot'],
            answer: 'Open the Feedback tab in this assistant, choose type and priority, then write a short description. For now it is saved locally until the database-backed feedback center is added.',
        },
        {
            category: 'Inventory',
            title: 'Where can I review inventory movement?',
            keywords: ['inventory', 'ledger', 'stock', 'movement'],
            answer: 'Open Warehouse & Tracking, then Inventory Ledger. This screen shows issue, receipt, and adjustment movements according to your permissions.',
        },
        {
            category: 'Purchasing',
            title: 'How do I follow purchase orders?',
            keywords: ['purchase', 'purchasing', 'po', 'goods receipt'],
            answer: 'Open Warehouse & Tracking, then Purchasing. You will find purchase requests, purchase orders, and goods receipts. Each action appears according to create, approve, or reject permissions.',
        },
    ],
};

const pageHints = {
    Dashboard: {
        ar: 'لوحة التحكم تعرض ملخصات التشغيل والتنبيهات الأساسية.',
        en: 'The dashboard shows operational summaries and main alerts.',
    },
    'MasterData/Customers': {
        ar: 'هذه شاشة العملاء لإضافة ومراجعة بيانات العملاء حسب الصلاحيات.',
        en: 'This is the customers screen for adding and reviewing customer data according to permissions.',
    },
    'Purchasing/Index': {
        ar: 'هذه شاشة المشتريات للموردين وطلبات الشراء وأوامر الشراء والاستلام.',
        en: 'This purchasing screen covers suppliers, purchase requests, purchase orders, and receipts.',
    },
    'Payroll/Index': {
        ar: 'هذه شاشة الرواتب للمراجعة والاعتماد حسب مراحل الصلاحيات.',
        en: 'This payroll screen is used for review and approval according to permission stages.',
    },
    'DataAnalysis/Index': {
        ar: 'هذه شاشة تحليل البيانات للتقارير والمؤشرات بدون تعديل البيانات.',
        en: 'This data analysis screen provides reports and indicators without changing data.',
    },
    'InventoryLedger/Index': {
        ar: 'هذه شاشة دفتر حركة المخزون لمراجعة الحركات والرصيد التشغيلي.',
        en: 'This inventory ledger screen reviews movement and operational stock balances.',
    },
};

const resolutionRoutes = {
    employees_without_position: [
        routeTarget('users.index', 'Employees'),
        routeTarget('employee-coding-coverage.index', 'Employee coding coverage'),
        routeTarget('employee-coding-coverage.index', 'Coverage check'),
    ],
    departments_without_manager: [
        routeTarget('master-data.departments', 'Departments'),
        routeTarget('department-coding.index', 'Department staffing'),
        routeTarget('users.index', 'Users'),
        routeTarget('my-permissions.index', 'My permissions'),
    ],
    employees_without_manager: [
        routeTarget('users.index', 'Users'),
        routeTarget('employee-monthly-reviews.index', 'Employee reviews'),
    ],
    delayed_recruitment_requests: [
        routeTarget('department-hiring-requests.index', 'New employee requests'),
        routeTarget('pending-approvals.index', 'Pending approvals'),
        routeTarget('recruitment-onboarding.index', 'Recruitment onboarding'),
    ],
    payroll_pending_approval: [
        routeTarget('payroll.index', 'Payroll'),
        routeTarget('pending-approvals.index', 'Pending approvals'),
    ],
    delayed_reviews: [
        routeTarget('employee-monthly-reviews.index', 'Employee reviews'),
        routeTarget('career-planning.index', 'Career and succession'),
    ],
    inactive_accounts: [
        routeTarget('users.index', 'Users'),
        routeTarget('user-provisioning-monitor.index', 'User provisioning monitor'),
        routeTarget('my-permissions.index', 'My permissions'),
    ],
    incomplete_data: [
        routeTarget('data-analysis.index', 'Data analysis'),
        routeTarget('master-data.departments', 'Master data'),
        routeTarget('pilot-feedback.index', 'Pilot feedback'),
    ],
    department_staffing_screen_error: [
        routeTarget('department-coding.index', 'Department staffing'),
        routeTarget('employee-coding-coverage.index', 'Employee coding coverage'),
        routeTarget('pilot-feedback.index', 'Pilot feedback'),
    ],
};

export default function SystemAssistant() {
    const page = usePage();
    const { auth } = page.props;
    const component = page.component;
    const { language, isRtl, text } = useLanguage(labels);
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('guide');
    const [query, setQuery] = useState('');
    const [guideSearch, setGuideSearch] = useState('');
    const [copied, setCopied] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [voiceRate, setVoiceRate] = useState(() => Number(localStorage.getItem('erp-assistant-voice-rate') ?? 1));
    const [autoReadSummary, setAutoReadSummary] = useState(() => localStorage.getItem('erp-assistant-auto-read-summary') === '1');
    const [dailySummary, setDailySummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryShown, setSummaryShown] = useState(false);
    const [operationalFindings, setOperationalFindings] = useState({});
    const [messages, setMessages] = useState(() => [{ role: 'assistant', body: labels.ar.greeting }]);
    const [notes, setNotes] = useState([]);
    const inputRef = useRef(null);
    const scrollRef = useRef(null);
    const summaryKey = `erp-daily-summary-shown-${auth?.user?.id ?? 'guest'}-${new Date().toISOString().slice(0, 10)}`;
    const entries = knowledge[language] ?? knowledge.ar;
    const operationalProblems = problemAnalyses[language] ?? problemAnalyses.ar;
    const searchableEntries = useMemo(() => [
        ...operationalProblems.map((problem) => ({
            ...problem,
            category: language === 'ar' ? 'تحليل المشاكل' : 'Problem analysis',
            answer: problem.cause,
            isProblemAnalysis: true,
        })),
        ...entries,
    ], [entries, language, operationalProblems]);
    const permissions = auth?.permissions ?? [];
    const pageHint = pageHints[component]?.[language];

    useEffect(() => {
        setMessages([{ role: 'assistant', body: text.greeting }]);
    }, [language, text.greeting]);

    useEffect(() => {
        if (!open || !window.route) {
            return;
        }

        fetch(route('pilot-feedback.index'), {
            headers: {
                Accept: 'application/json',
            },
        })
            .then((response) => response.ok ? response.json() : null)
            .then((payload) => {
                if (payload?.items) {
                    setNotes(payload.items.map(normalizeFeedbackItem));
                }
            })
            .catch(() => {});
    }, [open]);

    useEffect(() => {
        if (!open || !window.route) {
            return;
        }

        fetch(route('system-assistant.findings', { lang: language }), {
            headers: {
                Accept: 'application/json',
            },
        })
            .then((response) => response.ok ? response.json() : null)
            .then((payload) => {
                if (payload?.findings) {
                    setOperationalFindings(payload.findings);
                }
            })
            .catch(() => setOperationalFindings({}));
    }, [language, open]);

    useEffect(() => {
        if (open) {
            window.setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [open, tab]);

    useEffect(() => {
        localStorage.setItem('erp-assistant-voice-rate', String(voiceRate));
    }, [voiceRate]);

    useEffect(() => {
        localStorage.setItem('erp-assistant-auto-read-summary', autoReadSummary ? '1' : '0');
    }, [autoReadSummary]);

    useEffect(() => {
        fetchDailySummary({ autoOpen: true });

        return () => stopSpeaking();
    }, [language]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const guideResults = useMemo(() => {
        const term = normalizeText(guideSearch);

        if (!term) {
            return searchableEntries;
        }

        return searchableEntries
            .map((entry) => ({ entry, score: scoreEntry(term, entry) }))
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map((item) => item.entry);
    }, [searchableEntries, guideSearch]);

    const healthChecks = useMemo(() => [
        { label: text.languageReady, ok: ['ar', 'en'].includes(language), weight: 20 },
        { label: text.accountReady, ok: Boolean(auth?.user?.id), weight: 20 },
        { label: text.permissionsReady, ok: permissions.length > 0, weight: 20 },
        { label: text.pageAware, ok: Boolean(component), weight: 20 },
        { label: text.feedbackReady, ok: true, weight: 20 },
    ], [auth?.user?.id, component, language, permissions.length, text]);
    const healthScore = healthChecks.reduce((total, check) => total + (check.ok ? check.weight : 0), 0);
    const healthLabel = healthScore >= 80 ? text.good : healthScore >= 55 ? text.review : text.risky;

    const ask = (question = query) => {
        const cleaned = question.trim();

        if (!cleaned) {
            return;
        }

        const problemMatch = findProblemAnalysis(cleaned, operationalProblems);
        const match = problemMatch ?? findAnswer(cleaned, entries);
        const liveFinding = match?.entry?.isProblemAnalysis ? operationalFindings[match.entry.key] : null;
        const body = match
            ? `${formatAssistantAnswer(match.entry, text, liveFinding)}\n\n${text.confidence}: ${match.confidence}%\n${text.readOnly}`
            : `${text.fallback}\n\n${text.readOnly}`;
        const plan = match?.entry?.isProblemAnalysis ? buildResolutionPlan(match.entry, liveFinding) : null;

        setMessages((current) => [
            ...current,
            { role: 'user', body: cleaned },
            { role: 'assistant', body, plan },
        ]);
        setQuery('');
    };

    const fetchDailySummary = ({ autoOpen = false } = {}) => {
        if (!window.route) {
            return;
        }

        setSummaryLoading(true);
        fetch(route('daily-summary', { lang: language }), {
            headers: {
                Accept: 'application/json',
            },
        })
            .then((response) => response.ok ? response.json() : null)
            .then((payload) => {
                if (!payload) {
                    return;
                }

                setDailySummary(payload);

                const alreadyShown = localStorage.getItem(summaryKey) === '1';
                if (autoOpen && !alreadyShown) {
                    setOpen(true);
                    setTab('today');
                    setSummaryShown(true);
                    localStorage.setItem(summaryKey, '1');

                    if (autoReadSummary) {
                        window.setTimeout(() => speak(payload.spokenText), 450);
                    }
                }
            })
            .finally(() => setSummaryLoading(false));
    };

    const speak = (value) => {
        const textToRead = String(value ?? '').trim();

        if (!textToRead || !window.speechSynthesis) {
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = language === 'ar' ? 'ar-EG' : 'en-US';
        utterance.rate = voiceRate;
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        setSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setSpeaking(false);
    };

    const clearChat = () => {
        setMessages([{ role: 'assistant', body: text.greeting }]);
        setCopied(false);
    };

    const copyChat = async () => {
        const transcript = messages.map((message) => `${message.role}: ${message.body}`).join('\n\n');

        try {
            await navigator.clipboard.writeText(transcript);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
        } catch {
            setCopied(false);
        }
    };

    const exportFeedback = () => {
        const payload = JSON.stringify(notes, null, 2);
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `pilot-feedback-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportFindingsReport = () => {
        const categoryLabels = Object.fromEntries(findingCategories.map((category) => [category.value, text[category.labelKey]]));
        const severityLabelsForReport = {
            low: text.low,
            medium: text.medium,
            high: text.high,
        };
        const lines = [
            `# ${text.findingsTitle}`,
            '',
            text.findingsIntro,
            '',
            `${text.date}: ${formatDate(new Date().toISOString(), language)}`,
            '',
        ];

        findingCategories.forEach((category) => {
            const categoryNotes = notes.filter((note) => (note.findingCategory ?? legacyFindingCategory(note.type)) === category.value);
            lines.push(`## ${categoryLabels[category.value]}`);
            lines.push('');

            if (categoryNotes.length === 0) {
                lines.push('- -');
                lines.push('');
                return;
            }

            categoryNotes.forEach((note) => {
                lines.push(`- ${note.body}`);
                lines.push(`  - ${text.page}: ${note.page ?? '-'}`);
                lines.push(`  - ${text.severity}: ${severityLabelsForReport[note.severity] ?? note.severity ?? '-'}`);
                lines.push(`  - ${text.date}: ${formatDate(note.createdAt, language)}`);
            });

            lines.push('');
        });

        downloadFile(
            `pilot-run-findings-${new Date().toISOString().slice(0, 10)}.md`,
            lines.join('\n'),
            'text/markdown',
        );
    };

    const typeLabels = {
        problem: text.problem,
        suggestion: text.suggestion,
        improvement: text.improvement,
    };
    const severityLabels = {
        low: text.low,
        medium: text.medium,
        high: text.high,
    };
    const categoryLabels = Object.fromEntries(findingCategories.map((category) => [category.value, text[category.labelKey]]));

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="fixed bottom-5 end-5 z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full border text-white shadow-xl transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ background: 'var(--erp-action)', borderColor: 'var(--erp-danger-border)', '--tw-ring-color': 'var(--erp-accent)' }}
                title={text.open}
                aria-label={text.open}
            >
                <AssistantIcon />
            </button>

            {open && (
                <div className="fixed inset-0 z-[90] flex items-end justify-end bg-black/30 p-3 sm:p-5" dir={isRtl ? 'rtl' : 'ltr'}>
                    <section className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border shadow-2xl" style={{ background: 'var(--erp-card)', borderColor: 'var(--erp-border)', color: 'var(--erp-text)' }}>
                        <header className="flex items-center justify-between gap-3 border-b p-4" style={{ borderColor: 'var(--erp-border)' }}>
                            <div className="min-w-0">
                                <h2 className="truncate text-base font-black">{text.title}</h2>
                                <p className="text-xs font-semibold" style={{ color: 'var(--erp-muted)' }}>{text.subtitle}</p>
                            </div>
                            <button type="button" onClick={() => setOpen(false)} className="icon-control" title={text.close} aria-label={text.close}>
                                <CloseIcon />
                            </button>
                        </header>

                        <div className="grid grid-cols-5 gap-2 border-b p-3" style={{ borderColor: 'var(--erp-border)' }}>
                            <TabButton active={tab === 'guide'} onClick={() => setTab('guide')}>{text.guide}</TabButton>
                            <TabButton active={tab === 'today'} onClick={() => { setTab('today'); fetchDailySummary(); }}>{text.today}</TabButton>
                            <TabButton active={tab === 'health'} onClick={() => setTab('health')}>{text.health}</TabButton>
                            <TabButton active={tab === 'pilot'} onClick={() => setTab('pilot')}>{text.pilot}</TabButton>
                            <TabButton active={tab === 'feedback'} onClick={() => setTab('feedback')}>{text.feedback}</TabButton>
                        </div>

                        <div className="grid gap-3 border-b p-3 text-xs sm:grid-cols-[auto_1fr_auto]" style={{ borderColor: 'var(--erp-border)', background: 'var(--erp-surface)' }}>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => speak(lastAssistantText(messages))} className="control-pill h-8 px-2 text-xs">{text.listen}</button>
                                <button type="button" onClick={stopSpeaking} disabled={!speaking} className="control-pill h-8 px-2 text-xs disabled:opacity-50">{text.stop}</button>
                            </div>
                            <label className="flex items-center gap-2 font-semibold" style={{ color: 'var(--erp-muted)' }}>
                                {text.voiceSpeed}
                                <input type="range" min="0.7" max="1.4" step="0.1" value={voiceRate} onChange={(event) => setVoiceRate(Number(event.target.value))} className="w-full" />
                                <span>{voiceRate.toFixed(1)}</span>
                            </label>
                            <label className="flex items-center gap-2 font-semibold" style={{ color: 'var(--erp-muted)' }}>
                                <input type="checkbox" checked={autoReadSummary} onChange={(event) => setAutoReadSummary(event.target.checked)} />
                                {text.autoReadSummary}
                            </label>
                        </div>

                        {tab === 'guide' && (
                            <div className="flex min-h-0 flex-1 flex-col">
                                <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                                    <InfoBox>{text.readOnly}</InfoBox>

                                    {pageHint && (
                                        <div className="rounded-md border p-3 text-sm" style={{ borderColor: 'var(--erp-border)', background: 'var(--erp-soft)' }}>
                                            <span className="block text-xs font-bold" style={{ color: 'var(--erp-muted)' }}>{text.currentPage}</span>
                                            {pageHint}
                                        </div>
                                    )}

                                    {messages.map((message, index) => (
                                        <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[88%] whitespace-pre-line rounded-lg px-3 py-2 text-sm ${message.role === 'user' ? 'text-white' : ''}`} style={message.role === 'user' ? { background: 'var(--erp-action)' } : { background: 'var(--erp-surface)' }}>
                                                <AssistantMessage message={message} text={text} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t p-3" style={{ borderColor: 'var(--erp-border)' }}>
                                    <div className="mb-3 grid gap-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="text-xs font-bold" style={{ color: 'var(--erp-muted)' }}>{text.search}</div>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={copyChat} className="control-pill h-8 px-2 text-xs">{copied ? text.copied : text.copy}</button>
                                                <button type="button" onClick={clearChat} className="control-pill h-8 px-2 text-xs">{text.clear}</button>
                                            </div>
                                        </div>
                                        <input value={guideSearch} onChange={(event) => setGuideSearch(event.target.value)} className="form-input mt-0 h-9 text-sm" placeholder={text.search} />
                                        <div className="max-h-28 space-y-2 overflow-y-auto">
                                            {guideResults.length === 0 ? (
                                                <div className="rounded-md border p-2 text-xs" style={{ borderColor: 'var(--erp-border)', color: 'var(--erp-muted)' }}>{text.noResults}</div>
                                            ) : guideResults.slice(0, 4).map((item) => (
                                                <button key={item.title} type="button" onClick={() => ask(item.title)} className="flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-start text-xs transition hover:-translate-y-0.5" style={{ borderColor: 'var(--erp-border)', background: 'var(--erp-control)' }}>
                                                    <span className="font-bold">{item.title}</span>
                                                    <span style={{ color: 'var(--erp-muted)' }}>{item.category}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <form onSubmit={(event) => { event.preventDefault(); ask(); }} className="flex gap-2">
                                        <input
                                            ref={inputRef}
                                            value={query}
                                            onChange={(event) => setQuery(event.target.value)}
                                            className="form-input mt-0 h-10"
                                            placeholder={text.askPlaceholder}
                                        />
                                        <button type="submit" className="erp-button h-10">{text.send}</button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {tab === 'today' && (
                            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                                <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--erp-border)', background: 'var(--erp-card)' }}>
                                    <div>
                                        <h3 className="text-base font-black">{text.dailySummary}</h3>
                                        <p className="mt-1 text-sm" style={{ color: 'var(--erp-muted)' }}>
                                            {dailySummary?.date ?? new Date().toISOString().slice(0, 10)}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" onClick={() => fetchDailySummary()} className="control-pill">{text.repeat}</button>
                                        <button type="button" onClick={() => speak(dailySummary?.spokenText)} disabled={!dailySummary} className="erp-button disabled:opacity-50">{text.readSummary}</button>
                                    </div>
                                </div>

                                {summaryLoading && <div className="rounded-md border p-4 text-sm" style={{ borderColor: 'var(--erp-border)', color: 'var(--erp-muted)' }}>{text.summaryLoading}</div>}

                                {!summaryLoading && !dailySummary && (
                                    <div className="rounded-md border p-4 text-sm" style={{ borderColor: 'var(--erp-border)', color: 'var(--erp-muted)' }}>{text.summaryEmpty}</div>
                                )}

                                {dailySummary && (
                                    <>
                                        {dailySummary.alerts?.length > 0 && (
                                            <SummarySection title={text.todayAlerts} rows={dailySummary.alerts} tone="warning" />
                                        )}

                                        {dailySummary.completed?.length > 0 && (
                                            <SummarySection title={text.todayDone} rows={dailySummary.completed} tone="success" />
                                        )}

                                        {dailySummary.pending?.length > 0 && (
                                            <SummarySection title={text.todayPending} rows={dailySummary.pending} tone="info" />
                                        )}

                                        {(!dailySummary.alerts?.length && !dailySummary.completed?.length && !dailySummary.pending?.length) && (
                                            <SummarySection title={text.dailySummary} rows={dailySummary.items ?? []} tone="info" />
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {tab === 'health' && (
                            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                                <InfoBox>{text.healthIntro}</InfoBox>
                                <div className="rounded-lg border p-4" style={{ borderColor: 'var(--erp-border)', background: 'var(--erp-surface)' }}>
                                    <div className="flex items-end justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-bold" style={{ color: 'var(--erp-muted)' }}>{text.healthScore}</div>
                                            <div className="mt-1 text-4xl font-black">{healthScore}%</div>
                                        </div>
                                        <span className="rounded-full px-3 py-1 text-xs font-black" style={{ background: healthScore >= 80 ? 'var(--erp-success-soft)' : healthScore >= 55 ? 'var(--erp-warning-soft)' : 'var(--erp-danger-soft)', color: healthScore >= 80 ? 'var(--erp-success-text)' : healthScore >= 55 ? 'var(--erp-warning-text)' : 'var(--erp-danger-text)' }}>
                                            {healthLabel}
                                        </span>
                                    </div>
                                    <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: 'var(--erp-soft)' }}>
                                        <div className="h-full rounded-full" style={{ width: `${healthScore}%`, background: 'var(--erp-action)' }} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {healthChecks.map((check) => (
                                        <div key={check.label} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm" style={{ borderColor: 'var(--erp-border)', background: 'var(--erp-card)' }}>
                                            <span className="font-semibold">{check.label}</span>
                                            <span className="rounded-full px-2 py-1 text-xs font-black" style={{ background: check.ok ? 'var(--erp-success-soft)' : 'var(--erp-danger-soft)', color: check.ok ? 'var(--erp-success-text)' : 'var(--erp-danger-text)' }}>
                                                {check.ok ? text.good : text.review}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-lg border p-4 text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                                    <div className="font-black">{text.currentUser}</div>
                                    <div className="mt-2" style={{ color: 'var(--erp-muted)' }}>{auth?.user?.name ?? '-'}</div>
                                    <div className="mt-3 font-black">{text.role}</div>
                                    <div className="mt-2" style={{ color: 'var(--erp-muted)' }}>{auth?.role ?? auth?.user?.role?.slug ?? '-'}</div>
                                    <div className="mt-3 font-black">{text.visiblePermissions}</div>
                                    <div className="mt-2 text-xs" style={{ color: 'var(--erp-muted)' }}>
                                        {permissions.length > 0 ? `${permissions.slice(0, 8).join(', ')}${permissions.length > 8 ? '...' : ''}` : '-'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {tab === 'pilot' && (
                            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                                <InfoBox>{text.pilotIntro}</InfoBox>
                                <div className="rounded-lg border p-4" style={{ borderColor: 'var(--erp-warning-border)', background: 'var(--erp-warning-soft)', color: 'var(--erp-warning-text)' }}>
                                    <div className="text-sm font-black">{text.pilotDatabase}</div>
                                    <p className="mt-2 text-sm">{text.pilotDatabaseBody}</p>
                                </div>

                                <div className="space-y-3">
                                    {(pilotPlan[language] ?? pilotPlan.ar).map(([dayNumber, tasks]) => (
                                        <article key={dayNumber} className="rounded-lg border p-4" style={{ borderColor: 'var(--erp-border)', background: 'var(--erp-card)' }}>
                                            <h3 className="mb-3 text-sm font-black">{text.day} {dayNumber}</h3>
                                            <div className="space-y-2">
                                                {tasks.map((task, index) => (
                                                    <a
                                                        key={task}
                                                        href={resolveRouteHref(pilotTaskTarget(dayNumber, index))}
                                                        className="flex items-center gap-3 rounded-md border p-3 text-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2"
                                                        style={{ borderColor: 'var(--erp-border)', background: 'var(--erp-surface)', '--tw-ring-color': 'var(--erp-action)' }}
                                                    >
                                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black" style={{ background: 'var(--erp-soft)', color: 'var(--erp-muted)' }}>
                                                            {index + 1}
                                                        </span>
                                                        <span className="min-w-0 flex-1 font-semibold">{task}</span>
                                                        <span className="shrink-0 text-[11px] font-black" style={{ color: 'var(--erp-muted)' }}>
                                                            {text.openStep ?? 'فتح الخطوة'}
                                                        </span>
                                                    </a>
                                                ))}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        )}

                        {tab === 'feedback' && (
                            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                                <InfoBox>{text.navigateOnly ?? 'المساعد يوجهك فقط إلى الشاشة المناسبة ولا ينفذ أي تعديل أو حذف أو اعتماد.'}</InfoBox>
                                <div className="rounded-lg border p-4" style={{ borderColor: 'var(--erp-border)', background: 'var(--erp-surface)' }}>
                                    <h3 className="text-sm font-black">{text.quickFeedbackTitle}</h3>
                                    <p className="mt-2 text-sm" style={{ color: 'var(--erp-muted)' }}>
                                        {language === 'ar'
                                            ? 'المساعد لا يسجل ملاحظات بنفسه. اضغط لفتح شاشة الملاحظات، ثم نفذ الإجراء هناك حسب صلاحياتك.'
                                            : 'The assistant does not save feedback itself. Open the feedback screen and perform any action there according to your permissions.'}
                                    </p>
                                    <a href={resolveRouteHref(routeTarget('pilot-feedback.index', 'Pilot feedback'))} className="erp-button mt-3 inline-flex">
                                        {text.openRelatedScreen}
                                    </a>
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <h3 className="text-sm font-black">{text.savedNotes}</h3>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={exportFindingsReport} disabled={notes.length === 0} className="control-pill h-8 px-2 text-xs disabled:opacity-50">{text.exportFindings}</button>
                                            <button type="button" onClick={exportFeedback} disabled={notes.length === 0} className="control-pill h-8 px-2 text-xs disabled:opacity-50">{text.export}</button>
                                        </div>
                                    </div>
                                    {notes.length === 0 ? (
                                        <div className="rounded-md border p-4 text-sm" style={{ borderColor: 'var(--erp-border)', color: 'var(--erp-muted)' }}>{text.noNotes}</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {notes.map((note) => (
                                                <article key={note.id} className="rounded-md border p-3 text-sm" style={{ borderColor: 'var(--erp-border)', background: 'var(--erp-card)' }}>
                                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold" style={{ color: 'var(--erp-muted)' }}>
                                                        <span>{categoryLabels[note.findingCategory ?? legacyFindingCategory(note.type)]} - {typeLabels[note.type]} - {severityLabels[note.severity]}</span>
                                                        <span>{formatDate(note.createdAt, language)}</span>
                                                    </div>
                                                    {note.title && <div className="mb-1 font-black">{note.title}</div>}
                                                    <p>{note.body}</p>
                                                    <div className="mt-2 text-xs" style={{ color: 'var(--erp-muted)' }}>{text.page}: {note.page}</div>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </>
    );
}

function TabButton({ active, children, onClick }) {
    return (
        <button type="button" onClick={onClick} className={active ? 'erp-button h-10 px-2' : 'control-pill h-10 justify-center px-2'}>
            {children}
        </button>
    );
}

function InfoBox({ children }) {
    return (
        <div className="rounded-md border p-3 text-xs font-semibold" style={{ borderColor: 'var(--erp-info-border)', background: 'var(--erp-info-soft)', color: 'var(--erp-info-text)' }}>
            {children}
        </div>
    );
}

function AssistantMessage({ message, text }) {
    const plan = message.plan;

    return (
        <div className="space-y-3">
            <div>{message.body}</div>

            {plan?.steps?.length > 0 && (
                <div className="space-y-2 whitespace-normal rounded-md border p-3" style={{ borderColor: 'var(--erp-info-border)', background: 'var(--erp-card)' }}>
                    <div className="text-xs font-black" style={{ color: 'var(--erp-muted)' }}>
                        {text.navigateOnly ?? 'المساعد يوجهك فقط إلى الشاشة المناسبة ولا ينفذ أي تعديل أو حذف أو اعتماد.'}
                    </div>
                    <div className="space-y-2">
                        {plan.steps.map((step, index) => (
                            <a
                                key={`${step.label}-${index}`}
                                href={step.href}
                                className="grid gap-2 rounded-md border px-3 py-2 text-start transition hover:-translate-y-0.5 focus:outline-none focus:ring-2"
                                style={{ borderColor: 'var(--erp-border)', background: 'var(--erp-control)', '--tw-ring-color': 'var(--erp-action)' }}
                            >
                                <span className="text-xs font-black" style={{ color: 'var(--erp-muted)' }}>
                                    {index + 1}. {text.openStep ?? 'فتح الخطوة'}
                                </span>
                                <span className="font-semibold">{step.label}</span>
                                <span className="text-xs font-bold" style={{ color: 'var(--erp-muted)' }}>
                                    {text.stepScreen ?? 'الشاشة المقصودة'}: {step.screen}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function SummarySection({ title, rows, tone }) {
    const style = {
        warning: ['var(--erp-warning-border)', 'var(--erp-warning-soft)', 'var(--erp-warning-text)'],
        success: ['var(--erp-success-border)', 'var(--erp-success-soft)', 'var(--erp-success-text)'],
        info: ['var(--erp-info-border)', 'var(--erp-info-soft)', 'var(--erp-info-text)'],
    }[tone] ?? ['var(--erp-border)', 'var(--erp-surface)', 'var(--erp-text)'];

    return (
        <section className="rounded-lg border p-4" style={{ borderColor: style[0], background: style[1], color: style[2] }}>
            <h3 className="mb-3 text-sm font-black">{title}</h3>
            <ul className="space-y-2 text-sm">
                {rows.map((row, index) => {
                    const label = typeof row === 'string' ? row : row?.label;
                    const detail = typeof row === 'string' ? null : row?.detail;
                    const url = typeof row === 'string' ? null : row?.url;
                    const key = `${label ?? ''}-${index}`;
                    const content = (
                        <>
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: style[2] }} />
                            <span className="min-w-0 flex-1">
                                <span className="block">{label}</span>
                                {detail && <span className="mt-1 block text-xs font-semibold opacity-80">{detail}</span>}
                            </span>
                            {url && <span className="shrink-0 text-[11px] font-black opacity-75">Open</span>}
                        </>
                    );

                    return (
                        <li key={key}>
                            {url ? (
                                <a href={url} className="flex gap-2 rounded-md px-2 py-1.5 font-semibold transition hover:-translate-y-0.5 hover:bg-white/25 focus:outline-none focus:ring-2" style={{ '--tw-ring-color': style[2] }}>
                                    {content}
                                </a>
                            ) : (
                                <div className="flex gap-2 px-2 py-1.5">
                                    {content}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

function lastAssistantText(messages) {
    return [...messages].reverse().find((message) => message.role === 'assistant')?.body ?? '';
}

function buildResolutionPlan(entry, liveFinding = null) {
    const targets = resolutionRoutes[entry.key] ?? [routeTarget('dashboard', 'Dashboard')];
    const steps = entry.steps.map((step, index) => {
        const target = targets[Math.min(index, targets.length - 1)] ?? targets[0];
        const liveUrl = index === 0 && liveFinding?.url ? liveFinding.url : null;

        return {
            label: step,
            screen: target.label,
            href: liveUrl ?? resolveRouteHref(target),
        };
    });

    return { steps };
}

function formatAssistantAnswer(entry, text, liveFinding = null) {
    if (!entry.isProblemAnalysis) {
        return entry.answer;
    }

    const liveLines = formatLiveFinding(liveFinding, text);

    return [
        entry.title,
        '',
        ...liveLines,
        ...(liveLines.length > 0 ? [''] : []),
        `${text.cause}: ${entry.cause}`,
        `${text.impact}: ${entry.impact}`,
        `${text.priority}: ${entry.priority}`,
        `${text.owner}: ${entry.owner}`,
        '',
        `${text.solutionSteps}:`,
        ...entry.steps.map((step, index) => `${index + 1}. ${step}`),
        '',
        text.rerunCheck,
    ].join('\n');
}

function formatLiveFinding(finding, text) {
    if (!finding || typeof finding.count !== 'number') {
        return [];
    }

    if (finding.count <= 0) {
        return [
            `${text.liveFinding}: ${text.liveFindingEmpty}`,
        ];
    }

    const samples = Array.isArray(finding.samples) ? finding.samples.filter(Boolean) : [];

    return [
        `${text.liveFinding}:`,
        `${text.totalAffected}: ${finding.count}`,
        ...(samples.length > 0 ? [`${text.affectedItems}:`, ...samples.map((sample) => `- ${sample}`)] : []),
        ...(finding.url ? [`${text.openRelatedScreen}: ${finding.url}`] : []),
    ];
}

function findProblemAnalysis(question, entries) {
    const normalized = normalizeText(question);
    const matches = entries
        .map((entry) => ({
            entry: { ...entry, isProblemAnalysis: true },
            score: scoreEntry(normalized, { ...entry, answer: `${entry.cause} ${entry.impact} ${entry.steps.join(' ')}` }),
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);

    if (matches.length === 0) {
        return null;
    }

    return {
        entry: matches[0].entry,
        confidence: Math.min(99, Math.max(70, Math.round(matches[0].score * 16))),
    };
}

function findAnswer(question, entries) {
    const normalized = normalizeText(question);
    const matches = entries
        .map((entry) => ({ entry, score: scoreEntry(normalized, entry) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);

    if (matches.length === 0) {
        return null;
    }

    return {
        entry: matches[0].entry,
        confidence: Math.min(98, Math.max(58, Math.round(matches[0].score * 14))),
    };
}

function scoreEntry(term, entry) {
    if (!term) {
        return 1;
    }

    const title = normalizeText(entry.title);
    const answer = normalizeText(entry.answer);
    const category = normalizeText(entry.category);
    const keywords = entry.keywords.map(normalizeText);
    let score = 0;

    if (title.includes(term)) score += 5;
    if (category.includes(term)) score += 3;
    if (answer.includes(term)) score += 1;

    term.split(/\s+/).filter(Boolean).forEach((part) => {
        if (title.includes(part)) score += 2;
        if (category.includes(part)) score += 1;
        if (answer.includes(part)) score += 0.5;
        keywords.forEach((keyword) => {
            if (keyword.includes(part) || part.includes(keyword)) score += 3;
        });
    });

    return score;
}

function routeTarget(name, label, params = undefined, fallback = null) {
    return { name, label, params, fallback };
}

function pilotTaskTarget(dayNumber, taskIndex) {
    const targetsByDay = {
        1: [
            routeTarget('department-coding.index', 'Department staffing'),
            routeTarget('approved-positions.index', 'Approved positions'),
            routeTarget('users.index', 'Employees'),
        ],
        2: [
            routeTarget('users.index', 'Users'),
            routeTarget('my-permissions.index', 'My permissions'),
            routeTarget('user-switch-history.index', 'Switch user history'),
        ],
        3: [
            routeTarget('master-data.customers', 'Customers'),
            routeTarget('purchasing.index', 'Purchasing'),
            routeTarget('data-analysis.index', 'Data analysis'),
        ],
        4: [
            routeTarget('products.index', 'Products'),
            routeTarget('data-analysis.index', 'Data analysis'),
            routeTarget('exports.show', 'Exports', { type: 'products' }),
        ],
        5: [
            routeTarget('recruitment-onboarding.index', 'Recruitment onboarding'),
            routeTarget('career-planning.index', 'Career planning'),
            routeTarget('employee-monthly-reviews.index', 'Employee reviews'),
        ],
        6: [
            routeTarget('payroll.index', 'Payroll'),
            routeTarget('pending-approvals.index', 'Pending approvals'),
            routeTarget('notifications.index', 'Notifications'),
        ],
        7: [
            routeTarget('pilot-feedback.index', 'Pilot feedback'),
            routeTarget('system-assistant.findings', 'Assistant findings'),
            routeTarget('pilot-feedback.index', 'Pilot feedback priorities'),
        ],
    };
    const dayTargets = targetsByDay[Number(dayNumber)] ?? [routeTarget('dashboard', 'Dashboard')];

    return dayTargets[Math.min(taskIndex, dayTargets.length - 1)] ?? dayTargets[0];
}

function resolveRouteHref(target) {
    if (window.route) {
        try {
            return target.params === undefined ? route(target.name) : route(target.name, target.params);
        } catch {
            return target.fallback ?? '#';
        }
    }

    return target.fallback ?? '#';
}

function normalizeText(value) {
    return String(value ?? '')
        .toLowerCase()
        .replace(/[أإآا]/g, 'ا')
        .replace(/[ىي]/g, 'ي')
        .replace(/[ة]/g, 'ه')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function legacyFindingCategory(type) {
    if (type === 'suggestion') {
        return 'user_requests';
    }

    if (type === 'improvement') {
        return 'improvements';
    }

    return 'bugs';
}

function normalizeFeedbackItem(item) {
    return {
        id: item.id,
        title: item.title,
        body: item.description ?? item.body ?? '',
        page: item.page,
        type: item.type ?? 'problem',
        findingCategory: item.finding_category ?? item.findingCategory ?? legacyFindingCategory(item.type),
        severity: item.priority ?? item.severity ?? 'medium',
        status: item.status ?? 'new',
        createdAt: item.created_at ?? item.createdAt ?? new Date().toISOString(),
    };
}

function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function formatDate(value, language) {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function AssistantIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="7" width="14" height="11" rx="3" />
            <path d="M12 3v4" />
            <path d="M8.5 12h.01" />
            <path d="M15.5 12h.01" />
            <path d="M9.5 16h5" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}
