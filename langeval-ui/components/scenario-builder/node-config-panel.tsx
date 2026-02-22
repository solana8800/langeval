"use client";

import { useEffect, useState } from "react";
import { Node } from "reactflow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X, Lightbulb } from "lucide-react";
import { PolicySelector } from "@/components/metrics/policy-selector";
import { useTranslations } from "next-intl";

interface NodeConfigPanelProps {
  node: Node | null;
  onClose: () => void;
  onUpdate: (id: string, data: any) => void;
}

export function NodeConfigPanel({ node, onClose, onUpdate }: NodeConfigPanelProps) {
  const t = useTranslations("ScenarioBuilderPanels.node");
  const commonT = useTranslations("Common");
  const [formData, setFormData] = useState<any>({});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (node) {
      setFormData({ ...node.data });
    }
  }, [node]);

  if (!node) return null;

  const handleChange = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
  };

  const handleSave = () => {
    // Ensure category is preserved
    const dataToSave = { ...formData };
    if (!dataToSave.category && node.data.category) {
      dataToSave.category = node.data.category;
    }
    onUpdate(node.id, dataToSave);
    // Force refresh local state to match update
    setFormData(dataToSave);
  };

  // Robust node type detection
  const rawType = formData.category || formData.type || (node.data?.category) || 'default';
  const nodeType = rawType.toLowerCase(); // Normalize to lowercase

  return (
    <Card className="w-full h-full border-none shadow-none flex flex-col rounded-none bg-white">
      <CardHeader className="flex flex-row items-center justify-between py-4 px-4 border-b">
        <CardTitle className="text-base font-semibold">{t('title')}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-2">
          <Label>{t('id')}</Label>
          <Input value={node.id} disabled className="bg-slate-50 font-mono text-xs" />
        </div>

        <div className="space-y-2">
          <Label>{t('displayLabel')}</Label>
          <Input
            value={formData.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
          />
        </div>

        {/* Dynamic Fields based on Node Type */}
        {nodeType === 'start' && (
          <div className="space-y-2">
            <Label>{t('start.desc')}</Label>
            <Textarea
              placeholder={t('start.descPlaceholder')}
              className="min-h-[100px]"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>
        )}

        {nodeType === 'persona' && (
          <>
            <div className="space-y-2">
              <Label>{t('persona.role')}</Label>
              <Input
                placeholder={t('persona.rolePlaceholder')}
                value={formData.role || ''}
                onChange={(e) => handleChange('role', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('persona.kb')}</Label>
              <Select
                value={formData.knowledgeBase || 'none'}
                onValueChange={(val) => handleChange('knowledgeBase', val)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={t('persona.kbPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('persona.kbNone')}</SelectItem>
                  <SelectItem value="kb_1">Product Manuals Vector</SelectItem>
                  <SelectItem value="kb_2">Internal Wiki</SelectItem>
                  <SelectItem value="kb_3">Policy Docs S3</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">{t('persona.kbDesc')}</p>
            </div>

            <div className="space-y-2">
              <Label>{t('persona.model')}</Label>
              <Select
                value={formData.modelProvider || 'gpt-4o'}
                onValueChange={(val) => handleChange('modelProvider', val)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={t('persona.modelPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                  <SelectItem value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</SelectItem>
                  <SelectItem value="gemini-1-5-pro">Google Gemini 1.5 Pro</SelectItem>
                  <SelectItem value="local-llama3">Local Llama 3 (Ollama)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{t('persona.temp')}</Label>
                <span className="text-xs font-mono text-slate-500">{formData.temperature ?? 0.7}</span>
              </div>
              <Slider
                defaultValue={[formData.temperature ?? 0.7]}
                max={2.0}
                step={0.1}
                onValueChange={(val) => handleChange('temperature', val[0])}
                className="py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  placeholder="e.g., 1024"
                  value={formData.max_tokens || ''}
                  onChange={(e) => handleChange('max_tokens', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Top P</Label>
                <Input
                  type="number"
                  step="0.1" min="0" max="1"
                  placeholder="e.g., 1.0"
                  value={formData.top_p || ''}
                  onChange={(e) => handleChange('top_p', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('persona.prompt')}</Label>
              <Textarea
                placeholder={t('persona.promptPlaceholder')}
                className="min-h-[100px]"
                value={formData.prompt || ''}
                onChange={(e) => handleChange('prompt', e.target.value)}
              />
            </div>
          </>
        )}

        {nodeType === 'task' && (
          <>
            <div className="space-y-2">
              <Label>{t('task.instruction')}</Label>
              <Textarea
                placeholder={t('task.instructionPlaceholder')}
                className="min-h-[100px]"
                value={formData.instruction || ''}
                onChange={(e) => handleChange('instruction', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('task.difficulty')}</Label>
              <Select
                value={formData.difficulty || 'medium'}
                onValueChange={(val) => handleChange('difficulty', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{t('task.easy')}</SelectItem>
                  <SelectItem value="medium">{t('task.medium')}</SelectItem>
                  <SelectItem value="hard">{t('task.hard')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('task.timeout')}</Label>
                <Input
                  type="number"
                  placeholder="e.g., 60"
                  value={formData.timeout || ''}
                  onChange={(e) => handleChange('timeout', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('task.outputVar')}</Label>
                <Input
                  placeholder={t('task.outputVarPlaceholder')}
                  className="font-mono text-xs"
                  value={formData.output_variable || ''}
                  onChange={(e) => handleChange('output_variable', e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {nodeType === 'condition' && (
          <>
            <div className="space-y-2">
              <Label>{t('condition.logic')}</Label>
              <Select
                value={formData.logicType || 'keyword'}
                onValueChange={(val) => handleChange('logicType', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('condition.logicPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyword">Keyword</SelectItem>
                  <SelectItem value="sentiment">Sentiment</SelectItem>
                  <SelectItem value="llm_judge">LLM Judge</SelectItem>
                  <SelectItem value="expression">Expression (Code)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.logicType === 'expression' ? (
              <div className="space-y-2">
                <Label>{t('condition.expression')}</Label>
                <Textarea
                  placeholder={t('condition.expressionPlaceholder')}
                  className="min-h-[80px] font-mono text-xs"
                  value={formData.expression || ''}
                  onChange={(e) => handleChange('expression', e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t('condition.value')}</Label>
                <Input
                  placeholder={t('condition.valuePlaceholder')}
                  value={formData.conditionValue || ''}
                  onChange={(e) => handleChange('conditionValue', e.target.value)}
                />
                {formData.logicType === 'llm_judge' && (
                  <Textarea
                    placeholder={t('condition.judgeCriteriaPlaceholder')}
                    className="mt-2 min-h-[80px]"
                    value={formData.judgeCriteria || ''}
                    onChange={(e) => handleChange('judgeCriteria', e.target.value)}
                  />
                )}
              </div>
            )}
          </>
        )}

        {nodeType === 'tool' && (
          <>
            <div className="space-y-2">
              <Label>{t('tool.name')}</Label>
              <Input
                placeholder={t('tool.namePlaceholder')}
                value={formData.functionName || ''}
                onChange={(e) => handleChange('functionName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('tool.endpoint')}</Label>
              <Input
                placeholder="https://api.example.com/v1/..."
                value={formData.endpointUrl || ''}
                onChange={(e) => handleChange('endpointUrl', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('tool.method')}</Label>
              <Select
                value={formData.method || 'GET'}
                onValueChange={(val) => handleChange('method', val)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('tool.headers')}</Label>
              <Textarea
                placeholder='{"Authorization": "Bearer token"}'
                className="min-h-[60px] font-mono text-xs"
                value={formData.headers || ''}
                onChange={(e) => handleChange('headers', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('tool.body')}</Label>
              <Textarea
                placeholder='{"id": "{{order_id}}"}'
                className="min-h-[80px] font-mono text-xs"
                value={formData.bodyTemplate || ''}
                onChange={(e) => handleChange('bodyTemplate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('tool.outputVar')}</Label>
              <Input
                placeholder={t('tool.outputVarPlaceholder')}
                value={formData.outputVar || ''}
                onChange={(e) => handleChange('outputVar', e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">{t('tool.outputVarDesc')} <code>{`{{${formData.outputVar || 'variable'}}}`}</code></p>
            </div>
          </>
        )}

        {nodeType === 'wait' && (
          <>
            <div className="space-y-2">
              <Label>{t('wait.duration')}</Label>
              <Input
                type="number"
                placeholder={t('wait.durationPlaceholder')}
                value={formData.duration || ''}
                onChange={(e) => handleChange('duration', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('wait.action')}</Label>
              <Select
                value={formData.timeoutAction || 'continue'}
                onValueChange={(val) => handleChange('timeoutAction', val)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="continue">{t('wait.continue')}</SelectItem>
                  <SelectItem value="fail">{t('wait.fail')}</SelectItem>
                  <SelectItem value="retry">{t('wait.retry')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {nodeType === 'expectation' && (
          <>
            <div className="space-y-2">
              <Label>{t('expectation.provider')}</Label>
              <Select
                value={formData.evalProvider || 'basic'}
                onValueChange={(val) => handleChange('evalProvider', val)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">{t('expectation.basic')}</SelectItem>
                  <SelectItem value="deepeval">{t('expectation.deepeval')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.evalProvider === 'deepeval' ? (
              <div className="space-y-4 border rounded-md p-3 bg-slate-50">
                <div className="space-y-1 mb-2">
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-2">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-1">
                      {t('expectation.metricsTitle')}
                    </h4>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      {t('expectation.metricsDesc')}
                    </p>
                    <ul className="list-disc list-inside text-xs text-amber-700 mt-1 ml-1 space-y-1">
                      <li>{t('expectation.metricsTip1')}</li>
                      <li>{t('expectation.metricsTip2')}</li>
                      <li>{t('expectation.metricsTip3')}</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    <PolicySelector
                      selectedMetrics={formData.metrics || []}
                      onSelectionChange={(metrics) => handleChange('metrics', metrics)}
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <Label>{t('expectation.threshold')}</Label>
                    <span className="text-xs font-mono text-slate-500">{formData.threshold || 0.7}</span>
                  </div>
                  <Input
                    type="range" min="0" max="1" step="0.1"
                    value={formData.threshold || 0.7}
                    onChange={(e) => handleChange('threshold', parseFloat(e.target.value))}
                    className="h-2"
                  />
                </div>
              </div>

            ) : (
              <div className="space-y-2">
                <Label>{t('expectation.criteria')}</Label>
                <Textarea
                  placeholder={t('expectation.criteriaPlaceholder')}
                  className="min-h-[100px]"
                  value={formData.criteria || ''}
                  onChange={(e) => handleChange('criteria', e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('expectation.severity')}</Label>
              <Select
                value={formData.severity || 'high'}
                onValueChange={(val) => handleChange('severity', val)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">{t('expectation.critical')}</SelectItem>
                  <SelectItem value="high">{t('expectation.high')}</SelectItem>
                  <SelectItem value="medium">{t('expectation.medium')}</SelectItem>
                  <SelectItem value="low">{t('expectation.low')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {nodeType === 'trigger' && (
          <>
            <div className="space-y-2">
              <Label>{t('trigger.type')}</Label>
              <Select
                value={formData.triggerType || 'manual'}
                onValueChange={(val) => handleChange('triggerType', val)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">{t('trigger.manual')}</SelectItem>
                  <SelectItem value="webhook">{t('trigger.webhook')}</SelectItem>
                  <SelectItem value="schedule">{t('trigger.schedule')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.triggerType === 'webhook' && (
              <div className="space-y-2">
                <Label>{t('trigger.webhookSlug')}</Label>
                <Input
                  placeholder="/webhooks/..."
                  value={formData.webhookSlug || ''}
                  onChange={(e) => handleChange('webhookSlug', e.target.value)}
                />
              </div>
            )}
            {formData.triggerType === 'schedule' && (
              <div className="space-y-2">
                <Label>{t('trigger.cron')}</Label>
                <Input
                  placeholder="0 0 * * *"
                  value={formData.cronExpression || ''}
                  onChange={(e) => handleChange('cronExpression', e.target.value)}
                />
              </div>
            )}
          </>
        )}

        {nodeType === 'end' && (
          <div className="space-y-2">
            <Label>{t('end.output')}</Label>
            <Textarea
              placeholder='{"status": "success", "data": ...}'
              className="min-h-[100px] font-mono text-xs"
              value={formData.outputTemplate || ''}
              onChange={(e) => handleChange('outputTemplate', e.target.value)}
            />
          </div>
        )}

        {nodeType === 'code' && (
          <>
            <div className="space-y-2">
              <Label>{t('code.language')}</Label>
              <Select
                value={formData.language || 'python'}
                onValueChange={(val) => handleChange('language', val)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="javascript">JavaScript (Node.js)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('code.code')}</Label>
              <Textarea
                placeholder="print('Hello World')..."
                className="min-h-[200px] font-mono text-xs"
                value={formData.code || ''}
                onChange={(e) => handleChange('code', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('code.inputVars')}</Label>
                <Input
                  placeholder="e.g., var1, var2"
                  value={formData.inputVars || ''}
                  onChange={(e) => handleChange('inputVars', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('code.outputVars')}</Label>
                <Input
                  placeholder="e.g., result, status"
                  value={formData.outputVars || ''}
                  onChange={(e) => handleChange('outputVars', e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {nodeType === 'transform' && (
          <>
            <div className="space-y-2">
              <Label>Transformation Spec</Label>
              <Textarea
                placeholder="JSONata/Jq..."
                className="min-h-[150px] font-mono text-xs"
                value={formData.transformSpec || ''}
                onChange={(e) => handleChange('transformSpec', e.target.value)}
              />
            </div>
          </>
        )}

        {/* Common Input/Output Schema Section */}
        <div className="pt-4 border-t space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">{t('schema.title')}</h4>
          <div className="space-y-2">
            <Label>{t('schema.inputs')}</Label>
            <Input
              placeholder="e.g., user_id, order_history (comma separated)"
              value={formData.inputKeys || ''}
              onChange={(e) => handleChange('inputKeys', e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">{t('schema.inputsDesc')}</p>
          </div>
          <div className="space-y-2">
            <Label>{t('schema.outputs')}</Label>
            <Input
              placeholder="e.g., summary, score (comma separated)"
              value={formData.outputKeys || ''}
              onChange={(e) => handleChange('outputKeys', e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">{t('schema.outputsDesc')}</p>
          </div>
        </div>

      </CardContent>

      <div className="p-4 border-t bg-slate-50">
        <Button className="w-full bg-[#D13138] hover:bg-[#b71c1c] text-white" onClick={handleSave}>
          {t('save')}
        </Button>
      </div>
    </Card >
  );
}
