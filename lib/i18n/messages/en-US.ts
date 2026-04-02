import { MessageKey } from "./es-MX";

const enUS: Record<MessageKey, string> = {
  // Nav
  "nav.inicio": "Home",
  "nav.academica": "Academic Training",
  "nav.artistica": "Artistic Training",
  "nav.socioemocional": "Socio-emotional Education",
  "nav.nosotros": "About Us",
  "nav.beneficios": "Benefits & Differentiators",
  "nav.oferta": "Educational Offer",
  "nav.testimonios": "Testimonials",
  "nav.contacto": "Contact Us",
  "nav.plataforma": "Platform",
  "nav.logoAria": "Virtuós Institute",
  "nav.menuAria": "Menu",

  // Platform
  "platform.entry.title": "Access the Virtuós platform",
  "platform.entry.subtitle":
    "Continue with Google. If it is your first time, this same sign-in will create and link your account for future access.",
  "platform.entry.googleSignIn": "Continue with",
  "platform.entry.googleProvider": "Google",
  "platform.entry.googleError": "Google sign-in could not be started. Please try again.",
  "platform.entry.checking": "Checking your platform access...",
  "platform.entry.pendingTitle": "Account under review",
  "platform.entry.pendingBody": "Your account is being reviewed by staff. Once approved, we will send you an email notification.",
  "platform.entry.approvedTitle": "Access approved",
  "platform.entry.approvedBody": "Your account is approved. You can continue to the platform dashboard.",
  "platform.entry.configErrorTitle": "Platform setup required",
  "platform.entry.configErrorBody": "Platform access is temporarily unavailable. Please try again later or contact school staff.",
  "platform.entry.accountRemovedTitle": "Access request closed",
  "platform.entry.accountRemovedBody": "This account is no longer available for platform access. Please contact school staff if you need assistance.",
  "platform.entry.backHome": "Back to home",
  "platform.nav.profile": "Profile",
  "platform.nav.signOut": "Sign out",
  "platform.nav.signingOut": "Signing out...",
  "platform.nav.loadingIdentity": "Loading account",
  "platform.nav.role.superadmin": "Superadmin",
  "platform.nav.role.staff": "Staff",
  "platform.nav.role.parent": "Parent",
  "platform.dashboard.title": "Platform dashboard",
  "platform.dashboard.subtitle": "Your dashboard modules are being enabled. This entry point is now protected by approval status.",
  "platform.dashboard.home": "Back to home",
  "platform.dashboard.superadmin.badge": "Superadmin",
  "platform.dashboard.superadmin.title": "Platform control center",
  "platform.dashboard.superadmin.subtitle": "Manage role assignments, onboarding decisions, and core platform settings from one place.",
  "platform.dashboard.superadmin.users.title": "User directory",
  "platform.dashboard.superadmin.users.description": "Search users, verify role assignments, and control account lifecycle status.",
  "platform.dashboard.superadmin.approvals.title": "Approval queue",
  "platform.dashboard.superadmin.approvals.description": "Review pending parent access requests and apply final approval decisions.",
  "platform.dashboard.superadmin.settings.title": "Platform settings",
  "platform.dashboard.superadmin.settings.description": "Configure global onboarding behavior and operational guardrails.",
  "platform.dashboard.superadmin.sidebar.title": "Superadmin",
  "platform.dashboard.sidebar.pages": "Pages",
  "platform.dashboard.superadmin.sidebar.home": "Home",
  "platform.dashboard.superadmin.sidebar.users": "Users directory",
  "platform.dashboard.superadmin.home.title": "Superadmin dashboard",
  "platform.dashboard.superadmin.home.subtitle": "This home surface centralizes the key controls for platform governance.",
  "platform.dashboard.superadmin.home.users.title": "Users directory",
  "platform.dashboard.superadmin.home.users.description": "Manage user identities, role assignments, and account lifecycle states.",
  "platform.dashboard.superadmin.home.approvals.title": "Approvals",
  "platform.dashboard.superadmin.home.approvals.description": "Review pending onboarding requests and resolve access decisions.",
  "platform.dashboard.superadmin.home.settings.title": "Platform settings",
  "platform.dashboard.superadmin.home.settings.description": "Configure global onboarding, dashboard routing, and operational guardrails.",
  "platform.dashboard.superadmin.usersDirectory.title": "Users directory",
  "platform.dashboard.superadmin.usersDirectory.subtitle": "View all registered users and their current platform or membership roles.",
  "platform.dashboard.superadmin.usersDirectory.empty": "No users found.",
  "platform.dashboard.superadmin.usersDirectory.loading": "Loading users...",
  "platform.dashboard.superadmin.usersDirectory.error": "Users directory could not be loaded. Please try again.",
  "platform.dashboard.superadmin.usersDirectory.columns.fullName": "Full name",
  "platform.dashboard.superadmin.usersDirectory.columns.email": "Email",
  "platform.dashboard.superadmin.usersDirectory.columns.platformRole": "Platform role",
  "platform.dashboard.superadmin.usersDirectory.columns.membershipRoles": "Membership roles",
  "platform.dashboard.staff.badge": "Staff",
  "platform.dashboard.staff.title": "Staff operations dashboard",
  "platform.dashboard.staff.subtitle": "Coordinate approvals, student administration, and communication workflows.",
  "platform.dashboard.staff.approvals.title": "Approvals",
  "platform.dashboard.staff.approvals.description": "Track parent and child onboarding requests that need operational review.",
  "platform.dashboard.staff.students.title": "Students",
  "platform.dashboard.staff.students.description": "Monitor student records, document status, and follow-up actions.",
  "platform.dashboard.staff.notifications.title": "Communications",
  "platform.dashboard.staff.notifications.description": "Publish announcements and coordinate parent-facing updates.",
  "platform.dashboard.parent.badge": "Parent",
  "platform.dashboard.parent.title": "Parent dashboard",
  "platform.dashboard.parent.subtitle": "Follow your children activity, communications, and school schedule from one view.",
  "platform.dashboard.parent.children.title": "My children",
  "platform.dashboard.parent.children.description": "View onboarding status, profile details, and school record updates.",
  "platform.dashboard.parent.messages.title": "Messages",
  "platform.dashboard.parent.messages.description": "Read and reply to school conversations in one thread view.",
  "platform.dashboard.parent.calendar.title": "Calendar and appointments",
  "platform.dashboard.parent.calendar.description": "Check events and track requested or confirmed appointment slots.",
  "platform.profile.title": "User profile",
  "platform.profile.subtitle": "Profile management modules will be available in this section.",
  "platform.email.fallbackName": "there",
  "platform.email.review.subject": "Your Virtuós account is under review",
  "platform.email.review.heading": "Your account has been created",
  "platform.email.review.body": "Hello {name}, your account has been created and is being reviewed by staff. Once approved, we will send you an email notification.",
  "platform.email.review.cta": "Visit Virtuós Institute",
  "platform.email.approved.subject": "Your Virtuós account is approved",
  "platform.email.approved.heading": "Your account is ready",
  "platform.email.approved.body": "Hello {name}, your account has been approved. You can now access the Virtuós platform.",
  "platform.email.approved.cta": "Open platform",
  // Hero
  "hero.headline": "We transform learning into a unique experience 🌟",
  "hero.highlightPhrase": "unique experience 🌟",
  "hero.subtext":
    "Do you want to maximize your children's potential? Learn about our methodology!",
  "hero.cta": "I want more information!",
  "hero.logoAlt": "Virtuós Institute",
  "hero.bannerAlt": "Virtuós Institute banner",
  "hero.card.academica.desc":
    "We build critical thinking, scientific curiosity and strong academic foundations.",
  "hero.card.artistica.desc":
    "We integrate music, expression and creativity as an essential part of daily learning.",
  "hero.card.socioemocional.desc":
    "We strengthen empathy, self-regulation and resilience for life in and beyond the classroom.",

  // Sobre Nosotros
  "nosotros.sectionLabel": "About Us",
  "nosotros.heading": "Meet Virtuós Institute",
  "nosotros.body":
    "At Virtuós we develop well-rounded individuals by planting human values and driving cognitive, social and emotional skills. Our unique methodology was specially designed for the challenges of the future, built around socio-constructivism, Project-Based Learning (PBL) and the arts.",
  "nosotros.valoresLabel": "Our values",
  "nosotros.cta": "Learn more",
  "nosotros.valor.vida": "Life",
  "nosotros.valor.felicidad": "Happiness",
  "nosotros.valor.autoestima": "Self-esteem",
  "nosotros.valor.autonomia": "Autonomy",
  "nosotros.valor.perseverancia": "Perseverance",
  "nosotros.valor.responsabilidad": "Responsibility",
  "nosotros.valor.honestidad": "Honesty",
  "nosotros.valor.respeto": "Respect",

  // Beneficios
  "beneficios.sectionLabel": "Benefits & Differentiators",
  "beneficios.heading": "Why choose Virtuós Institute?",
  "beneficios.1.title": "Personalised education",
  "beneficios.1.desc": "We adapt our methods to each student's individual needs.",
  "beneficios.2.title": "Multi-language learning",
  "beneficios.2.desc":
    "We offer a curriculum adapted to Spanish, English and French.",
  "beneficios.3.title": "Emotional & social development",
  "beneficios.3.desc": "We foster empathy, teamwork and resilience.",
  "beneficios.4.title": "21st-century skills focus",
  "beneficios.4.desc": "We prepare students for a changing world.",
  "beneficios.5.title": "Psycho-pedagogical department",
  "beneficios.5.desc":
    "We have specialists in children's behaviour across all ages.",
  "beneficios.6.title": "Small groups",
  "beneficios.6.desc":
    "To provide a better service to each student we keep group sizes limited.",
  "beneficios.7.title": "Subject-specialist teachers",
  "beneficios.7.desc": "Every teacher holds an extensive specialist curriculum.",
  "beneficios.8.title": "Arts education",
  "beneficios.8.desc":
    "We offer a wide range of artistic workshops to promote our students' development.",

  // Enfoque
  "enfoque.sectionLabel": "Approach",
  "enfoque.heading": "Our approach includes",
  "enfoque.subtitle":
    "We provide our students with a solid knowledge base, fostering critical thinking, scientific curiosity and the skills needed to face the challenges of the future.",
  "enfoque.1.title": "Academic Training",
  "enfoque.1.desc":
    "We provide our students with a solid knowledge base, fostering critical thinking, scientific curiosity and the skills to face the future.",
  "enfoque.2.title": "Artistic Training",
  "enfoque.2.desc":
    "At Virtuós Institute we integrate artistic training into our daily activities, allowing students to explore and develop their expression.",
  "enfoque.3.title": "Socio-emotional Education",
  "enfoque.3.desc":
    "We place strong emphasis on socio-emotional education, teaching skills such as empathy, self-regulation, resilience and emotional management.",

  // CTA Banner
  "ctaBanner.text": "We foster meaningful learning!",

  // Oferta Educativa
  "oferta.sectionLabel": "Educational Offer",
  "oferta.heading": "Our educational programmes",
  "oferta.kinder.title": "Kindergarten",
  "oferta.kinder.desc":
    "Socio-constructivist teaching based on experiences, games and dynamics for knowledge comprehension.",
  "oferta.kinder.actividadesLabel": "Activities",
  "oferta.kinder.actividad1":
    "Collaborative games that strengthen social skills.",
  "oferta.kinder.actividad2":
    "Introduction to logical thinking and problem solving.",
  "oferta.primaria.title": "Primary",
  "oferta.primaria.desc":
    "A comprehensive approach combining socio-emotional, artistic, values-based and critical-thinking development.",
  "oferta.primaria.actividad1":
    "Use of digital platforms for language learning.",
  "oferta.primaria.actividad2": "Project-based learning.",
  "oferta.primaria.actividad3":
    "Mathematics, science and reading with interactive methods.",

  // Testimonios
  "testimonios.sectionLabel": "Testimonials",
  "testimonios.heading": "What parents and students say about us",
  "testimonios.prevAria": "Previous testimonial",
  "testimonios.nextAria": "Next testimonial",
  "testimonios.dotAria": "Go to testimonial {index}",
  "testimonios.1.quote":
    "We are very grateful to the school for the way it brought out the best in my son, both academically and emotionally. While there he won the Children's Knowledge Olympics competition — he had all the potential but only the school could push him and bring out the best to achieve it.",
  "testimonios.1.author": "Familia Sánchez Fernández",
  "testimonios.2.quote":
    "We had never seen our son so motivated to learn. He has always felt warmly welcomed by all the staff, which has given him confidence and security. He was able to make friends quickly. We are very satisfied with his academic and personal development.",
  "testimonios.2.author": "Familia Basaguren Berlanga",
  "testimonios.3.quote":
    "I highly recommend Virtuós Institute. The school stands out for its innovative approach to education, combining cutting-edge technological tools with a very complete arts program. My son loves the socio-emotional workshop and art classes, where he has developed his creativity and problem-solving skills. In addition, the teaching staff is exceptionally dedicated and committed to each student's development. The personalized attention my son receives is something we value enormously. VIRTUÓS not only provides excellent academic education, but also cultivates important values such as collaboration and critical thinking.",
  "testimonios.3.author": "Familia Mendoza Escalante",
  "testimonios.4.quote":
    "Our three children have been very happy at Virtuós, and it shows when they even want to go on rest days. They have found teachers who encourage them to keep learning and discover knowledge by themselves, and as parents we have been able to get involved in extracurricular activities to be present in our children's education.",
  "testimonios.4.author": "Familia Novelo Rosales",

  // Contact strip
  "contacto.phone": "(999) 750 5757",
  "contacto.email": "info@virtuosinstitute.com.mx",
  "contacto.address": "Calle 25 # 145 Buenavista, Mérida, Yucatán.",
  "contacto.venLabel": "Come and visit us",
  "contacto.mapTitle": "Virtuós Institute location",

  // Social
  "social.facebook": "Facebook",
  "social.instagram": "Instagram",
  "social.whatsapp": "WhatsApp",

  // Lead Form
  "leadForm.heading": "Enrol today and secure your children's future!",
  "leadForm.subtext":
    "Fill in this form and we will send you all the information you need:",
  "leadForm.namePlaceholder": "Name",
  "leadForm.studentAgePlaceholder": "Student age",
  "leadForm.emailPlaceholder": "Email address",
  "leadForm.phonePlaceholder": "Phone",
  "leadForm.messagePlaceholder": "Additional comments or questions",
  "leadForm.cta": "I want to meet Virtuós!",
  "leadForm.success": "Thanks! We will contact you soon.",
  "leadForm.address": "Calle 25 #143A X34 Y 36, Buenavista, 97127 Mérida, Yuc.",
  "leadForm.emailLabel": "Email address",
  "leadForm.phoneLabel": "Phone number",

  // Footer
  "footer.tagline": "Virtuós Institute",
  "footer.languageSwitcherAria": "Language selector",
  "footer.switchToEsAria": "Switch language to Spanish",
  "footer.switchToEnAria": "Switch language to English",
  "footer.locale.esShort": "ES",
  "footer.locale.enShort": "EN",
};

export default enUS;
