/**
 * Fixed website copy taken from the KSA website brief.
 * Content that the team edits often (FAQs, advisory board, webinars, courses,
 * contact details, homepage slides) lives in the database and is managed in /admin.
 */

export const brand = {
  name: "Knowledge Space Academy",
  short: "KSA",
  tagline: "Research. Insight. Impact.",
  description:
    "Knowledge Space Academy supports postgraduate students, academics, researchers and organisations across the research journey, from refining ideas and designing studies to analysing data, strengthening academic writing and preparing for publication.",
};

export type ServiceItem = { title: string; text?: string };
export type ServiceSection = { heading: string; intro?: string; items: ServiceItem[]; style?: "list" | "steps" | "checks" };

export type Service = {
  slug: string;
  title: string;
  short: string;
  metaDescription: string;
  keywords: string[];
  image: string;
  intro: string[];
  sections: ServiceSection[];
};

export const services: Service[] = [
  {
    slug: "research-topic-identification",
    title: "Research Topic Identification",
    short: "Find a topic that is current, researchable and aligned with your interests.",
    metaDescription:
      "Get expert help choosing a strong, researchable thesis or dissertation topic. Knowledge Space Academy guides postgraduate students across all disciplines.",
    keywords: ["research topic", "thesis topic help", "dissertation topic", "postgraduate research"],
    image: "/images/services/topic-blue.webp",
    intro: [
      "Choosing the right research topic is one of the most critical steps on your academic journey. At Knowledge Space Academy, we understand that a strong, relevant, and well-defined topic sets the foundation for a successful thesis or dissertation.",
      "Our expert team works closely with you to identify a research topic that is current, academically valuable, and aligned with your interests. This ensures you have the clarity and direction needed to move forward with confidence.",
    ],
    sections: [
      {
        heading: "What this service includes",
        intro:
          "Our Research Topic Identification Service is designed to simplify what can often be a confusing and overwhelming process. We take the time to understand your field, interests, and academic requirements and recommend practical, engaging, and researchable topics.",
        style: "checks",
        items: [
          { title: "Choose a topic", text: "We help you select a topic that is relevant, impactful, and positioned for academic success." },
          { title: "Expert guidance", text: "Receive professional consultation not only on topic selection but also on how to approach your research journey strategically." },
          { title: "All disciplines covered", text: "From humanities to sciences, our team supports a wide range of academic fields and specialisations." },
          { title: "Ongoing research support", text: "Once your topic is finalised, we can assist with proposal development, research design, and full thesis support." },
        ],
      },
    ],
  },
  {
    slug: "research-design",
    title: "Research Design",
    short: "Build a clear, feasible blueprint that links your questions, data and analysis.",
    metaDescription:
      "Develop a robust research design with expert support. We help students and researchers align research questions, data collection and analysis.",
    keywords: ["research design", "research methodology help", "study design", "research blueprint"],
    image: "/images/services/design-blue.webp",
    intro: [
      "Research design is the strategic blueprint that guides how your research questions will be answered using empirical data. A well-structured design ensures that your data collection aligns seamlessly with your intended analysis, ultimately strengthening the credibility and impact of your research.",
      "Our research design services support students, researchers, and professionals in developing robust, well-aligned research designs. Our approach focuses on clarity, feasibility, and academic rigour, helping you build a strong foundation for a successful research project.",
    ],
    sections: [],
  },
  {
    slug: "qualitative-data-analysis",
    title: "Qualitative Data Analysis",
    short: "Turn interviews, focus groups and open responses into clear, credible themes.",
    metaDescription:
      "Structured qualitative data analysis support: thematic analysis, coding, NVivo guidance and clear write-ups of interviews and focus groups.",
    keywords: ["qualitative data analysis", "thematic analysis help", "NVivo support", "coding interviews"],
    image: "/images/services/qualitative-blue.webp",
    intro: [
      "Qualitative data analysis interprets complex, non-numerical information such as opinions, experiences, and behaviours. This type of data is typically gathered through interviews, focus groups, observations, and open-ended responses, and then organised into meaningful themes and categories.",
      "We understand that the quality of your research findings depends heavily on how well your data is analysed. That is why we provide structured, academically sound qualitative data analysis support, helping you transform raw data into clear, credible insights.",
    ],
    sections: [
      {
        heading: "Why choose our qualitative data analysis support?",
        intro: "Our approach is designed to ensure accuracy, clarity, and academic rigour at every stage:",
        items: [
          { title: "Comprehensive analysis planning", text: "We help you develop a clear strategy for analysing your qualitative data in alignment with your research objectives." },
          { title: "Data organisation", text: "Support with systematically organising your data for analysis." },
          { title: "Appropriate methodological guidance", text: "Assistance in selecting suitable approaches such as thematic analysis, content analysis, or grounded theory." },
          { title: "Clear and coherent narrative development", text: "We help you present your findings in a structured, academically sound manner." },
          { title: "Insightful interpretation of results", text: "Guidance on linking your findings to your research questions and the existing literature." },
          { title: "Use of advanced analysis tools", text: "Support with tools such as NVivo and other qualitative analysis software where needed." },
        ],
      },
      {
        heading: "What our services cover",
        intro: "We provide support across a wide range of qualitative research needs:",
        items: [
          { title: "Analysis of various types of qualitative data", text: "Including interviews, focus groups, case studies, and open-ended survey responses." },
          { title: "Thematic and coding-based analysis", text: "Using structured coding techniques, including colour coding and thematic categorisation." },
          { title: "Software-assisted analysis", text: "Guidance on using tools like NVivo to enhance accuracy and efficiency." },
          { title: "Data collection support", text: "Assistance with designing interview or focus group instruments." },
        ],
      },
    ],
  },
  {
    slug: "quantitative-data-analysis",
    title: "Quantitative Data Analysis",
    short: "Run the right statistics in SPSS and explain what your results mean.",
    metaDescription:
      "Expert quantitative data analysis support: descriptive and inferential statistics, regression, ANOVA, SPSS guidance and clear results chapters.",
    keywords: ["quantitative data analysis", "SPSS help", "statistics for thesis", "regression analysis help"],
    image: "/images/services/quantitative-blue.webp",
    intro: [
      "Quantitative data analysis is a critical component of academic research and thesis writing. It involves the use of numerical data, statistical techniques, and mathematical models to answer key research questions such as “How many?”, “How often?”, and “To what extent?”.",
      "We provide structured guidance and expert support in quantitative data analysis, enabling you to produce accurate, reliable, and academically sound results. Our goal is to simplify complex statistical processes and help you confidently complete your research analysis.",
    ],
    sections: [
      {
        heading: "Our quantitative data analysis expertise",
        intro: "We offer comprehensive support across a wide range of statistical and analytical needs:",
        items: [
          { title: "Descriptive, inferential, and predictive analysis", text: "From summarising data to testing hypotheses and making predictions." },
          { title: "Advanced statistical techniques", text: "Including ANOVA, Chi-Square tests, t-tests, regression analysis, and more." },
          { title: "Software support and guidance", text: "Assistance with tools such as SPSS." },
          { title: "Interpretation and reporting", text: "Clear explanations of results, ensuring they align with your research objectives and academic standards." },
        ],
      },
      {
        heading: "Our key service areas",
        items: [
          { title: "Mixed methods data analysis", text: "Integrating quantitative and qualitative approaches where required." },
          { title: "Data preparation and database design", text: "Structuring datasets for accurate and efficient analysis." },
          { title: "Data analysis section development", text: "Structuring and formatting your results chapter." },
          { title: "Results summaries and visualisation", text: "Presenting findings through tables, charts, and concise explanations." },
          { title: "Statistical software consultation", text: "Guidance on selecting and using the most appropriate tools." },
        ],
      },
    ],
  },
  {
    slug: "thesis-chapter-development",
    title: "Chapters Development",
    short: "Structured support for any thesis chapter, from abstract to conclusion.",
    metaDescription:
      "Get structured support with any thesis chapter: introduction, literature review, methodology, results, discussion and conclusion.",
    keywords: ["thesis chapter help", "literature review help", "methodology chapter", "dissertation support"],
    image: "/images/services/chapters-blue.webp",
    intro: [
      "Writing a thesis involves developing multiple chapters, each with its own structure, purpose, and level of complexity. From building a strong introduction to presenting clear results and conclusions, every chapter requires a distinct approach to research, analysis, and academic writing.",
      "We provide structured support to help you complete any chapter of your thesis. Whether you are starting from scratch or need help refining a specific section, our goal is to guide you toward producing clear, coherent, and academically sound work.",
    ],
    sections: [
      {
        heading: "What we support",
        intro: "We offer assistance across all major thesis chapters, including:",
        items: [
          { title: "Abstract", text: "Concise and impactful summaries of your research." },
          { title: "Introduction", text: "Clear background, problem statement, and research objectives." },
          { title: "Literature review", text: "Critical analysis and synthesis of existing research." },
          { title: "Methodology", text: "Well-structured research design and methods." },
          { title: "Data analysis and results", text: "Clear presentation and interpretation of findings." },
          { title: "Discussion and conclusion", text: "Linking results to research questions and broader implications." },
        ],
      },
      {
        heading: "How our process works",
        style: "steps",
        items: [
          { title: "Submit your request", text: "Share your requirements, guidelines, and any existing work so we can understand your needs." },
          { title: "Collaborate", text: "Engage with our team throughout the process. Ask questions, request adjustments, and stay involved." },
          { title: "Review and finalise", text: "Receive your completed chapter(s), review the work, and request refinements where necessary before final submission." },
        ],
      },
    ],
  },
  {
    slug: "critical-editing-and-review",
    title: "Critical Editing and Review",
    short: "Polish language, structure, formatting and referencing before you submit.",
    metaDescription:
      "Thesis and dissertation editing: formatting review, grammar and language editing, consistency checks and structural review to institutional standards.",
    keywords: ["thesis editing", "dissertation proofreading", "academic editing", "formatting review"],
    image: "/images/services/editing-blue.webp",
    intro: [
      "Completing your thesis or dissertation is a major milestone, but ensuring it meets academic standards requires careful editing and refinement. Even minor errors in language, structure, or formatting can affect the overall quality and credibility of your work.",
      "We provide comprehensive editing and critical review support to help you present a polished, well-structured, and academically sound final document. Our focus is on improving clarity, consistency, and adherence to institutional guidelines.",
    ],
    sections: [
      {
        heading: "What our editing and critical review services include",
        items: [
          { title: "Formatting review", text: "We check margins, spacing and alignment; headings and subheadings; and citation and referencing styles." },
          { title: "Grammar and language editing", text: "A detailed review of grammar, punctuation and spelling; sentence structure and clarity; and academic tone and readability." },
          { title: "Consistency and uniformity check", text: "We review your entire document for consistent terminology and formatting, a uniform citation and referencing style, and logical flow across all sections." },
          { title: "Structural review", text: "We assess the organisation of your work: clear and coherent chapter structure, proper paragraph development, and logical progression of ideas." },
        ],
      },
    ],
  },
  {
    slug: "journal-manuscript-support",
    title: "Journal Manuscript Support",
    short: "Shape your research into a clear, submission-ready journal article.",
    metaDescription:
      "Journal manuscript support: structuring, journal-specific formatting, language enhancement, referencing and revision support while you keep authorship.",
    keywords: ["journal manuscript help", "academic publishing support", "journal article editing", "publish research"],
    image: "/images/services/manuscript-blue.webp",
    intro: [
      "Preparing a journal manuscript is a key milestone for researchers aiming to publish their work in reputable academic journals. However, transforming your research into a well-structured, publication-ready manuscript can be time-consuming and challenging, especially when navigating journal guidelines, academic writing standards, and language precision.",
      "We provide manuscript writing support to help you develop clear, structured, and submission-ready journal articles. Our role is to guide, refine, and strengthen your work, ensuring it meets the expectations of your target journal while maintaining authorship and academic integrity.",
    ],
    sections: [
      {
        heading: "How we support your manuscript development",
        intro: "We work with you at every stage of the writing process to enhance the quality and clarity of your manuscript:",
        items: [
          { title: "Structuring your manuscript", text: "Assistance with organising your paper for logical flow and clarity." },
          { title: "Journal-specific formatting guidance", text: "Aligning your manuscript with the submission guidelines and formatting requirements of your target journal." },
          { title: "Academic writing and language enhancement", text: "Improving clarity, coherence, tone, and readability while maintaining your original ideas." },
          { title: "Referencing and citation support", text: "Ensuring accurate and consistent referencing in line with the required styles." },
          { title: "Editing and refinement", text: "Strengthening arguments, improving transitions, and polishing the final document for submission." },
        ],
      },
      {
        heading: "Why choose Knowledge Space Academy?",
        items: [
          { title: "Researcher-focused support", text: "We guide you through the process rather than replacing your authorship." },
          { title: "Experienced academic team", text: "Work with professionals familiar with diverse disciplines and journal expectations." },
          { title: "Ethical and original work", text: "We uphold strict academic integrity and support you in producing original, properly referenced manuscripts." },
          { title: "Flexible and collaborative approach", text: "Ongoing support with opportunities for feedback and revision." },
          { title: "Timely delivery", text: "Structured timelines to help you meet submission deadlines." },
        ],
      },
      {
        heading: "What we offer",
        style: "checks",
        items: [
          { title: "Efficient turnaround times", text: "We work with structured timelines to help you meet your submission deadlines without compromising on quality." },
          { title: "Collaborative revisions", text: "We provide revision support to refine your manuscript based on your feedback, ensuring the final version meets your expectations and academic standards." },
          { title: "Zero plagiarism", text: "We uphold strict academic integrity by supporting the development of original work and ensuring proper citation and referencing throughout your manuscript." },
        ],
      },
    ],
  },
  {
    slug: "research-proposal-development",
    title: "Research Proposal Development",
    short: "Present a clear, compelling and defensible research proposal.",
    metaDescription:
      "Research proposal development support for postgraduate and PhD students: topic rationale, aims and objectives, literature gap and methodology planning.",
    keywords: ["research proposal help", "PhD proposal", "postgraduate proposal", "proposal writing support"],
    image: "/images/services/proposal-blue.webp",
    intro: [
      "Developing a strong research proposal is a critical step in your academic journey, particularly for postgraduate and PhD studies. It serves as the foundation of your research, demonstrating the significance of your topic, the clarity of your objectives, and the feasibility of your approach.",
      "We provide structured research proposal development support to help you present a clear, compelling, and academically sound proposal. Our goal is to guide you in articulating your research ideas effectively while meeting institutional and disciplinary expectations.",
    ],
    sections: [
      {
        heading: "How we support your proposal development",
        intro: "We work with you to strengthen every component of your research proposal:",
        items: [
          { title: "Refining your research topic and rationale", text: "Ensuring your study is relevant, focused, and academically justified." },
          { title: "Developing clear aims and objectives", text: "Helping you define what your research seeks to achieve." },
          { title: "Literature alignment and research gap identification", text: "Positioning your study within existing research and highlighting its contribution." },
          { title: "Methodology planning", text: "Guiding you in selecting appropriate research methods and approaches." },
          { title: "Structure and academic writing support", text: "Ensuring clarity, coherence, and alignment with proposal guidelines." },
        ],
      },
      {
        heading: "Our approach",
        items: [
          { title: "Quality-focused development", text: "We emphasise clarity, coherence, and academic rigour at every stage of your proposal." },
          { title: "Commitment to academic integrity", text: "We support the development of original work and ensure proper referencing and ethical research practices." },
          { title: "Collaborative process", text: "Your input is central to the process. We work with you to refine and strengthen your ideas." },
        ],
      },
      {
        heading: "Key features of our service",
        style: "checks",
        items: [
          { title: "Clear and well-structured proposals", text: "Designed to communicate complex ideas effectively and persuasively." },
          { title: "End-to-end support", text: "Assistance from initial concept development through to final refinement." },
          { title: "Revision and refinement support", text: "Opportunities to improve your proposal based on feedback and evolving requirements." },
          { title: "Accessible ongoing support", text: "Guidance available throughout your proposal development process." },
        ],
      },
    ],
  },
];

