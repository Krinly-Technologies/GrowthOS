import { Badge } from '@krinly/ui/components/badge';
import { Icon } from '@krinly/ui/components/icon';
import { type AcquisitionSource, SOURCE_STATE_LABEL } from '@/lib/preview/acquisition';

const TONE = {
  configured: 'verified',
  manual: 'neutral',
  'needs-integration': 'attention',
} as const;

/**
 * Whether Krinly captures this source, somebody types it in, or it needs an integration nobody
 * has built. Shown everywhere a source appears, so no screen can imply a live connection.
 */
export function SourceStateBadge({ source }: { source: AcquisitionSource }) {
  return (
    <Badge tone={TONE[source.state]}>
      {source.state === 'configured' ? <Icon name="check" /> : null}
      {source.state === 'needs-integration' ? <Icon name="alert" /> : null}
      {SOURCE_STATE_LABEL[source.state]}
    </Badge>
  );
}

/** The one-line explanation of how enquiries from a source are recorded today. */
export function SourceStateNote({ source }: { source: AcquisitionSource }) {
  return (
    <>
      {source.how}
      {source.integration ? (
        <>
          {' '}
          <span className="font-semibold text-attention">
            Automatic capture would need the {source.integration}, which is not built.
          </span>
        </>
      ) : null}
    </>
  );
}
