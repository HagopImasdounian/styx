import {Link} from 'react-router';

/** Text-led until the family's own workshop photography is available. */
export function HomeHands() {
  return (
    <section className="styx-family-note" aria-labelledby="family-title">
      <div>
        <p className="styx-eyebrow">The hands behind it</p>
        <span className="styx-family-years">
          50<span>years in the gold trade</span>
        </span>
      </div>
      <div>
        <h2 id="family-title">
          A family trade.
          <br />
          <em>An open book.</em>
        </h2>
        <p>
          Our uncle still casts by hand, in a crucible older than most jewelers.
          Our family has weighed, tested and traded gold for fifty years. We
          know what it costs to make a chain properly, so we show you.
        </p>
        <Link to="/about" prefetch="intent" className="styx-text-link">
          Meet the family <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <p className="styx-family-aside">
        Weighed when it arrives.
        <br />
        Weighed again before
        <br />
        it ships.
      </p>
    </section>
  );
}