export const serviceBySlug = (slug: string) => services.find((s) => s.slug === slug);

export const institutionalServices = [
  {
    slug: "doctoral-mentorship",
    title: "Doctoral Mentorship Programmes",
    lead: "Structured support for the doctoral journey.",
    body: [
      "We support the design, delivery and review of doctoral mentorship programmes that help institutions provide purposeful, sustained support to doctoral researchers. Our work can include developing programme frameworks, clarifying mentorship objectives and responsibilities, planning developmental activities, and reviewing existing arrangements to identify areas for improvement.",
      "Programmes can address key stages of doctoral research, including proposal development, methodological decision-making, data analysis, thesis writing and preparation for examination.",
    ],
  },
  {
    slug: "writing-retreats",
    title: "Academic Writing Retreats",
    lead: "Dedicated time, practical guidance and a clear focus on progress.",
    body: [
      "KSA helps organisations design, organise, facilitate and review academic writing retreats for faculty, researchers and postgraduate students. Retreats combine protected writing time with structured guidance, opportunities for feedback and realistic writing goals.",
      "Whether participants are developing thesis chapters, journal articles or other research outputs, we tailor the retreat to their writing stage and the institution's objectives. Formats can include focused writing sessions, facilitated discussions, writing workshops and progress reviews.",
    ],
  },
  {
    slug: "research-training",
    title: "Curated Research Training and Workshops",
    lead: "Training built around your people and research priorities.",
    body: [
      "We organise specially curated in-person and online training for faculty, postgraduate students and research teams. Sessions can be delivered as standalone workshops or as a coordinated programme that develops participants' knowledge and skills over time.",
      "We work with each organisation to agree on the focus, level, format and learning outcomes, ensuring that sessions are relevant to participants' research needs.",
    ],
    list: [
      "Research design and proposal development",
      "Literature reviews and evidence synthesis",
      "Qualitative, quantitative and mixed methods research",
      "Data collection and analysis",
      "Academic writing and preparation for publication",
      "Research software and practical analytical workflows",
    ],
  },
  {
    slug: "nvivo-training",
    title: "NVivo Training and Qualitative Data Analysis Support",
    lead: "Practical skills for organising, analysing and interpreting qualitative evidence.",
    body: [
      "KSA provides tailored NVivo training for faculty, postgraduate students and research teams, with sessions suited to beginners and participants developing more advanced analytical skills.",
      "Training can cover project setup, importing and organising materials, coding, developing and refining a coding framework, writing analytical memos, running queries and presenting findings. We connect software functions to the research questions and methodological approach so that participants understand both how to use NVivo and how it supports a thoughtful, transparent analysis.",
    ],
  },
];

