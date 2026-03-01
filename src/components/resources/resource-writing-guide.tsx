"use client";

import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Code,
  Variable,
  User,
  Target,
  BookOpen,
  Copy,
  Check,
} from "lucide-react";

interface CodeBlockProps {
  code: string;
}

function CodeBlock({ code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-muted/50 border rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-background/80 border opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ icon, title, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionRef = useRef<HTMLDivElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };

  return (
    <div ref={sectionRef} className="border rounded-lg overflow-hidden scroll-mt-4">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="text-primary">{icon}</span>
        <span className="font-medium text-sm flex-1">{title}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="p-3 pt-0 space-y-3 text-sm">{children}</div>}
    </div>
  );
}

export function ResourceWritingGuide() {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-card">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="w-full flex items-center gap-2 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <BookOpen className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{t("resourceWritingGuide.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("resourceWritingGuide.subtitle")}</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* General Tips */}
          <Section
            icon={<Lightbulb className="h-4 w-4" />}
            title={t("resourceWritingGuide.generalTips.title")}
            defaultOpen={true}
          >
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">1.</span>
                <div>
                  <strong className="text-foreground">{t("resourceWritingGuide.generalTips.beSpecific.title")}</strong>
                  <p>{t("resourceWritingGuide.generalTips.beSpecific.description")}</p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">2.</span>
                <div>
                  <strong className="text-foreground">{t("resourceWritingGuide.generalTips.provideContext.title")}</strong>
                  <p>{t("resourceWritingGuide.generalTips.provideContext.description")}</p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">3.</span>
                <div>
                  <strong className="text-foreground">{t("resourceWritingGuide.generalTips.defineFormat.title")}</strong>
                  <p>{t("resourceWritingGuide.generalTips.defineFormat.description")}</p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">4.</span>
                <div>
                  <strong className="text-foreground">{t("resourceWritingGuide.generalTips.setConstraints.title")}</strong>
                  <p>{t("resourceWritingGuide.generalTips.setConstraints.description")}</p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">5.</span>
                <div>
                  <strong className="text-foreground">{t("resourceWritingGuide.generalTips.includeExamples.title")}</strong>
                  <p>{t("resourceWritingGuide.generalTips.includeExamples.description")}</p>
                </div>
              </li>
            </ul>
          </Section>

          {/* Role-Playing / Act As */}
          <Section
            icon={<User className="h-4 w-4" />}
            title={t("resourceWritingGuide.rolePlaying.title")}
          >
            <p className="text-muted-foreground mb-3">{t("resourceWritingGuide.rolePlaying.description")}</p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground mb-2">{t("resourceWritingGuide.rolePlaying.basicPattern")}</h4>
                <CodeBlock
                  code={`Act as a ${"{role}"}. You are an expert in ${"{expertise}"}. Your task is to ${"{task}"}.

When responding:
- Use ${"{tone}"} tone
- Focus on ${"{focus_area}"}
- Provide ${"{output_type}"}`}
                />
              </div>

              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground mb-2">{t("resourceWritingGuide.rolePlaying.exampleExpert")}</h4>
                <CodeBlock
                  code={`Act as a Senior Software Architect with 15+ years of experience in distributed systems.

Your expertise includes:
- Microservices architecture
- Cloud-native applications (AWS, GCP, Azure)
- Performance optimization and scalability
- Security best practices

When reviewing code or architecture:
1. First, identify potential issues and bottlenecks
2. Explain the impact of each issue
3. Provide specific, actionable recommendations
4. Include code examples when relevant
5. Consider trade-offs and alternatives

Maintain a professional but approachable tone. Ask clarifying questions if the requirements are unclear.`}
                />
              </div>

              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground mb-2">{t("resourceWritingGuide.rolePlaying.exampleCreative")}</h4>
                <CodeBlock
                  code={`Act as a creative writing coach specializing in \${genre:science fiction}.

Your personality:
- Encouraging but honest
- Passionate about storytelling
- Detail-oriented on craft

Help writers improve their work by:
1. Analyzing narrative structure
2. Evaluating character development
3. Reviewing dialogue authenticity
4. Suggesting pacing improvements
5. Identifying plot holes or inconsistencies

Always provide specific examples from the text when giving feedback.`}
                />
              </div>

              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground mb-2">{t("resourceWritingGuide.rolePlaying.popularRoles")}</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/30 p-2 rounded">
                    <strong>Technical Roles</strong>
                    <ul className="text-muted-foreground mt-1 space-y-0.5">
                      <li>• Senior Developer</li>
                      <li>• DevOps Engineer</li>
                      <li>• Data Scientist</li>
                      <li>• Security Expert</li>
                    </ul>
                  </div>
                  <div className="bg-muted/30 p-2 rounded">
                    <strong>Creative Roles</strong>
                    <ul className="text-muted-foreground mt-1 space-y-0.5">
                      <li>• Copywriter</li>
                      <li>• Story Editor</li>
                      <li>• Marketing Strategist</li>
                      <li>• UX Designer</li>
                    </ul>
                  </div>
                  <div className="bg-muted/30 p-2 rounded">
                    <strong>Educational Roles</strong>
                    <ul className="text-muted-foreground mt-1 space-y-0.5">
                      <li>• Tutor / Teacher</li>
                      <li>• Language Coach</li>
                      <li>• Career Advisor</li>
                      <li>• Research Assistant</li>
                    </ul>
                  </div>
                  <div className="bg-muted/30 p-2 rounded">
                    <strong>Business Roles</strong>
                    <ul className="text-muted-foreground mt-1 space-y-0.5">
                      <li>• Business Analyst</li>
                      <li>• Project Manager</li>
                      <li>• HR Consultant</li>
                      <li>• Financial Advisor</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Variables */}
          <Section
            icon={<Variable className="h-4 w-4" />}
            title={t("resourceWritingGuide.variables.title")}
          >
            <p className="text-muted-foreground mb-3">{t("resourceWritingGuide.variables.description")}</p>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground mb-2">{t("resourceWritingGuide.variables.syntax")}</h4>
                <div className="bg-muted/30 p-3 rounded-md space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-2 py-0.5 rounded border font-mono">{`\${variable_name}`}</code>
                    <span className="text-muted-foreground">— {t("resourceWritingGuide.variables.requiredVar")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-2 py-0.5 rounded border font-mono">{`\${variable_name:default value}`}</code>
                    <span className="text-muted-foreground">— {t("resourceWritingGuide.variables.withDefault")}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground mb-2">{t("resourceWritingGuide.variables.simpleExample")}</h4>
                <CodeBlock
                  code={`Write a \${tone:professional} email to \${recipient} about \${topic}.

The email should:
- Be approximately \${length:200} words
- Include a clear call to action
- Use \${language:English} language`}
                />
              </div>

              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground mb-2">{t("resourceWritingGuide.variables.advancedExample")}</h4>
                <CodeBlock
                  code={`Act as a \${role:Technical Writer} creating documentation for \${project_name}.

## Context
- Target audience: \${audience:developers}
- Documentation type: \${doc_type:API reference}
- Technical level: \${level:intermediate}

## Requirements
1. Use \${style:clear and concise} writing style
2. Include code examples in \${programming_language:JavaScript}
3. Follow \${standard:Google developer documentation} guidelines

## Content to Document
\${content}

## Output Format
\${format:Markdown with code blocks}`}
                />
              </div>

              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground mb-2">{t("resourceWritingGuide.variables.bestPractices")}</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• {t("resourceWritingGuide.variables.tip1")}</li>
                  <li>• {t("resourceWritingGuide.variables.tip2")}</li>
                  <li>• {t("resourceWritingGuide.variables.tip3")}</li>
                  <li>• {t("resourceWritingGuide.variables.tip4")}</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* Structured Resources - JSON/YAML */}
          <Section
            icon={<Code className="h-4 w-4" />}
            title={t("resourceWritingGuide.structured.title")}
          >
            <p className="text-muted-foreground mb-3">{t("resourceWritingGuide.structured.description")}</p>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground mb-2">{t("resourceWritingGuide.structured.whenToUse")}</h4>
                <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                  <li>• {t("resourceWritingGuide.structured.useCase1")}</li>
                  <li>• {t("resourceWritingGuide.structured.useCase2")}</li>
                  <li>• {t("resourceWritingGuide.structured.useCase3")}</li>
                  <li>• {t("resourceWritingGuide.structured.useCase4")}</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground mb-2">{t("resourceWritingGuide.structured.jsonExample")}</h4>
                <CodeBlock
                  code={`{
  "role": "Technical Interviewer",
  "expertise": ["System Design", "Algorithms", "Behavioral"],
  "context": {
    "position": "\${position:Senior Software Engineer}",
    "company_type": "\${company_type:startup}",
    "interview_round": "\${round:technical}"
  },
  "instructions": {
    "difficulty": "\${difficulty:medium}",
    "duration_minutes": 45,
    "focus_areas": [
      "Problem-solving approach",
      "Code quality",
      "Communication skills"
    ]
  },
  "output_format": {
    "include_hints": true,
    "provide_solution": false,
    "evaluation_criteria": [
      "Correctness",
      "Efficiency", 
      "Code readability"
    ]
  },
  "question": "\${interview_question}"
}`}
                />
              </div>

              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground mb-2">{t("resourceWritingGuide.structured.yamlExample")}</h4>
                <CodeBlock
                  code={`role: Content Strategist
persona:
  name: ContentBot
  tone: professional yet friendly
  expertise:
    - SEO optimization
    - Content marketing
    - Social media strategy

task:
  type: \${content_type:blog post}
  topic: "\${topic}"
  target_audience: \${audience:general}
  
requirements:
  word_count: \${word_count:1000}
  keywords:
    - \${keyword1}
    - \${keyword2:optional}
  include_sections:
    - Introduction with hook
    - Main content (3-5 sections)
    - Actionable takeaways
    - Conclusion with CTA

style_guide:
  voice: \${voice:informative}
  reading_level: \${reading_level:8th grade}
  formatting:
    - Use headers and subheaders
    - Include bullet points
    - Add relevant examples

output:
  format: markdown
  include_meta_description: true
  suggest_images: true`}
                />
              </div>

              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground mb-2">{t("resourceWritingGuide.structured.agentWorkflow")}</h4>
                <CodeBlock
                  code={`{
  "agent": {
    "name": "Research Assistant",
    "version": "1.0",
    "description": "Multi-step research and analysis agent"
  },
  "workflow": {
    "steps": [
      {
        "id": "research",
        "action": "gather_information",
        "input": "\${research_topic}",
        "sources": ["web", "academic", "news"]
      },
      {
        "id": "analyze",
        "action": "analyze_findings",
        "depends_on": "research",
        "criteria": [
          "relevance",
          "credibility",
          "recency"
        ]
      },
      {
        "id": "synthesize",
        "action": "create_summary",
        "depends_on": "analyze",
        "format": "\${output_format:executive summary}",
        "max_length": "\${max_words:500}"
      }
    ]
  },
  "constraints": {
    "time_limit": "5 minutes",
    "fact_check": true,
    "cite_sources": true
  }
}`}
                />
              </div>

              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground mb-2">{t("resourceWritingGuide.structured.tips")}</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• {t("resourceWritingGuide.structured.tip1")}</li>
                  <li>• {t("resourceWritingGuide.structured.tip2")}</li>
                  <li>• {t("resourceWritingGuide.structured.tip3")}</li>
                  <li>• {t("resourceWritingGuide.structured.tip4")}</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* Output Optimization */}
          <Section
            icon={<Target className="h-4 w-4" />}
            title={t("resourceWritingGuide.outputOptimization.title")}
          >
            <p className="text-muted-foreground mb-3">{t("resourceWritingGuide.outputOptimization.description")}</p>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground mb-2">{t("resourceWritingGuide.outputOptimization.formatInstructions")}</h4>
                <CodeBlock
                  code={`## Output Requirements

Format your response as follows:

### Summary (2-3 sentences)
Brief overview of the main points.

### Key Findings
- Bullet point 1
- Bullet point 2
- Bullet point 3

### Detailed Analysis
[Provide in-depth analysis here]

### Recommendations
1. First recommendation with explanation
2. Second recommendation with explanation

### Next Steps
Action items with owners and deadlines if applicable.`}
                />
              </div>

              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground mb-2">{t("resourceWritingGuide.outputOptimization.constraintExamples")}</h4>
                <div className="grid gap-2 text-xs">
                  <div className="bg-muted/30 p-2 rounded">
                    <strong className="text-foreground">{t("resourceWritingGuide.outputOptimization.lengthConstraints")}</strong>
                    <p className="text-muted-foreground">{t("resourceWritingGuide.outputOptimization.lengthExample")}</p>
                  </div>
                  <div className="bg-muted/30 p-2 rounded">
                    <strong className="text-foreground">{t("resourceWritingGuide.outputOptimization.styleConstraints")}</strong>
                    <p className="text-muted-foreground">{t("resourceWritingGuide.outputOptimization.styleExample")}</p>
                  </div>
                  <div className="bg-muted/30 p-2 rounded">
                    <strong className="text-foreground">{t("resourceWritingGuide.outputOptimization.contentConstraints")}</strong>
                    <p className="text-muted-foreground">{t("resourceWritingGuide.outputOptimization.contentExample")}</p>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
