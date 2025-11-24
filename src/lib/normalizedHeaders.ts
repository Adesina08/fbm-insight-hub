export const NORMALIZED_HEADER_MAP = {
  "A1. State": "a1_state",
  "A2. LGA": "a2_lga",
  "A3. Location": "a3_location",
  "A4. Gender of respondent": "a4_gender_of_respondent",
  "A5. How old are you (in completed years)?": "a5_how_old_are_you_in_completed_years",
  "A6. What is your current marital status?": "a6_what_is_your_current_marital_status",
  "A7. What is the highest level of formal education you have completed?":
    "a7_what_is_the_highest_level_of_formal_education_you_have_completed",
  "A8. What is your religion?": "a8_what_is_your_religion",
  "A9. What is your current employment status?": "a9_what_is_your_current_employment_status",
  "A10. What is your main occupation or source of income?":
    "a10_what_is_your_main_occupation_or_source_of_income",
  "Parity (number of children ever born)": "parity_number_of_children_ever_born",
  "B1. Have you heard about modern contraception methods?":
    "b1_have_you_heard_about_modern_contraception_methods",
  "B2. Are you currently using any modern contraception method?":
    "b2_are_you_currently_using_any_modern_contraception_method",
  "B3. If yes, which method are you currently using? (Single choice – main method)":
    "b3_if_yes_which_method_are_you_currently_using_single_choice_main_method",
  "C1. How much do you personally want to use a modern contraception method?":
    "c1_how_much_do_you_personally_want_to_use_a_modern_contraception_method",
  "C2. How strongly do you believe that using a modern contraception method will benefit you personally?":
    "c2_how_strongly_do_you_believe_that_using_a_modern_contraception_method_will_benefit_you_personally",
  "C3. How enjoyable or unpleasant do you think using a modern contraception method would be for you?":
    "c3_how_enjoyable_or_unpleasant_do_you_think_using_a_modern_contraception_method_would_be_for_you",
  "C4. How much do you think using a modern contraception method is accepted by people important to you?":
    "c4_how_much_do_you_think_using_a_modern_contraception_method_is_accepted_by_people_important_to_you",
  "D1. How easy or difficult is it for you to find a modern contraception method if you wanted to use it?":
    "d1_how_easy_or_difficult_is_it_for_you_to_find_a_modern_contraception_method_if_you_wanted_to_use_it",
  "D2. How affordable do you find modern contraception methods?":
    "d2_how_affordable_do_you_find_modern_contraception_methods",
  "D3. How physically easy or difficult would it be for you to get and use a modern contraception method?":
    "d3_how_physically_easy_or_difficult_would_it_be_for_you_to_get_and_use_a_modern_contraception_method",
  "D4. How mentally easy or difficult would it be for you to understand and remember how to use a modern contraception method?":
    "d4_how_mentally_easy_or_difficult_would_it_be_for_you_to_understand_and_remember_how_to_use_a_modern_contraception_method",
  "D5. How well does using a modern contraception method fit into your daily life or routine?":
    "d5_how_well_does_using_a_modern_contraception_method_fit_into_your_daily_life_or_routine",
  "D6. How confident are you in your ability to use a modern contraception method correctly?":
    "d6_how_confident_are_you_in_your_ability_to_use_a_modern_contraception_method_correctly",
  "E1. In the past 3 months, have you received any reminder, advice, or prompt to use a modern contraception method? (Select all that apply)":
    "e1_in_the_past_3_months_have_you_received_any_reminder_advice_or_prompt_to_use_a_modern_contraception_method_select_all_that_apply",
  "/ Yes, from a health worker": "e1_yes_from_a_health_worker",
  "/ Yes, from a partner/spouse": "e1_yes_from_a_partner_spouse",
  "/ Yes, from media (radio, TV, social media)": "e1_yes_from_media_radio_tv_social_media",
  "/ Yes, from community/religious leaders": "e1_yes_from_community_religious_leaders",
  "/ No prompts received": "e1_no_prompts_received",
  "E2. How likely are you to act on a reminder or advice to use a modern contraception method?":
    "e2_how_likely_are_you_to_act_on_a_reminder_or_advice_to_use_a_modern_contraception_method",
  "F1. In your community, how common is it for people to use a modern contraception method?":
    "f1_in_your_community_how_common_is_it_for_people_to_use_a_modern_contraception_method",
  "F2. Do most people you know approve of using modern contraception methods?":
    "f2_do_most_people_you_know_approve_of_using_modern_contraception_methods",
  "G1. How reliable do you think health facilities are in providing modern contraception methods?":
    "g1_how_reliable_do_you_think_health_facilities_are_in_providing_modern_contraception_methods",
  "G2. How respectful and supportive do you think health workers are when providing modern contraception services?":
    "g2_how_respectful_and_supportive_do_you_think_health_workers_are_when_providing_modern_contraception_services",
  "G3. Do you feel government or community systems make it easier or harder to access modern contraception methods?":
    "g3_do_you_feel_government_or_community_systems_make_it_easier_or_harder_to_access_modern_contraception_methods",
} as const;

export type NormalizedHeaderId = keyof typeof NORMALIZED_HEADER_MAP;

export type NormalizedHeaderMap = typeof NORMALIZED_HEADER_MAP;