export const whyChooseUs = [
  {
    title: "Bespoke academic support",
    text: "Every engagement is thoughtfully tailored to reflect your unique research objectives, ensuring a refined and personalised experience.",
  },
  {
    title: "Distinguished expertise",
    text: "Our team of accomplished academics, including PhD-qualified specialists, brings depth, precision, and intellectual excellence to every project.",
  },
  {
    title: "Excellence without compromise",
    text: "We uphold the highest standards of quality, originality, and academic integrity, delivering work that reflects true scholarly distinction.",
  },
  {
    title: "Assured professionalism",
    text: "We are committed to reliability, discretion, and client satisfaction, offering a service experience built on trust and accountability.",
  },
];

export const processSteps = [
  { title: "Share your needs", text: "Send your requirements, guidelines and any existing work." },
  { title: "Collaborate", text: "Work with our team, ask questions and request adjustments." },
  { title: "Review and finalise", text: "Review the work and request refinements before submission." },
  { title: "Ongoing support", text: "Continue with proposal, design, analysis or publication support." },
];

/** The 14 planned self-paced courses, seeded as "coming soon" in the database. */
export const plannedCourses = [
  { title: "From Interest to Inquiry: Finding Your Research Topic", summary: "Turn a broad area of interest into a focused, feasible research topic. Explore how to assess potential topics, identify a research problem and develop questions that give your study direction.", category: "Getting started" },
  { title: "The Proposal Blueprint: Building a Coherent Research Plan", summary: "Work through the core elements of a research proposal, from the problem statement and objectives to methodological choices. Learn how to connect these elements into a clear, defensible plan.", category: "Getting started" },
  { title: "Beyond Summary: Writing a Critical Literature Review", summary: "Move from describing individual studies to comparing arguments, evaluating evidence and synthesising ideas. Learn how to position your research within existing scholarship and establish its contribution.", category: "Academic writing" },
  { title: "Methodology That Makes Sense: Aligning Questions, Design and Methods", summary: "Understand how research questions inform methodological decisions. Explore qualitative, quantitative and mixed methods approaches, and learn to explain why your chosen approach suits your study.", category: "Methodology" },
  { title: "Better Questions, Richer Data: Designing Research Interviews", summary: "Learn to develop an interview guide, use effective prompts and probes, and recognise questions that may limit or lead participants' responses.", category: "Methodology" },
  { title: "From Codes to Themes: Making Sense of Qualitative Data", summary: "Explore the analytical decisions involved in coding, developing themes and interpreting qualitative evidence. Learn how to build an analysis that answers your research questions and moves beyond description.", category: "Data analysis" },
  { title: "NVivo Foundations: From Project Setup to First Codes", summary: "Build confidence in setting up an NVivo project, organising research materials, coding data and recording analytical reflections. Connect practical software skills to a purposeful analysis process.", category: "Research software" },
  { title: "Beyond Coding in NVivo: Exploring Patterns and Building Interpretations", summary: "Develop your use of queries, comparisons and visualisations to investigate relationships within your data. Learn how to assess outputs critically and use them to support your interpretation.", category: "Research software" },
  { title: "Making Numbers Meaningful: Quantitative Analysis with SPSS", summary: "Learn the foundations of preparing data, selecting suitable analyses and interpreting statistical outputs. Develop practical skills for explaining what your results mean in relation to your research questions.", category: "Data analysis" },
  { title: "Write With Direction: Building Strong Thesis Chapters", summary: "Understand the purpose of each thesis chapter and how the chapters connect. Develop clearer arguments, stronger paragraphs and a manageable writing routine.", category: "Academic writing" },
  { title: "The Discussion Chapter: Explaining What Your Findings Mean", summary: "Learn to connect findings with existing literature, address unexpected results and explain your study's contribution, implications and limitations.", category: "Academic writing" },
  { title: "From Thesis to Journal Article: Reshaping Research for Publication", summary: "Identify a focused article within a larger research project, select a suitable journal and reshape your material for its readership. Explore manuscript structure, submission preparation and responding to reviewers.", category: "Publishing" },
  { title: "Feedback to Progress: Working Through Supervisory Comments", summary: "Learn to interpret feedback, prioritise revisions and document your responses. Turn extensive or challenging comments into a practical plan for improving your work.", category: "Academic writing" },
  { title: "Ready to Defend: Preparing for Your Research Viva", summary: "Prepare to explain your research decisions, articulate your contribution and respond thoughtfully to questions. Build a structured preparation plan grounded in a thorough understanding of your study.", category: "Completion" },
];

