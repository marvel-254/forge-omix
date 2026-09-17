# 09 — AI Architecture

## 9.1 AI Provider Abstraction Layer

The AI system must work with multiple providers without hard-coding to any one. The abstraction layer normalizes different APIs into a single interface.

### Provider Interface

```typescript
interface AIProvider {
  id: string;
  name: string;
  
  // Core methods
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): AsyncIterable<StreamChunk>;
  
  // Model management
  listModels(): Promise<Model[]>;
  getModel(modelId: string): Promise<Model>;
  
  // Usage tracking
  getUsage(): Promise<UsageStats>;
  
  // Capabilities
  supportsVision: boolean;
  supportsTools: boolean;
  maxContextTokens: number;
}

interface ChatRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
  stream?: boolean;
}

interface ChatResponse {
  id: string;
  model: string;
  content: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: 'stop' | 'length' | 'tool_calls';
}
```

## 9.2 Provider Implementations

### OpenRouter

The default provider. Provides access to 200+ models through a single API.

```typescript
class OpenRouterProvider implements AIProvider {
  id = 'openrouter';
  name = 'OpenRouter';
  supportsVision = true;
  supportsTools = true;
  maxContextTokens = 128000; // Varies by model
  
  constructor(private apiKey: string, private baseUrl = 'https://openrouter.ai/api/v1') {}
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://forge-omix.dev',
        'X-Title': 'Omix Builder'
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        tools: request.tools,
        stream: false
      })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new AIProviderError('OpenRouter', error);
    }
    
    const data = await res.json();
    return this.normalizeResponse(data);
  }
  
  async *stream(request: ChatRequest): AsyncIterable<StreamChunk> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...request, stream: true })
    });
    
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
      
      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        yield JSON.parse(data);
      }
    }
  }
}
```

### Ollama (Local)

Local inference for privacy and offline operation.

```typescript
class OllamaProvider implements AIProvider {
  id = 'ollama';
  name = 'Ollama (Local)';
  supportsVision = true;
  supportsTools = true;
  maxContextTokens = 8192; // Model-dependent
  
  constructor(private baseUrl = 'http://localhost:11434') {}
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages.map(m => ({
          role: m.role,
          content: m.content,
          images: m.images
        })),
        stream: false,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens
        }
      })
    });
    
    const data = await res.json();
    return this.normalizeResponse(data);
  }
  
  async listModels(): Promise<Model[]> {
    const res = await fetch(`${this.baseUrl}/api/tags`);
    const data = await res.json();
    return data.models.map((m: any) => ({
      id: m.name,
      name: m.name,
      provider: 'ollama'
    }));
  }
}
```

## 9.3 Provider Router

Routes requests to the appropriate provider with fallback:

```typescript
class ProviderRouter {
  private providers: Map<string, AIProvider> = new Map();
  private fallbackChain: string[] = ['openrouter', 'ollama'];
  
  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }
  
  async route(request: ChatRequest): Promise<ChatResponse> {
    const provider = this.providers.get(request.model.split('/')[0]) 
      || this.resolveProvider(request.model);
    
    try {
      return await provider.chat(request);
    } catch (error) {
      // Try fallback providers
      for (const fallbackId of this.fallbackChain) {
        if (fallbackId === provider.id) continue;
        const fallback = this.providers.get(fallbackId);
        if (!fallback) continue;
        
        try {
          console.warn(`Falling back to ${fallbackId} from ${provider.id}`);
          return await fallback.chat({ ...request, model: this.mapModel(request.model, fallbackId) });
        } catch {
          continue;
        }
      }
      throw error;
    }
  }
  
  private resolveProvider(modelId: string): AIProvider {
    // Model format: provider/model or just model
    const [provider] = modelId.split('/');
    return this.providers.get(provider) || this.providers.get('openrouter');
  }
}
```

## 9.4 Prompt Engineering

### System Prompt Builder

```typescript
class SystemPromptBuilder {
  build(opts: {
    project: ProjectSchema;
    currentPage?: PageSchema;
    userQuery: string;
    contextWindow: number;
  }): string {
    const parts = [
      'You are an AI design assistant for Omix Builder.',
      'You help users create, modify, and generate web applications.',
      '',
      `## Project Context`,
      `Project: ${opts.project.name}`,
      `Framework: ${opts.project.framework}`,
      `Total pages: ${opts.project.pages.length}`,
      `Total components: ${opts.project.components.length}`,
      '',
      `## Design System`,
      `Colors: ${JSON.stringify(opts.project.designTokens.colors)}`,
      `Typography: ${JSON.stringify(opts.project.designTokens.typography)}`,
      '',
      `## User Request`,
      opts.userQuery,
      '',
      `## Rules`,
      `1. Always maintain design token references`,
      `2. All components must be accessible`,
      `3. Responsive design is required`,
      `4. Use semantic HTML`,
      `5. No inline styles — use Tailwind classes`
    ];
    
    return parts.join('\n');
  }
}
```

### Component Generation Prompts

```typescript
const componentPrompts = {
  generate: (description: string, context: ProjectContext) => `
Generate a React component based on this description:
"${description}"

Context:
- Design tokens: ${JSON.stringify(context.designTokens)}
- Existing components: ${context.componentNames.join(', ')}
- Framework: React + TypeScript + Tailwind

Requirements:
- Export as default
- Use design token references for colors, spacing
- Include ARIA attributes
- Support className prop for composition
- Include TypeScript interface for props
`,

  modify: (componentId: string, instruction: string) => `
Modify component ${componentId} per this instruction:
"${instruction}"

Rules:
- Preserve all existing functionality
- Maintain accessibility attributes
- Keep TypeScript types accurate
  `,

  analyze: (schema: string) => `
Analyze this component schema for issues:
${schema}

Check for:
- Accessibility violations
- Missing ARIA attributes
- Insufficient color contrast
- Semantic HTML issues
- Responsive design gaps
  `
};
```

## 9.5 Cost Control

### Token Budget System

```typescript
interface TokenBudget {
  maxPerRequest: number;      // Max tokens in a single request
  maxPerSession: number;      // Max tokens per user session
  maxPerDay: number;          // Daily quota
  warningThreshold: number;   // Warn user at this usage
}

