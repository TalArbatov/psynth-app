type Page = 'osc' | 'fx' | 'seq';

export function MainTabs({
  activePage,
  onChange,
}: {
  activePage: Page;
  onChange: (page: Page) => void;
}) {
  return (
    <div className="main-tabs">
      <div
        className={`main-tab${activePage === 'osc' ? ' active' : ''}`}
        data-page="osc"
        onClick={() => onChange('osc')}
      >
        Osc
      </div>
      <div
        className={`main-tab${activePage === 'fx' ? ' active' : ''}`}
        data-page="fx"
        onClick={() => onChange('fx')}
      >
        FX
      </div>
      <div
        className={`main-tab${activePage === 'seq' ? ' active' : ''}`}
        data-page="seq"
        onClick={() => onChange('seq')}
      >
        Seq
      </div>
    </div>
  );
}