export const defaultFaqs = [
  { q: "How do I get started with Knowledge Space Academy?", a: "You can get started by sharing your requirements via email, WhatsApp, or our online enquiry form. Once we understand your needs, we'll guide you on the next steps and provide a clear plan of support.", home: true },
  { q: "What citation styles and formatting guidelines do you support?", a: "We support all major academic citation styles. Our guidance is aligned with your university's or journal's requirements to ensure full compliance.", home: true },
  { q: "Do you check for plagiarism and AI-generated content?", a: "Yes. We provide plagiarism checks and AI detection support to help ensure your work meets academic integrity standards. We also guide you in revising flagged sections to improve originality and proper referencing.", home: true },
  { q: "Do you write the work for students?", a: "No. At Knowledge Space Academy, we focus on academic support and guidance. We help you develop, refine, and improve your work while ensuring you maintain full ownership and understanding of your research.", home: true },
  { q: "What if I'm not satisfied with the support provided?", a: "Your satisfaction is important to us. We offer revision support and will work with you to refine the output based on your feedback until it meets your academic expectations.", home: false },
  { q: "How do you ensure quality?", a: "Our process includes structured reviews, academic editing, and alignment with institutional standards to ensure clarity, accuracy, and consistency throughout your work.", home: false },
];

export const defaultBoard = [
  { name: "Dr Oluwatobi Alabi", affiliation: "University of Johannesburg" },
  { name: "Prof Mariam Seedat-Khan", affiliation: "University of KwaZulu-Natal" },
  { name: "Prof Kammila Naidoo", affiliation: "University of Johannesburg" },
  { name: "Prof Champaklal C. Jinabhai", affiliation: "Durban University of Technology" },
];

