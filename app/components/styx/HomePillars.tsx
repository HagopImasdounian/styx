const PILLARS = [
  {title: 'Live gold pricing', body: 'The value of every gram, in the open.'},
  {title: 'Five-year buyback', body: 'Sell it back for the value of its gold.'},
  {title: 'Weighed. Tested. Verified.', body: 'Checked before it reaches you.'},
];

export function HomePillars() {
  return (
    <section className="styx-promise-strip" aria-label="Our three promises">
      {PILLARS.map((pillar) => (
        <div key={pillar.title}>
          <span className="styx-promise-dot" aria-hidden="true" />
          <div>
            <h2>{pillar.title}</h2>
            <p>{pillar.body}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
