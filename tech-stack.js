// Stack Principal
const techStack = {
  frontend: {
    framework: "React.js 18",
    ui: "Material-UI + Styled Components",
    state: "Redux Toolkit + RTK Query",
    routing: "React Router v6",
    forms: "React Hook Form + Yup",
    calendar: "FullCalendar.js",
    charts: "Chart.js + React-Chartjs-2"
  },
  backend: {
    runtime: "Node.js 18 LTS",
    framework: "Express.js",
    database: "PostgreSQL 15",
    cache: "Redis",
    auth: "JWT + Passport.js",
    validation: "Joi",
    docs: "Swagger/OpenAPI",
    testing: "Jest + Supertest"
  },
  infrastructure: {
    deployment: "Docker + Kubernetes",
    cloud: "AWS/Google Cloud",
    cdn: "CloudFlare",
    monitoring: "New Relic + Sentry",
    ci_cd: "GitHub Actions"
  },
  integrations: {
    payments: "Stripe + PagSeguro",
    sms: "Twilio",
    email: "SendGrid",
    storage: "AWS S3",
    pdf: "Puppeteer",
    whatsapp: "WhatsApp Business API"
  }
};

module.exports = techStack;