/** Options for the "Selected service" dropdown on the quote form. */
export const quoteServiceOptions = [
  ...services.map((s) => s.title),
  ...institutionalServices.map((s) => s.title),
  "Something else",
];

/**
 * The cards in the homepage carousel.
 *
 * One card per part of the website, never a single service: "Research services"
 * takes people to the services page, where all eight are listed. Keeping single
 * services out of here is deliberate, so the carousel stays a signpost rather
 * than a second services page. The admin can edit, reorder, hide or replace
 * every card in Admin > Homepage carousel.
 */
export const homeHighlights = [
  {
    id: "services",
    title: "Research services",
    caption: "All eight services, for individuals and for institutions.",
    href: "/services",
    image: "/images/services/design-blue.webp",
  },
  {
    id: "webinars",
    title: "Free monthly webinars",
    caption: "Live sessions on Zoom, every month, open to everyone.",
    href: "/webinars",
    image: "/images/services/topic-blue.webp",
  },
  {
    id: "courses",
    title: "Self-paced online courses",
    caption: "Short courses you can take at your own pace, on your own time.",
    href: "/courses",
    image: "/images/services/proposal-blue.webp",
  },
  {
    id: "publishing",
    title: "Publishing and conferences",
    caption: "Journal support, our partner journal and scholarly events.",
    href: "/publishing",
    image: "/images/services/manuscript-blue.webp",
  },
];

