import { Button } from '@krinly/ui/components/button';
import { Card, CardTitle } from '@krinly/ui/components/card';
import {
  ACTION_LABEL,
  type AutomationTemplate,
  TRIGGER_LABEL,
} from '@/lib/preview/workspace-domain';

/** The focused set of ready-made automations a merchant can start from. */
export function TemplatesGallery({
  templates,
  onUse,
}: {
  templates: readonly AutomationTemplate[];
  onUse: (template: AutomationTemplate) => void;
}) {
  return (
    <Card padding="lg" aria-labelledby="automation-templates-heading" className="min-w-0">
      <CardTitle id="automation-templates-heading" className="text-xl">
        Templates
      </CardTitle>
      <p className="mt-1 text-sm text-ink-2">
        Start from a ready-made automation and adjust it to how your studio works.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div key={template.id} className="flex flex-col gap-2 rounded-xl border border-line p-4">
            <h3 className="font-display text-[15px] font-semibold text-ink">{template.name}</h3>
            <p className="text-[13px] text-ink-2">{template.description}</p>
            <p className="text-[12px] text-ink-3">
              Trigger: {TRIGGER_LABEL[template.trigger]}
              {template.actions[0] ? ` · ${ACTION_LABEL[template.actions[0].kind]}` : ''}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-1 self-start"
              onClick={() => {
                onUse(template);
              }}
            >
              Use template
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
