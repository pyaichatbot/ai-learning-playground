/**
 * Prompt Reality Cockpit - Sample Prompts
 *
 * Provides sample prompts for testing the Context Budget Visualization.
 */

import React from 'react';
import { Button, Card } from '@/components/shared';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export interface SamplePrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'basic' | 'medium' | 'long' | 'overflow';
}

export const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    id: 'simple',
    title: 'Simple Assistant',
    description: 'Basic prompt for testing core functionality',
    category: 'basic',
    prompt: `You are a helpful assistant.

Please summarize the following article in 3 bullet points:

The article discusses the impact of artificial intelligence on modern software development. It covers topics like automated code generation, testing automation, and AI-assisted debugging. The author argues that while AI tools can significantly improve developer productivity, they also require developers to adapt their workflows and learn new skills.`,
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    description: 'Medium-length prompt with clear segmentation',
    category: 'medium',
    prompt: `You are an expert data analyst with 10 years of experience in business intelligence and statistical analysis. Your role is to help users understand complex datasets and provide actionable insights.

Instructions:
1. Always start by understanding the context and requirements
2. Analyze the data systematically, checking for outliers and patterns
3. Provide clear, concise explanations with visual recommendations
4. Include confidence levels for your findings
5. Suggest next steps for further analysis

Task: Analyze the following quarterly sales data and provide insights:

Q1 2024 Sales Data:
- Product A: $125,000 (up 15% from previous quarter)
- Product B: $89,000 (down 8% from previous quarter)
- Product C: $156,000 (up 22% from previous quarter)
- Product D: $67,000 (stable, no change)

Regional Breakdown:
- North: $287,000 (45% of total)
- South: $198,000 (31% of total)
- East: $94,000 (15% of total)
- West: $58,000 (9% of total)

Please identify:
1. Top performing products and regions
2. Areas of concern
3. Recommendations for Q2 strategy`,
  },
  {
    id: 'software-architect',
    title: 'Software Architect',
    description: 'Long prompt testing near-capacity scenarios',
    category: 'long',
    prompt: `You are a senior software architect specializing in microservices architecture, cloud-native applications, and distributed systems design. You have extensive experience with Kubernetes, Docker, service mesh technologies, and event-driven architectures.

Instructions:
1. Analyze the system architecture thoroughly
2. Identify potential bottlenecks and scalability concerns
3. Recommend improvements based on industry best practices
4. Consider cost implications of your recommendations
5. Provide migration strategies if applicable
6. Include security considerations
7. Address observability and monitoring needs
8. Consider disaster recovery and backup strategies

System Overview:
We have a monolithic application that handles 2 million daily active users. The current architecture consists of:
- A single database (PostgreSQL) with read replicas
- A monolithic backend service (Node.js/Express)
- A React frontend application
- Redis for caching
- S3 for file storage

Current Issues:
1. Database connection pool exhaustion during peak hours
2. Slow response times (p95 latency > 2 seconds)
3. Difficult to deploy new features independently
4. Scaling requires scaling the entire monolith
5. Single point of failure concerns

Requirements:
- Support 5 million daily active users within 6 months
- Maintain 99.9% uptime
- Reduce p95 latency to under 500ms
- Enable independent deployment of services
- Improve developer productivity
- Reduce infrastructure costs by 20%

Please provide:
1. A detailed microservices architecture proposal
2. Service boundaries and responsibilities
3. Data management strategy (database per service vs shared database)
4. Communication patterns (synchronous vs asynchronous)
5. API gateway and service mesh recommendations
6. Deployment strategy (Kubernetes, container orchestration)
7. Monitoring and observability stack
8. Migration plan with phases
9. Risk assessment and mitigation strategies
10. Cost analysis and optimization opportunities`,
  },
  {
    id: 'ai-researcher',
    title: 'AI Research Scientist',
    description: 'Very long prompt that may exceed 8k context window',
    category: 'overflow',
    prompt: `You are an AI research scientist with expertise in large language models, transformer architectures, reinforcement learning, and prompt engineering. You have published papers on model optimization, few-shot learning, and reasoning capabilities.

Instructions:
1. Provide comprehensive, detailed analysis
2. Cite relevant research when applicable
3. Explain technical concepts clearly
4. Consider both theoretical and practical implications
5. Address limitations and potential improvements
6. Provide code examples where relevant
7. Discuss trade-offs between different approaches
8. Consider computational efficiency
9. Address ethical considerations
10. Provide actionable recommendations

Research Question:
How can we improve the reasoning capabilities of large language models while maintaining computational efficiency and reducing hallucination rates?

Background:
Current state-of-the-art models like GPT-4, Claude 3.5, and Gemini 1.5 demonstrate impressive capabilities but still struggle with:
- Complex multi-step reasoning
- Mathematical problem solving
- Factual accuracy
- Long-context understanding
- Consistency across long conversations

Approaches to Consider:
1. Chain-of-Thought (CoT) prompting and its variants
2. Tree-of-Thought (ToT) reasoning
3. Self-consistency and verification mechanisms
4. Fine-tuning on reasoning datasets
5. Reinforcement learning from human feedback (RLHF)
6. Constitutional AI approaches
7. Retrieval-augmented generation (RAG)
8. Tool use and function calling
9. Multi-agent systems
10. Hybrid symbolic-neural approaches

Specific Areas of Focus:
- Mathematical reasoning: How can we improve performance on mathematical word problems, theorem proving, and numerical calculations?
- Logical reasoning: What techniques work best for logical deduction, constraint satisfaction, and planning?
- Causal reasoning: How can models better understand cause-and-effect relationships?
- Temporal reasoning: How to handle sequences, timelines, and temporal dependencies?
- Spatial reasoning: How can models reason about spatial relationships and geometry?

Evaluation Metrics:
- Accuracy on benchmark datasets (GSM8K, MATH, HellaSwag, etc.)
- Reasoning chain quality
- Computational cost (tokens, latency, cost per query)
- Consistency across multiple runs
- Generalization to unseen problems

Please provide:
1. A comprehensive analysis of the most promising approaches
2. Detailed explanation of how each technique works
3. Comparison of trade-offs (accuracy vs efficiency vs cost)
4. Recommendations for different use cases
5. Implementation strategies
6. Code examples or pseudocode for key techniques
7. Future research directions
8. Practical considerations for production deployment`,
  },
  {
    id: 'instruction-dilution',
    title: 'Multiple Role Definitions',
    description: 'Tests instruction dilution detection',
    category: 'medium',
    prompt: `You are a professional writer. Act as a technical documentation specialist. You're a content strategist with expertise in creating clear, concise documentation.

Instructions:
- Write in a clear, professional tone
- Use active voice
- Include code examples where relevant
- Structure content with proper headings
- Add diagrams or visual aids when helpful

Task: Create documentation for our new API endpoint.`,
  },
];