/* ─────────────────── Verified company facts ───────────────────
 *
 * Every number below comes from the client's own "Our Story" document, which is
 * the only approved source for figures about the academy. Nothing here is an
 * estimate or a rounding of something else, and nothing should be added to this
 * list that the client has not confirmed in writing. The earlier homepage figures
 * ("about a decade", "8 specialist services") were not from the client and have
 * been removed.
 */

/*
 * Each figure is kept as a number so it can count up on screen, with whatever
 * follows it ("+", "+ years") held separately. The three lines under it are the
 * three rows of the client's table, word for word.
 */
export const companyStats = [
  // "years" is kept apart from the figure so it can be set smaller and the
  // number does not wrap onto two lines in a narrow box.
  { value: 8, suffix: "+", unit: "years", small: "Sharing research knowledge", note: "Our seminars began in August 2018." },
  { value: 9, suffix: "", unit: "", small: "Institutional writing programmes", note: "Writing retreats and publication workshops delivered since 2022." },
  { value: 120, suffix: "+", unit: "", small: "Writing programme participant places", note: "Recorded across eight programmes with available attendance figures." },
  { value: 10, suffix: "", unit: "", small: "Free webinars", note: "Delivered since April 2026." },
  { value: 500, suffix: "+", unit: "", small: "Webinar registrations", note: "Recorded across our free webinars since April 2026." },
];

