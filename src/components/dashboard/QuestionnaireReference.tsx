import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const QuestionnaireReference = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>BEHAV360 Assessment Tool - Questionnaire Reference</CardTitle>
          <CardDescription>
            Complete questionnaire structure with variable mapping for analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {/* Demographics */}
            <AccordionItem value="demographics">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">A1-A12</Badge>
                  <span className="font-semibold">Demographics & Background</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm">
                  <div className="grid gap-2">
                    <p><strong>A1. State:</strong> Text (open)</p>
                    <p><strong>A2. LGA:</strong> Text (open)</p>
                    <p><strong>A3. Location:</strong> 1=Urban, 2=Rural</p>
                    <p><strong>A4. Gender:</strong> 1=Male, 2=Female</p>
                    <p><strong>A5. Age:</strong> Numeric (years)</p>
                    <p><strong>A6. Marital Status:</strong> 1=Never married, 2=Married/Cohabiting, 3=Divorced, 4=Separated, 5=Widow/Widower, 98=Refused</p>
                    <p><strong>A7. Education:</strong> 1=No formal, 2=Primary, 3=Secondary, 4=Vocational/Technical, 5=Higher education, 98=Refused</p>
                    <p><strong>A8. Religion:</strong> 1=Christianity, 2=Islam, 3=Traditionalist, 4=Other, 98=Refused</p>
                    <p><strong>A9. Employment Status:</strong> 1=Employed, 2=Self-employed, 3=Unemployed, 4=Student, 5=Retired, 6=Homemaker, 98=Refused</p>
                    <p><strong>A10. Occupation:</strong> 1=Farming/livestock/fishing, 2=Trading/business, 3=Artisan/manual, 4=Transport, 5=Formal employment, 6=Other</p>
                    <p><strong>A11. Media Access:</strong> Multiple choice: Radio, Television, Mobile phone, Internet, None, Other</p>
                    <p><strong>A12. Media Frequency:</strong> 1=Daily, 2=Several times/week, 3=Once/week, 4=Rarely, 5=Never</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Knowledge */}
            <AccordionItem value="knowledge">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">B1-B3</Badge>
                  <span className="font-semibold">Knowledge & Current Status</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-info/10 rounded-md border border-info/30">
                    <p className="font-semibold text-info mb-1">Binary Outcome Variable</p>
                    <p className="text-muted-foreground">B2 is recoded to create the dependent variable for regression analysis</p>
                  </div>
                  <div className="grid gap-2">
                    <p><strong>B1. Heard about modern contraception:</strong> 1=Yes, 2=No</p>
                    <p><strong>B2. Currently using modern contraception:</strong> 1=Yes, 2=No</p>
                    <p className="ml-4 text-muted-foreground">→ Recoded: 1→1 (user), 2→0 (non-user)</p>
                    <p><strong>B3. Method currently using:</strong> 1=Male condom, 2=Female condom, 3=Oral pill, 4=Injectables, 5=Implants, 6=IUD, 7=Emergency contraception, 8=Other</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Motivation */}
            <AccordionItem value="motivation">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">C1-C4</Badge>
                  <span className="font-semibold">Motivation</span>
                  <Badge className="ml-auto">Composite Score</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-primary/10 rounded-md border border-primary/30">
                    <p className="font-semibold text-primary mb-1">Motivation Score = Mean(C1, C2, C3, C4)</p>
                    <p className="text-muted-foreground">Combines desire, benefit belief, enjoyment, and social acceptance (Cronbach's α ≥ 0.7)</p>
                  </div>
                  <div className="grid gap-2">
                    <div>
                      <p className="font-semibold">C1. Personal Desire (Overall Motivation)</p>
                      <p className="text-muted-foreground">"How much do you personally want to use a modern contraception method?"</p>
                      <p className="ml-4">1=Not at all → 5=Extremely</p>
                    </div>
                    <div>
                      <p className="font-semibold">C2. Benefit Belief (Hope/Fear Driver)</p>
                      <p className="text-muted-foreground">"How strongly do you believe using a modern contraception method will benefit you?"</p>
                      <p className="ml-4">1=Not at all → 5=Extremely</p>
                    </div>
                    <div>
                      <p className="font-semibold">C3. Enjoyment (Pleasure/Pain Driver)</p>
                      <p className="text-muted-foreground">"How enjoyable or unpleasant do you think using a modern contraception method would be?"</p>
                      <p className="ml-4">1=Very unpleasant → 5=Very enjoyable</p>
                    </div>
                    <div>
                      <p className="font-semibold">C4. Social Acceptance (Belonging Driver)</p>
                      <p className="text-muted-foreground">"How much do you think using a modern contraception method is accepted by people important to you?"</p>
                      <p className="ml-4">1=Not at all accepted → 5=Fully accepted</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Ability */}
            <AccordionItem value="ability">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">D1-D6</Badge>
                  <span className="font-semibold">Ability</span>
                  <Badge className="ml-auto">Composite Score</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-chart-1/10 rounded-md border border-chart-1/30">
                    <p className="font-semibold text-chart-1 mb-1">Ability Score = Mean(D1, D2, D3, D4, D5, D6)</p>
                    <p className="text-muted-foreground">Six factors affecting capacity to perform the behavior</p>
                  </div>
                  <div className="grid gap-2">
                    <div>
                      <p className="font-semibold">D1. Time/Access</p>
                      <p className="text-muted-foreground">"How easy or difficult is it to find a modern contraception method if you wanted to use it?"</p>
                      <p className="ml-4">1=Very difficult → 5=Very easy</p>
                    </div>
                    <div>
                      <p className="font-semibold">D2. Money/Cost</p>
                      <p className="text-muted-foreground">"How affordable do you find modern contraception methods?"</p>
                      <p className="ml-4">1=Not affordable at all → 5=Very affordable</p>
                    </div>
                    <div>
                      <p className="font-semibold">D3. Physical Effort</p>
                      <p className="text-muted-foreground">"How physically easy or difficult would it be to get and use a modern contraception method?"</p>
                      <p className="ml-4">1=Very difficult → 5=Very easy</p>
                    </div>
                    <div>
                      <p className="font-semibold">D4. Mental Effort (Brain Cycles)</p>
                      <p className="text-muted-foreground">"How mentally easy or difficult would it be to understand and remember how to use?"</p>
                      <p className="ml-4">1=Very difficult → 5=Very easy</p>
                    </div>
                    <div>
                      <p className="font-semibold">D5. Routine Compatibility</p>
                      <p className="text-muted-foreground">"How well does using a modern contraception method fit into your daily life?"</p>
                      <p className="ml-4">1=Does not fit at all → 5=Fits very well</p>
                    </div>
                    <div>
                      <p className="font-semibold">D6. Skill/Confidence</p>
                      <p className="text-muted-foreground">"How confident are you in your ability to use a modern contraception method correctly?"</p>
                      <p className="ml-4">1=Not confident at all → 5=Very confident</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Prompts */}
            <AccordionItem value="prompts">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">E1-E2</Badge>
                  <span className="font-semibold">Prompts (Triggers)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-chart-2/10 rounded-md border border-chart-2/30">
                    <p className="font-semibold text-chart-2 mb-1">Prompt Analysis</p>
                    <p className="text-muted-foreground">External vs internal prompts, classified as Spark, Signal, or Facilitator based on M×A quadrant</p>
                  </div>
                  <div className="grid gap-2">
                    <div>
                      <p className="font-semibold">E1. Source of Prompt (Past 3 months)</p>
                      <p className="text-muted-foreground">"Have you received any reminder, advice, or prompt to use modern contraception?"</p>
                      <p className="ml-4">Multiple choice:</p>
                      <ul className="ml-8 list-disc text-muted-foreground">
                        <li>Yes, from a health worker</li>
                        <li>Yes, from a partner/spouse</li>
                        <li>Yes, from media (radio, TV, social media)</li>
                        <li>Yes, from community/religious leaders</li>
                        <li>No prompts received</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold">E2. Likelihood to Respond</p>
                      <p className="text-muted-foreground">"How likely are you to act on a reminder or advice to use modern contraception?"</p>
                      <p className="ml-4">1=Not at all likely → 5=Extremely likely</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Social Norms */}
            <AccordionItem value="norms">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">F1-F2</Badge>
                  <span className="font-semibold">Social Norms</span>
                  <Badge className="ml-auto">Two Indices</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-chart-3/10 rounded-md border border-chart-3/30">
                    <p className="font-semibold text-chart-3 mb-1">Social Norms Overlay</p>
                    <p className="text-muted-foreground">Descriptive (what others do) and Injunctive (what others approve) norms amplify behavior</p>
                  </div>
                  <div className="grid gap-2">
                    <div>
                      <p className="font-semibold">F1. Descriptive Norm</p>
                      <p className="text-muted-foreground">"In your community, how common is it for people to use modern contraception?"</p>
                      <p className="ml-4">1=Not common at all → 5=Very common</p>
                      <p className="ml-4 text-info">→ Used directly as descriptive norm score</p>
                    </div>
                    <div>
                      <p className="font-semibold">F2. Injunctive Norm</p>
                      <p className="text-muted-foreground">"Do most people you know approve of using modern contraception methods?"</p>
                      <p className="ml-4">1=Yes, most approve</p>
                      <p className="ml-4">2=Some approve, some disapprove</p>
                      <p className="ml-4">3=No, most disapprove</p>
                      <p className="ml-4">4=Don't know</p>
                      <p className="ml-4 text-info">→ Recoded: 1→5, 2→3, 3→1, 4→2</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* System */}
            <AccordionItem value="system">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">G1-G3</Badge>
                  <span className="font-semibold">System/Structural Enablers</span>
                  <Badge className="ml-auto">Composite Score</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-chart-4/10 rounded-md border border-chart-4/30">
                    <p className="font-semibold text-chart-4 mb-1">System Score = Mean(G1, G2, G3)</p>
                    <p className="text-muted-foreground">Institutional factors that enable or hinder behavior (policies, service delivery, supply chains)</p>
                  </div>
                  <div className="grid gap-2">
                    <div>
                      <p className="font-semibold">G1. Service Reliability & Availability</p>
                      <p className="text-muted-foreground">"How reliable do you think health facilities are in providing modern contraception methods when needed?"</p>
                      <p className="ml-4">1=Not reliable at all → 5=Very reliable</p>
                    </div>
                    <div>
                      <p className="font-semibold">G2. Provider Quality & Respect</p>
                      <p className="text-muted-foreground">"How respectful and supportive do you think health workers are when people ask about modern contraception?"</p>
                      <p className="ml-4">1=Not respectful/supportive at all → 5=Very respectful/supportive</p>
                    </div>
                    <div>
                      <p className="font-semibold">G3. Policy & Institutional Support (Infrastructure & Access)</p>
                      <p className="text-muted-foreground">"Do you feel government or community systems make it easier or harder to access modern contraception?"</p>
                      <p className="ml-4">1=Much harder → 5=Much easier</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Scoring Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Composite Score Calculations</CardTitle>
          <CardDescription>Summary of how raw questionnaire responses are transformed into analytical variables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border bg-primary/5">
              <h4 className="font-semibold mb-2">Motivation Score</h4>
              <p className="text-sm text-muted-foreground mb-2">Mean(C1, C2, C3, C4)</p>
              <p className="text-xs text-muted-foreground">Combines desire, benefit belief, enjoyment, and social acceptance into a single 1-5 scale</p>
            </div>
            <div className="p-4 rounded-lg border bg-chart-1/5">
              <h4 className="font-semibold mb-2">Ability Score</h4>
              <p className="text-sm text-muted-foreground mb-2">Mean(D1, D2, D3, D4, D5, D6)</p>
              <p className="text-xs text-muted-foreground">Six factors of ease: access, cost, physical, mental, routine, and confidence</p>
            </div>
            <div className="p-4 rounded-lg border bg-chart-3/5">
              <h4 className="font-semibold mb-2">Social Norms</h4>
              <p className="text-sm text-muted-foreground mb-2">Descriptive = F1; Injunctive = F2 (recoded)</p>
              <p className="text-xs text-muted-foreground">Two separate indices measuring peer behavior and approval</p>
            </div>
            <div className="p-4 rounded-lg border bg-chart-4/5">
              <h4 className="font-semibold mb-2">System Score</h4>
              <p className="text-sm text-muted-foreground mb-2">Mean(G1, G2, G3)</p>
              <p className="text-xs text-muted-foreground">Reliability, provider respect, and institutional access combined</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionnaireReference;
