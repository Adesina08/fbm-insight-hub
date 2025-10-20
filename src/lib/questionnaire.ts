export interface ChoiceOption {
  value: string;
  label: string;
}

export interface ChoiceList {
  id: string;
  options: readonly ChoiceOption[];
}

export const QUESTIONNAIRE_CHOICE_LISTS = [
  {
    id: "YesNo",
    options: [
      { value: "1", label: "Yes" },
      { value: "2", label: "No" },
    ],
  },
  {
    id: "A3",
    options: [
      { value: "1", label: "Urban" },
      { value: "2", label: "Rural" },
    ],
  },
  {
    id: "A4",
    options: [
      { value: "1", label: "Male" },
      { value: "2", label: "Female" },
    ],
  },
  {
    id: "A6",
    options: [
      { value: "1", label: "Never been married" },
      { value: "2", label: "Married / Cohabiting" },
      { value: "3", label: "Divorced" },
      { value: "4", label: "Separated" },
      { value: "5", label: "Widow / Widower" },
      { value: "98", label: "Refused to answer" },
    ],
  },
  {
    id: "A7",
    options: [
      { value: "1", label: "No formal education" },
      { value: "2", label: "Primary education" },
      { value: "3", label: "Secondary education" },
      { value: "4", label: "Vocational or Technical training" },
      { value: "5", label: "Higher education (e.g., university, polytechnic)" },
      { value: "98", label: "Refused to answer" },
    ],
  },
  {
    id: "A8",
    options: [
      { value: "1", label: "Christianity" },
      { value: "2", label: "Islam" },
      { value: "3", label: "Traditionalist" },
      { value: "96", label: "Other (specify)" },
      { value: "98", label: "Refused to answer" },
    ],
  },
  {
    id: "A9",
    options: [
      { value: "1", label: "Employed (working for someone else)" },
      { value: "2", label: "Self-employed (own business)" },
      { value: "3", label: "Unemployed" },
      { value: "4", label: "Student" },
      { value: "5", label: "Retired" },
      { value: "6", label: "Homemaker" },
      { value: "98", label: "Refused to answer" },
    ],
  },
  {
    id: "A10",
    options: [
      { value: "1", label: "Farming/livestock/fishing" },
      { value: "2", label: "Trading/business (formal or informal)" },
      { value: "3", label: "Artisan/manual work (e.g., tailoring, carpentry)" },
      { value: "4", label: "Transport work (e.g., driver, okada)" },
      { value: "5", label: "Formal employment (public or private sector)" },
      { value: "96", label: "Other (specify)" },
    ],
  },
  {
    id: "A11",
    options: [
      { value: "1", label: "Radio" },
      { value: "2", label: "Television" },
      { value: "3", label: "Mobile phone (voice/SMS)" },
      { value: "4", label: "Internet (via smartphone or computer)" },
      { value: "5", label: "None" },
      { value: "96", label: "Other (specify)" },
    ],
  },
  {
    id: "A12",
    options: [
      { value: "1", label: "Daily" },
      { value: "2", label: "Several times a week" },
      { value: "3", label: "Once a week" },
      { value: "4", label: "Rarely" },
      { value: "5", label: "Never" },
    ],
  },
  {
    id: "B3",
    options: [
      { value: "1", label: "Male condom" },
      { value: "2", label: "Female condom" },
      { value: "3", label: "Oral contraceptive pill" },
      { value: "4", label: "Injectables" },
      { value: "5", label: "Implants" },
      { value: "6", label: "Intrauterine device (IUD)" },
      { value: "7", label: "Emergency contraception" },
      { value: "96", label: "Other (specify)" },
    ],
  },
  {
    id: "C1",
    options: [
      { value: "1", label: "Not at all" },
      { value: "2", label: "Slightly" },
      { value: "3", label: "Moderately" },
      { value: "4", label: "Very much" },
      { value: "5", label: "Extremely" },
    ],
  },
  {
    id: "C3",
    options: [
      { value: "1", label: "Very unpleasant" },
      { value: "2", label: "Slightly unpleasant" },
      { value: "3", label: "Neutral" },
      { value: "4", label: "Slightly enjoyable" },
      { value: "5", label: "Very enjoyable" },
    ],
  },
  {
    id: "C4",
    options: [
      { value: "1", label: "Not at all accepted" },
      { value: "2", label: "Slightly accepted" },
      { value: "3", label: "Moderately accepted" },
      { value: "4", label: "Mostly accepted" },
      { value: "5", label: "Fully accepted" },
    ],
  },
  {
    id: "D1",
    options: [
      { value: "1", label: "Very difficult" },
      { value: "2", label: "Difficult" },
      { value: "3", label: "Neutral" },
      { value: "4", label: "Easy" },
      { value: "5", label: "Very easy" },
    ],
  },
  {
    id: "D2",
    options: [
      { value: "1", label: "Not affordable at all" },
      { value: "2", label: "Slightly affordable" },
      { value: "3", label: "Moderately affordable" },
      { value: "4", label: "Mostly affordable" },
      { value: "5", label: "Very affordable" },
    ],
  },
  {
    id: "D5",
    options: [
      { value: "1", label: "Does not fit at all" },
      { value: "2", label: "Fits slightly" },
      { value: "3", label: "Fits moderately" },
      { value: "4", label: "Fits well" },
      { value: "5", label: "Fits very well" },
    ],
  },
  {
    id: "D6",
    options: [
      { value: "1", label: "Not confident at all" },
      { value: "2", label: "Slightly confident" },
      { value: "3", label: "Moderately confident" },
      { value: "4", label: "Mostly confident" },
      { value: "5", label: "Very confident" },
    ],
  },
  {
    id: "E1",
    options: [
      { value: "1", label: "Yes, from a health worker" },
      { value: "2", label: "Yes, from a partner/spouse" },
      { value: "3", label: "Yes, from media (radio, TV, social media)" },
      { value: "4", label: "Yes, from community/religious leaders" },
      { value: "5", label: "No prompts received" },
    ],
  },
  {
    id: "E2",
    options: [
      { value: "1", label: "Not at all likely" },
      { value: "2", label: "Slightly likely" },
      { value: "3", label: "Moderately likely" },
      { value: "4", label: "Very much likely" },
      { value: "5", label: "Extremely likely" },
    ],
  },
  {
    id: "F1",
    options: [
      { value: "1", label: "Not common at all" },
      { value: "2", label: "Slightly common" },
      { value: "3", label: "Moderately common" },
      { value: "4", label: "Mostly common" },
      { value: "5", label: "Very common" },
    ],
  },
  {
    id: "F2",
    options: [
      { value: "1", label: "Yes, most approve" },
      { value: "2", label: "Some approve, some disapprove" },
      { value: "3", label: "No, most disapprove" },
      { value: "4", label: "Don’t know" },
    ],
  },
  {
    id: "G1",
    options: [
      { value: "1", label: "Not reliable at all" },
      { value: "2", label: "Slightly reliable" },
      { value: "3", label: "Moderately reliable" },
      { value: "4", label: "Mostly reliable" },
      { value: "5", label: "Very reliable" },
    ],
  },
  {
    id: "G2",
    options: [
      { value: "1", label: "Not respectful/supportive at all" },
      { value: "2", label: "Slightly respectful/supportive" },
      { value: "3", label: "Moderately respectful/supportive" },
      { value: "4", label: "Mostly respectful/supportive" },
      { value: "5", label: "Very respectful/supportive" },
    ],
  },
  {
    id: "G3",
    options: [
      { value: "1", label: "Much harder" },
      { value: "2", label: "Slightly harder" },
      { value: "3", label: "No difference" },
      { value: "4", label: "Slightly easier" },
      { value: "5", label: "Much easier" },
    ],
  },
] as const satisfies readonly ChoiceList[];