/** The three words the academy leads with, kept as three so they can be set as three. */
export const companyPillars = ["Research support", "Focused writing", "Practical progress"];

export const companyIntro =
  "Since our first seminars in August 2018, Knowledge Space Academy has supported researchers through institutional writing programmes, doctoral mentoring, practical training and free webinars.";

export const milestones = [
  { year: "2018", title: "Our first seminars", text: "Our research learning journey began in August." },
  {
    year: "2022",
    title: "Institutional writing programmes began",
    text: "Dedicated space and structured support to help researchers develop manuscripts for publication.",
  },
  { year: "2023", title: "Official registration", text: "A formal milestone in our continuing commitment to research development." },
  { year: "2026", title: "Expanding access", text: "Ten free webinars delivered since April, recording more than 500 registrations." },
];

/*
 * Training and mentoring actually delivered, as the client lists it. The bold
 * part and the rest are split only so the figure can be set larger on screen;
 * put together they are the client's three bullet points word for word, with
 * nothing added. An earlier version padded the last two out with explanations
 * nobody had approved.
 */
export const practicalSupport = [
  { lead: "6+ doctoral mentoring sessions in 2026", text: "alongside earlier sessions covering NVivo, quantitative research and mixed methods." },
  { lead: "5 sessions delivered as a full NVivo training package in 2026", text: "" },
  { lead: "1 full-day introductory NVivo training programme", text: "" },
];

export const residency = {
  title: "Five days. A clear goal: a manuscript ready for submission.",
  body: "Our curated five-day residential writing programme is designed to help each attendee finalise a manuscript for submission to a DHET-accredited journal. Protected writing time, structured guidance and focused feedback turn the residency into a practical working space, with participants working towards a concrete publication milestone.",
  caveat:
    "The goal is a submission-ready manuscript. Each participant's progress depends on their starting draft, the readiness of their research and the revisions required; publication remains subject to the journal's editorial and peer-review processes.",
};

export const marketingConsentText =
  "I would like to receive research tips, webinar announcements, course updates and other emails from Knowledge Space Academy. I can unsubscribe at any time.";