interface SamplePromptsProps {
  onSelectSample: (prompt: string) => void;
  className?: string;
}

const categoryLabels: Record<SamplePrompt['category'], string> = {
  basic: 'Basic',
  medium: 'Medium',
  long: 'Long',
  overflow: 'Overflow Test',
};

const categoryColors: Record<SamplePrompt['category'], string> = {
  basic: 'border-accent-emerald/30 bg-accent-emerald/5',
  medium: 'border-accent-blue/30 bg-accent-blue/5',
  long: 'border-accent-amber/30 bg-accent-amber/5',
  overflow: 'border-accent-red/30 bg-accent-red/5',
};

export const SamplePrompts: React.FC<SamplePromptsProps> = ({
  onSelectSample,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-content-muted" />
        <h3 className="font-semibold text-content">Sample Prompts</h3>
        <span className="text-xs text-content-subtle">or paste your own</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SAMPLE_PROMPTS.map((sample) => (
          <Card
            key={sample.id}
            className={cn(
              'p-4 cursor-pointer transition-all hover:shadow-md',
              categoryColors[sample.category]
            )}
            onClick={() => onSelectSample(sample.prompt)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-content text-sm">{sample.title}</h4>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-content-subtle/20 text-content-subtle">
                    {categoryLabels[sample.category]}
                  </span>
                </div>
                <p className="text-xs text-content-muted">{sample.description}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onSelectSample(sample.prompt);
              }}
            >
              Load Sample
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