class BudgetManager {
  private usage: Map<string, number> = new Map(); // session tokens
  
  canProceed(sessionId: string, estimatedTokens: number, budget: TokenBudget): boolean {
    const current = this.usage.get(sessionId) || 0;
    return current + estimatedTokens <= budget.maxPerSession;
  }
  
  track(sessionId: string, tokens: number): void {
    const current = this.usage.get(sessionId) || 0;
    this.usage.set(sessionId, current + tokens);
  }
  
  shouldWarn(sessionId: string, budget: TokenBudget): boolean {
    const current = this.usage.get(sessionId) || 0;
    return current >= budget.warningThreshold;
  }
}
```

### Cost Estimation

```typescript
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

function estimateRequestCost(request: ChatRequest, modelPricing: ModelPricing): number {
  const promptTokens = estimateTokens(request.messages.map(m => m.content).join(' '));
  const completionTokens = request.maxTokens || 2047;
  
  return (promptTokens * modelPricing.promptPrice) + 
         (completionTokens * modelPricing.completionPrice);
}
```

## 9.6 Streaming Responses

AI responses stream to the UI for real-time feedback:

```typescript
// Server-Sent Events endpoint
app.post('/ai/stream', async (c) => {
  const body = await c.req.json();
  const provider = router.getProvider(body.model);
  
  const stream = provider.stream({
    model: body.model,
    messages: body.messages,
    stream: true
  });
  
  return streamSSE(c, async (sse) => {
    for await (const chunk of stream) {
      await sse.writeSSE({
        data: JSON.stringify(chunk)
      });
    }
  });
});
```

## 9.7 Privacy Configuration

### Local-First Mode

When `AI_MODE=local`:

1. All requests routed to Ollama
2. No data leaves the machine
3. No API keys required
4. Works fully offline
5. Limited to locally available models

### Cloud Mode

When `AI_MODE=cloud`:

1. Requests routed to OpenRouter
2. Schema snippets sent to API (not full project)
3. User controls what context is shared
4. Cost tracking active
5. Fallback to local on failure

### Context Filtering

Before sending to cloud, the system filters:

```typescript
function filterContext(schema: ProjectSchema, level: 'minimal' | 'standard' | 'full') {
  switch (level) {
    case 'minimal':
      // Only send component types and props
      return {
        pages: schema.pages.map(p => ({ path: p.path, componentTypes: p.components.map(/* get type */) })),
        designTokens: schema.designTokens
      };
    case 'standard':
      // Send full component tree without custom code
      return { ...schema, pages: schema.pages.map(p => ({ ...p, customCode: undefined })) };
    case 'full':
      // Send everything (for complex operations)
      return schema;
  }
}
```

## 9.8 AI Feature Set

### V1 Features

| Feature | Description |
|---------|-------------|
| Generate component | From natural language description |
| Generate page | From description with layout |
| Modify component | Change existing component |
| Fix accessibility | Analyze and fix a11y issues |
| Suggest responsive | Recommend breakpoint overrides |
| Generate copy | Write UI text content |
| Explain schema | Describe what a component does |

### Deferred Features

| Feature | Description |
|---------|-------------|
| Screenshot to design | Upload image → editable schema |
| URL to design | Fetch website → editable schema |
| Design critique | Analyze design against best practices |
| Auto-layout | Convert absolute to flexbox |

## 9.9 AI Response Validation

Every AI response is validated before application:

1. **Schema validation:** Response must be valid against JSON Schema
2. **Token validation:** All `$ref` pointers must resolve
3. **Safety check:** No executable code, no external URLs
4. **Consistency check:** Changes don't break existing references
5. **User preview:** Changes shown in preview before apply

```typescript
function validateAIResponse(response: unknown, expectedSchema: JSONSchema): ValidationResult {
  const result = validate(response, expectedSchema);
  
  if (!result.valid) {
    return { valid: false, errors: result.errors };
  }
  
  // Additional safety checks
  const responseStr = JSON.stringify(response);
  if (responseStr.includes('eval(') || responseStr.includes('Function(')) {
    return { valid: false, errors: ['Response contains executable code'] };
  }
  
  return { valid: true, errors: [] };
}
```