export type ChoiceListId = (typeof QUESTIONNAIRE_CHOICE_LISTS)[number]["id"];

export type QuestionType = "open" | "number" | "single" | "multi" | "matrix" | "note";

export interface QuestionnaireQuestion {
  id: string;
  text: string;
  type: QuestionType;
  choiceListId?: ChoiceListId;
  allowSpecify?: boolean;
  subQuestions?: readonly QuestionnaireQuestion[];
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  questions: readonly QuestionnaireQuestion[];
}

export const QUESTIONNAIRE_SECTIONS = [
  {
    id: "A",
    title: "Respondent Profile",
    questions: [
      { id: "A1", text: "State", type: "open" },
      { id: "A2", text: "LGA", type: "open" },
      { id: "A3", text: "Location", type: "single", choiceListId: "A3" },
      { id: "A4", text: "Gender of respondent", type: "single", choiceListId: "A4" },
      { id: "A5", text: "How old are you (in completed years)?", type: "number" },
      { id: "A6", text: "What is your current marital status?", type: "single", choiceListId: "A6" },
      {
        id: "A7",
        text: "What is the highest level of formal education you have completed?",
        type: "single",
        choiceListId: "A7",
      },
      { id: "A8", text: "What is your religion?", type: "single", choiceListId: "A8", allowSpecify: true },
      { id: "A8_oth", text: "Religion (other, specify)", type: "open" },
      { id: "A9", text: "What is your current employment status?", type: "single", choiceListId: "A9" },
      {
        id: "A10",
        text: "What is your main occupation or source of income?",
        type: "single",
        choiceListId: "A10",
        allowSpecify: true,
      },
      { id: "A10_oth", text: "Main occupation or source of income (other, specify)", type: "open" },
      {
        id: "A11",
        text: "Do you have access to any of the following media? (Select all that apply)",
        type: "multi",
        choiceListId: "A11",
        allowSpecify: true,
      },
      { id: "A11_oth", text: "Media access (other, specify)", type: "open" },
      {
        id: "A12",
        text: "How often are you exposed to or use the following media channels?",
        type: "matrix",
        choiceListId: "A12",
        subQuestions: [
          { id: "A12_radio", text: "Radio", type: "single", choiceListId: "A12" },
          { id: "A12_tv", text: "Television", type: "single", choiceListId: "A12" },
          { id: "A12_mobile", text: "Mobile phone (voice/SMS)", type: "single", choiceListId: "A12" },
          { id: "A12_internet", text: "Internet (via smartphone or computer)", type: "single", choiceListId: "A12" },
          { id: "A12_other", text: "Other media specified in A11", type: "single", choiceListId: "A12" },
        ],
      },
    ],
  },
  {
    id: "B",
    title: "Knowledge & Current Status",
    questions: [
      { id: "B1", text: "Have you heard about modern contraception methods?", type: "single", choiceListId: "YesNo" },
      { id: "B2", text: "Are you currently using any modern contraception method?", type: "single", choiceListId: "YesNo" },
      {
        id: "B3",
        text: "If yes, which method are you currently using? (Single choice – main method)",
        type: "single",
        choiceListId: "B3",
        allowSpecify: true,
      },
    ],
  },
  {
    id: "C",
    title: "Motivation",
    questions: [
      {
        id: "C1",
        text: "How much do you personally want to use a modern contraception method?",
        type: "single",
        choiceListId: "C1",
      },
      {
        id: "C2",
        text: "How strongly do you believe that using a modern contraception method will benefit you personally?",
        type: "single",
        choiceListId: "C1",
      },
      {
        id: "C3",
        text: "How enjoyable or unpleasant do you think using a modern contraception method would be for you?",
        type: "single",
        choiceListId: "C3",
      },
      {
        id: "C4",
        text: "How much do you think using a modern contraception method is accepted by people important to you?",
        type: "single",
        choiceListId: "C4",
      },
    ],
  },
  {
    id: "D",
    title: "Ability",
    questions: [
      {
        id: "D1",
        text: "How easy or difficult is it for you to find a modern contraception method if you wanted to use it?",
        type: "single",
        choiceListId: "D1",
      },
      {
        id: "D2",
        text: "How affordable do you find modern contraception methods?",
        type: "single",
        choiceListId: "D2",
      },
      {
        id: "D3",
        text: "How physically easy or difficult would it be for you to get and use a modern contraception method?",
        type: "single",
        choiceListId: "D1",
      },
      {
        id: "D4",
        text: "How mentally easy or difficult would it be for you to understand and remember how to use a modern contraception method?",
        type: "single",
        choiceListId: "D1",
      },
      {
        id: "D5",
        text: "How well does using a modern contraception method fit into your daily life or routine?",
        type: "single",
        choiceListId: "D5",
      },
      {
        id: "D6",
        text: "How confident are you in your ability to use a modern contraception method correctly?",
        type: "single",
        choiceListId: "D6",
      },
    ],
  },
  {
    id: "E",
    title: "Prompts (Triggers)",
    questions: [
      {
        id: "E1",
        text: "In the past 3 months, have you received any reminder, advice, or prompt to use a modern contraception method? (Select all that apply)",
        type: "multi",
        choiceListId: "E1",
      },
      {
        id: "E2",
        text: "How likely are you to act on a reminder or advice to use a modern contraception method?",
        type: "single",
        choiceListId: "E2",
      },
    ],
  },
  {
    id: "F",
    title: "Social Norms",
    questions: [
      {
        id: "F1",
        text: "In your community, how common is it for people to use a modern contraception method?",
        type: "single",
        choiceListId: "F1",
      },
      {
        id: "F2",
        text: "Do most people you know approve of using modern contraception methods?",
        type: "single",
        choiceListId: "F2",
      },
    ],
  },
  {
    id: "G",
    title: "System/Structural Enablers",
    questions: [
      {
        id: "G1",
        text: "How reliable do you think health facilities are in providing modern contraception methods when needed?",
        type: "single",
        choiceListId: "G1",
      },
      {
        id: "G2",
        text: "How respectful and supportive do you think health workers are when people ask about modern contraception?",
        type: "single",
        choiceListId: "G2",
      },
      {
        id: "G3",
        text: "Do you feel government or community systems (health programs, clinics, outreach services) make it easier or harder to access modern contraception?",
        type: "single",
        choiceListId: "G3",
      },
    ],
  },
  {
    id: "END",
    title: "Closing",
    questions: [
      {
        id: "end_note",
        text: "Those are all the questions we have for you today. Thank you very much for your time.",
        type: "note",
      },
    ],
  },
] as const satisfies readonly QuestionnaireSection[];

const flattenQuestions = (questions: readonly QuestionnaireQuestion[]): QuestionnaireQuestion[] => {
  const result: QuestionnaireQuestion[] = [];
  questions.forEach((question) => {
    result.push(question);
    if (question.subQuestions) {
      result.push(...flattenQuestions(question.subQuestions));
    }
  });
  return result;
};

export const QUESTIONNAIRE_QUESTIONS = QUESTIONNAIRE_SECTIONS.flatMap((section) =>
  flattenQuestions(section.questions),
);

export const QUESTIONNAIRE_CHOICE_LOOKUP = Object.fromEntries(
  QUESTIONNAIRE_CHOICE_LISTS.map((list) => [list.id, list]),
) as Record<ChoiceListId, ChoiceList>;

export const QUESTIONNAIRE_QUESTION_LOOKUP = Object.fromEntries(
  QUESTIONNAIRE_QUESTIONS.map((question) => [question.id, question]),
) as Record<string, QuestionnaireQuestion>;
